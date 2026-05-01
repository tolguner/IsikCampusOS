package com.isik.campusos.event.service;

import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.repository.RsvpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventRsvpService {

    private final EventRepository eventRepository;
    private final RsvpRepository rsvpRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Rsvp createRsvp(String userId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new RuntimeException("Can only RSVP to published events");
        }

        if (rsvpRepository.findByEventIdAndUserId(eventId, userId).isPresent()) {
            throw new RuntimeException("Already RSVP'd to this event");
        }

        Rsvp rsvp = Rsvp.builder()
                .eventId(eventId)
                .userId(userId)
                .build();

        if (!event.isHasCapacityLimit()) {
            rsvp.setStatus(Rsvp.RsvpStatus.CONFIRMED);
            event.setCurrentRsvpCount(event.getCurrentRsvpCount() + 1);
        } else {
            if (event.getCurrentRsvpCount() < event.getCapacity()) {
                rsvp.setStatus(Rsvp.RsvpStatus.CONFIRMED);
                event.setCurrentRsvpCount(event.getCurrentRsvpCount() + 1);
            } else {
                if (event.isHasWaitlistLimit() && event.getCurrentWaitlistCount() >= event.getWaitlistCapacity()) {
                    throw new RuntimeException("Event and waitlist are full");
                }
                rsvp.setStatus(Rsvp.RsvpStatus.WAITLISTED);
                event.setCurrentWaitlistCount(event.getCurrentWaitlistCount() + 1);
            }
        }

        eventRepository.save(event);
        return rsvpRepository.save(rsvp);
    }

    @Transactional
    public Rsvp cancelRsvp(String userId, String eventId) {
        Rsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("RSVP not found"));

        if (rsvp.getStatus() == Rsvp.RsvpStatus.CANCELLED) {
            return rsvp;
        }

        Event event = eventRepository.findById(eventId).orElseThrow();
        
        if (rsvp.getStatus() == Rsvp.RsvpStatus.CONFIRMED) {
            event.setCurrentRsvpCount(event.getCurrentRsvpCount() - 1);
            autoPromoteWaitlist(event);
        } else if (rsvp.getStatus() == Rsvp.RsvpStatus.WAITLISTED) {
            event.setCurrentWaitlistCount(event.getCurrentWaitlistCount() - 1);
        }

        rsvp.setStatus(Rsvp.RsvpStatus.CANCELLED);
        eventRepository.save(event);
        return rsvpRepository.save(rsvp);
    }

    private void autoPromoteWaitlist(Event event) {
        if (!event.isHasCapacityLimit() || event.getCurrentRsvpCount() >= event.getCapacity()) {
            return;
        }

        List<Rsvp> waitlist = rsvpRepository.findByEventIdAndStatusOrderByCreatedAtAsc(event.getId(), Rsvp.RsvpStatus.WAITLISTED);
        if (!waitlist.isEmpty()) {
            Rsvp firstInLine = waitlist.get(0);
            firstInLine.setStatus(Rsvp.RsvpStatus.CONFIRMED);
            rsvpRepository.save(firstInLine);

            event.setCurrentRsvpCount(event.getCurrentRsvpCount() + 1);
            event.setCurrentWaitlistCount(event.getCurrentWaitlistCount() - 1);
            
            // Notify user
            String payload = String.format("{\"userId\":\"%s\", \"eventId\":\"%s\", \"status\":\"PROMOTED\"}", firstInLine.getUserId(), event.getId());
            kafkaTemplate.send("event.rsvp.promoted", firstInLine.getUserId(), payload);
        }
    }

    @Transactional
    public Rsvp checkInUser(String adminId, String roles, String eventId, String targetUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        boolean isClubAdmin = event.getClub().getAdminUserId().equals(adminId);
        boolean isSystemAdmin = roles != null && (roles.contains("ROLE_SKS_ADMIN") || roles.contains("ROLE_ADMIN"));
        
        if (!isClubAdmin && !isSystemAdmin) {
            throw new RuntimeException("Unauthorized: Only club admin or system admin can check-in users");
        }

        Rsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, targetUserId)
                .orElseThrow(() -> new RuntimeException("RSVP not found"));

        if (rsvp.getStatus() != Rsvp.RsvpStatus.CONFIRMED) {
            throw new RuntimeException("User is not confirmed for this event");
        }

        rsvp.setStatus(Rsvp.RsvpStatus.ATTENDED);
        return rsvpRepository.save(rsvp);
    }
}
