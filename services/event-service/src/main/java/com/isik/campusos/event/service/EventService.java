package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.CreateEventRequest;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public Event createEventDraft(String userId, CreateEventRequest request) {
        Club club = clubRepository.findById(request.getClubId())
                .orElseThrow(() -> new RuntimeException("Club not found"));

        // Only club admin can create an event
        if (!club.getAdminUserId().equals(userId)) {
            throw new RuntimeException("Only club admin can create an event");
        }

        Event event = Event.builder()
                .club(club)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .hasCapacityLimit(request.isHasCapacityLimit())
                .capacity(request.getCapacity())
                .hasWaitlistLimit(request.isHasWaitlistLimit())
                .waitlistCapacity(request.getWaitlistCapacity())
                .currentRsvpCount(0)
                .currentWaitlistCount(0)
                .status(Event.EventStatus.DRAFT)
                .build();

        return eventRepository.save(event);
    }

    public Event submitForApproval(String userId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getClub().getAdminUserId().equals(userId)) {
            throw new RuntimeException("Only club admin can submit");
        }

        event.setStatus(Event.EventStatus.PENDING_SKS_APPROVAL);
        return eventRepository.save(event);
    }

    /**
     * Etkinliği onayla ve yayınla.
     * NOT: Rol kontrolü SecurityConfig'de yapılır — bu metod çağrıldığında caller zaten yetkili.
     */
    public Event approveEvent(String adminId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() != Event.EventStatus.PENDING_SKS_APPROVAL) {
            throw new RuntimeException("Event is not pending approval");
        }

        event.setStatus(Event.EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);

        // Kafka: bildirim servisi tetikle
        String payload = String.format("{\"eventId\":\"%s\", \"title\":\"%s\", \"approvedBy\":\"%s\"}",
                saved.getId(), saved.getTitle(), adminId);
        kafkaTemplate.send("event.published", saved.getId(), payload);

        return saved;
    }


    public List<Event> getPublishedEvents() {
        return eventRepository.findByStatus(Event.EventStatus.PUBLISHED);
    }
}
