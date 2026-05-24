package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.CreateEventRequest;
import com.isik.campusos.event.dto.EventCancelRequest;
import com.isik.campusos.event.dto.EventFeedbackRequest;
import com.isik.campusos.event.dto.UpdateEventRequest;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.EventChangeRequest;
import com.isik.campusos.event.model.Notification;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.EventChangeRequestRepository;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.repository.RsvpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventChangeRequestRepository eventChangeRequestRepository;
    private final ClubRepository clubRepository;
    private final RsvpRepository rsvpRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final NotificationService notificationService;

    public Event createEventDraft(String userId, CreateEventRequest request) {
        Club club = clubRepository.findById(request.getClubId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        if (!club.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Inactive clubs cannot create events");
        }
        if (!club.getAdminUserId().trim().equalsIgnoreCase(userId.trim())) {
            throw new AccessDeniedException("Only club admin can create an event");
        }
        validateEventRequest(request);

        Event event = Event.builder()
                .club(club)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(resolveLegacyLocation(request))
                .eventMode(request.getEventMode() != null ? request.getEventMode() : Event.EventMode.IN_PERSON)
                .onlinePlatform(trimToNull(request.getOnlinePlatform()))
                .onlineMeetingUrl(trimToNull(request.getOnlineMeetingUrl()))
                .locationName(trimToNull(request.getLocationName()))
                .locationDetail(trimToNull(request.getLocationDetail()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .posterImageUrl(trimToNull(request.getPosterImageUrl()))
                .hasCapacityLimit(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()))
                .capacityLimited(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()))
                .capacity(request.getCapacity())
                .hasWaitlistLimit(false)
                .waitlistCapacity(0)
                .qrCheckInEnabled(request.isQrCheckInEnabled())
                .certificateEnabled(request.isCertificateEnabled())
                .certificateTitle(request.getCertificateTitle())
                .paid(request.isPaid())
                .feeAmount(request.getFeeAmount())
                .iban(trimToNull(request.getIban()))
                .paymentInstructions(trimToNull(request.getPaymentInstructions()))
                .reminderEnabled(request.isReminderEnabled())
                .reminderOffsetsMinutes(normalizeReminderOffsets(request.getReminderOffsetsMinutes()))
                .sentReminderOffsetsMinutes("")
                .currentRsvpCount(0)
                .currentWaitlistCount(0)
                .status(Event.EventStatus.DRAFT)
                .build();

        return eventRepository.save(event);
    }

    public Event submitForApproval(String userId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (!event.getClub().getAdminUserId().trim().equalsIgnoreCase(userId.trim())) {
            throw new AccessDeniedException("Only club admin can submit");
        }
        if (isPastEvent(event)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Past events cannot be submitted for approval");
        }

        event.setStatus(Event.EventStatus.PENDING_SKS_APPROVAL);
        event.setRejectionReason(null);
        return eventRepository.save(event);
    }

    /**
     * Etkinliği onayla ve yayınla.
     * NOT: Rol kontrolü SecurityConfig'de yapılır — bu metod çağrıldığında caller zaten yetkili.
     */
    public Event approveEvent(String adminId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getStatus() != Event.EventStatus.PENDING_SKS_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is not pending approval");
        }
        if (isPastEvent(event)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Past events cannot be published");
        }

        event.setStatus(Event.EventStatus.PUBLISHED);
        event.setApprovedBy(adminId);
        event.setApprovedAt(LocalDateTime.now());
        event.setPublishedAt(LocalDateTime.now());
        Event saved = eventRepository.save(event);

        // Kafka: bildirim servisi tetikle
        String payload = String.format("{\"eventId\":\"%s\", \"title\":\"%s\", \"approvedBy\":\"%s\"}",
                saved.getId(), saved.getTitle(), adminId);
        kafkaTemplate.send("event.published", saved.getId(), payload);

        return saved;
    }

    public Event requestRevision(String adminId, String eventId, EventFeedbackRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getStatus() != Event.EventStatus.PENDING_SKS_APPROVAL
                && event.getStatus() != Event.EventStatus.REVISION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is not waiting for SKS review");
        }
        if (request.getFeedback() == null || request.getFeedback().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback is required");
        }

        event.setStatus(Event.EventStatus.REVISION_REQUESTED);
        event.setRejectionReason(request.getFeedback().trim());
        Event saved = eventRepository.save(event);

        notificationService.notifyUser(
                saved.getClub().getAdminUserId(),
                "Etkinlik düzenleme talebi",
                saved.getTitle() + " etkinliği için SKS düzenleme istedi: " + saved.getRejectionReason(),
                saved.getId()
        );

        return saved;
    }

    @Transactional
    public Event cancelEvent(String userId, String roles, String eventId, EventCancelRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        boolean isClubAdmin = event.getClub().getAdminUserId().trim().equalsIgnoreCase(userId.trim());
        boolean isSystemAdmin = roles != null && (roles.contains("ROLE_SKS_ADMIN") || roles.contains("ROLE_ADMIN"));
        if (!isClubAdmin && !isSystemAdmin) {
            throw new AccessDeniedException("Only club admin or system admin can cancel an event");
        }
        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only published events can be cancelled");
        }
        if (isPastEvent(event)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Past events cannot be cancelled");
        }

        String reason = request != null && request.getReason() != null && !request.getReason().isBlank()
                ? request.getReason().trim()
                : "Etkinlik kulüp yönetimi tarafından iptal edildi.";

        event.setStatus(Event.EventStatus.CANCELLED);
        event.setRejectionReason(reason);

        List<Rsvp> rsvps = rsvpRepository.findByEventId(eventId);
        rsvps.stream()
                .filter(rsvp -> rsvp.getStatus() != Rsvp.RsvpStatus.CANCELLED)
                .forEach(rsvp -> rsvp.setStatus(Rsvp.RsvpStatus.CANCELLED));
        if (!rsvps.isEmpty()) {
            rsvpRepository.saveAll(rsvps);
        }

        event.setCurrentRsvpCount(0);
        event.setCurrentWaitlistCount(0);
        Event saved = eventRepository.save(event);

        notificationService.notifyAudience(
                Notification.TargetAudience.ALL_STUDENTS,
                "Etkinlik iptal edildi: " + saved.getTitle(),
                saved.getClub().getName() + " kulübünün \"" + saved.getTitle() + "\" etkinliği iptal edildi.\n\nGerekçe: " + reason,
                userId,
                saved.getClub().getName(),
                saved.getId()
        );

        String payload = String.format("{\"eventId\":\"%s\", \"title\":\"%s\", \"cancelledBy\":\"%s\"}",
                saved.getId(), saved.getTitle(), userId);
        kafkaTemplate.send("event.cancelled", saved.getId(), payload);

        return saved;
    }

    public Event updateEvent(String userId, String eventId, UpdateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (!event.getClub().getAdminUserId().trim().equalsIgnoreCase(userId.trim())) {
            throw new AccessDeniedException("Only club admin can update an event");
        }
        if (isPastEvent(event)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Past events cannot be edited");
        }
        validateEventRequest(request);

        if (event.getStatus() == Event.EventStatus.PUBLISHED) {
            EventChangeRequest changeRequest = buildChangeRequest(event, userId, request);
            eventChangeRequestRepository.save(changeRequest);
            return event;
        }

        if (event.getStatus() != Event.EventStatus.DRAFT && event.getStatus() != Event.EventStatus.REVISION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event cannot be edited in current status");
        }

        applyUpdate(event, request);
        event.setStatus(Event.EventStatus.DRAFT);
        event.setRejectionReason(null);
        return eventRepository.save(event);
    }

    public List<Event> getReviewQueue() {
        return eventRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                Event.EventStatus.PENDING_SKS_APPROVAL
        ));
    }

    public List<EventChangeRequest> getChangeRequestQueue() {
        return eventChangeRequestRepository.findByStatusInOrderByCreatedAtDesc(List.of(
                EventChangeRequest.ChangeStatus.PENDING_SKS_APPROVAL,
                EventChangeRequest.ChangeStatus.REVISION_REQUESTED
        ));
    }

    public Event approveChangeRequest(String adminId, String changeRequestId) {
        EventChangeRequest changeRequest = eventChangeRequestRepository.findById(changeRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Change request not found"));

        if (changeRequest.getStatus() != EventChangeRequest.ChangeStatus.PENDING_SKS_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Change request is not pending approval");
        }

        Event event = changeRequest.getEvent();
        applyChangeRequest(event, changeRequest);
        event.setApprovedBy(adminId);
        event.setApprovedAt(LocalDateTime.now());
        event.setPublishedAt(event.getPublishedAt() == null ? LocalDateTime.now() : event.getPublishedAt());
        eventRepository.save(event);

        changeRequest.setStatus(EventChangeRequest.ChangeStatus.APPROVED);
        changeRequest.setReviewedBy(adminId);
        changeRequest.setReviewedAt(LocalDateTime.now());
        eventChangeRequestRepository.save(changeRequest);

        return event;
    }

    public EventChangeRequest requestChangeRevision(String adminId, String changeRequestId, EventFeedbackRequest request) {
        EventChangeRequest changeRequest = eventChangeRequestRepository.findById(changeRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Change request not found"));

        if (request.getFeedback() == null || request.getFeedback().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback is required");
        }

        changeRequest.setStatus(EventChangeRequest.ChangeStatus.REVISION_REQUESTED);
        changeRequest.setFeedback(request.getFeedback().trim());
        changeRequest.setReviewedBy(adminId);
        changeRequest.setReviewedAt(LocalDateTime.now());
        EventChangeRequest saved = eventChangeRequestRepository.save(changeRequest);

        notificationService.notifyUser(
                saved.getEvent().getClub().getAdminUserId(),
                "Etkinlik değişikliği düzenleme talebi",
                saved.getEvent().getTitle() + " etkinliği değişikliği için SKS düzenleme istedi: " + saved.getFeedback(),
                saved.getEvent().getId()
        );

        return saved;
    }


    public List<Event> getPublishedEvents() {
        return eventRepository.findByStatus(Event.EventStatus.PUBLISHED);
    }

    public List<Event> getClubEvents(String clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!club.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Club is not active");
        }
        return eventRepository.findByClub_IdAndStatusIn(clubId, List.of(
                Event.EventStatus.PUBLISHED,
                Event.EventStatus.COMPLETED,
                Event.EventStatus.CANCELLED
        ));
    }

    public List<Event> getManagedEvents(String adminUserId) {
        return eventRepository.findByClub_AdminUserId(adminUserId);
    }

    private EventChangeRequest buildChangeRequest(Event event, String userId, UpdateEventRequest request) {
        return EventChangeRequest.builder()
                .event(event)
                .requestedBy(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(resolveLegacyLocation(request))
                .eventMode(request.getEventMode() != null ? request.getEventMode() : Event.EventMode.IN_PERSON)
                .onlinePlatform(trimToNull(request.getOnlinePlatform()))
                .onlineMeetingUrl(trimToNull(request.getOnlineMeetingUrl()))
                .locationName(trimToNull(request.getLocationName()))
                .locationDetail(trimToNull(request.getLocationDetail()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .posterImageUrl(trimToNull(request.getPosterImageUrl()))
                .hasCapacityLimit(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()))
                .capacity(request.getCapacity())
                .capacityLimited(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()))
                .hasWaitlistLimit(false)
                .waitlistCapacity(0)
                .qrCheckInEnabled(request.isQrCheckInEnabled())
                .certificateEnabled(request.isCertificateEnabled())
                .certificateTitle(request.getCertificateTitle())
                .paid(request.isPaid())
                .feeAmount(request.getFeeAmount())
                .iban(trimToNull(request.getIban()))
                .paymentInstructions(trimToNull(request.getPaymentInstructions()))
                .reminderEnabled(request.isReminderEnabled())
                .reminderOffsetsMinutes(normalizeReminderOffsets(request.getReminderOffsetsMinutes()))
                .status(EventChangeRequest.ChangeStatus.PENDING_SKS_APPROVAL)
                .build();
    }

    private void applyUpdate(Event event, UpdateEventRequest request) {
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(resolveLegacyLocation(request));
        event.setEventMode(request.getEventMode() != null ? request.getEventMode() : Event.EventMode.IN_PERSON);
        event.setOnlinePlatform(trimToNull(request.getOnlinePlatform()));
        event.setOnlineMeetingUrl(trimToNull(request.getOnlineMeetingUrl()));
        event.setLocationName(trimToNull(request.getLocationName()));
        event.setLocationDetail(trimToNull(request.getLocationDetail()));
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setPosterImageUrl(trimToNull(request.getPosterImageUrl()));
        event.setHasCapacityLimit(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()));
        event.setCapacityLimited(isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()));
        event.setCapacity(request.getCapacity());
        event.setHasWaitlistLimit(false);
        event.setWaitlistCapacity(0);
        event.setQrCheckInEnabled(request.isQrCheckInEnabled());
        event.setCertificateEnabled(request.isCertificateEnabled());
        event.setCertificateTitle(request.getCertificateTitle());
        event.setPaid(request.isPaid());
        event.setFeeAmount(request.getFeeAmount());
        event.setIban(trimToNull(request.getIban()));
        event.setPaymentInstructions(trimToNull(request.getPaymentInstructions()));
        event.setReminderEnabled(request.isReminderEnabled());
        event.setReminderOffsetsMinutes(normalizeReminderOffsets(request.getReminderOffsetsMinutes()));
        event.setSentReminderOffsetsMinutes("");
    }

    private void applyChangeRequest(Event event, EventChangeRequest changeRequest) {
        event.setTitle(changeRequest.getTitle());
        event.setDescription(changeRequest.getDescription());
        event.setStartTime(changeRequest.getStartTime());
        event.setEndTime(changeRequest.getEndTime());
        event.setLocation(changeRequest.getLocation());
        event.setEventMode(changeRequest.getEventMode());
        event.setOnlinePlatform(changeRequest.getOnlinePlatform());
        event.setOnlineMeetingUrl(changeRequest.getOnlineMeetingUrl());
        event.setLocationName(changeRequest.getLocationName());
        event.setLocationDetail(changeRequest.getLocationDetail());
        event.setLatitude(changeRequest.getLatitude());
        event.setLongitude(changeRequest.getLongitude());
        event.setPosterImageUrl(changeRequest.getPosterImageUrl());
        event.setHasCapacityLimit(changeRequest.isHasCapacityLimit());
        event.setCapacityLimited(changeRequest.isCapacityLimited());
        event.setCapacity(changeRequest.getCapacity());
        event.setHasWaitlistLimit(false);
        event.setWaitlistCapacity(0);
        event.setQrCheckInEnabled(changeRequest.isQrCheckInEnabled());
        event.setCertificateEnabled(changeRequest.isCertificateEnabled());
        event.setCertificateTitle(changeRequest.getCertificateTitle());
        event.setPaid(changeRequest.isPaid());
        event.setFeeAmount(changeRequest.getFeeAmount());
        event.setIban(changeRequest.getIban());
        event.setPaymentInstructions(changeRequest.getPaymentInstructions());
        event.setReminderEnabled(changeRequest.isReminderEnabled());
        event.setReminderOffsetsMinutes(changeRequest.getReminderOffsetsMinutes());
        event.setSentReminderOffsetsMinutes("");
    }

    private boolean isCapacityLimited(boolean capacityLimited, boolean hasCapacityLimit) {
        return capacityLimited || hasCapacityLimit;
    }

    private void validateEventRequest(CreateEventRequest request) {
        validateCoreEventFields(
                request.getTitle(),
                request.getEventMode(),
                request.getOnlineMeetingUrl(),
                request.getLocationName(),
                request.getLatitude(),
                request.getLongitude(),
                isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()),
                request.getCapacity(),
                request.isPaid(),
                request.getIban()
        );
    }

    private void validateEventRequest(UpdateEventRequest request) {
        validateCoreEventFields(
                request.getTitle(),
                request.getEventMode(),
                request.getOnlineMeetingUrl(),
                request.getLocationName(),
                request.getLatitude(),
                request.getLongitude(),
                isCapacityLimited(request.isCapacityLimited(), request.isHasCapacityLimit()),
                request.getCapacity(),
                request.isPaid(),
                request.getIban()
        );
    }

    private void validateCoreEventFields(String title,
                                         Event.EventMode eventMode,
                                         String onlineMeetingUrl,
                                         String locationName,
                                         Double latitude,
                                         Double longitude,
                                         boolean capacityLimited,
                                         int capacity,
                                         boolean paid,
                                         String iban) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event title is required");
        }
        Event.EventMode resolvedMode = eventMode != null ? eventMode : Event.EventMode.IN_PERSON;
        if (resolvedMode == Event.EventMode.ONLINE && (onlineMeetingUrl == null || onlineMeetingUrl.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Online event meeting URL is required");
        }
        if (resolvedMode == Event.EventMode.IN_PERSON
                && (locationName == null || locationName.isBlank() || latitude == null || longitude == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "In-person event location and map pin are required");
        }
        if (capacityLimited && capacity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limited capacity must be greater than zero");
        }
        if (paid && (iban == null || iban.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IBAN is required for paid events");
        }
    }

    private String resolveLegacyLocation(CreateEventRequest request) {
        String locationName = trimToNull(request.getLocationName());
        return locationName != null ? locationName : trimToNull(request.getLocation());
    }

    private String resolveLegacyLocation(UpdateEventRequest request) {
        String locationName = trimToNull(request.getLocationName());
        return locationName != null ? locationName : trimToNull(request.getLocation());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeReminderOffsets(List<Integer> offsets) {
        if (offsets == null) {
            return "";
        }
        return offsets.stream()
                .filter(value -> value != null && value > 0)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .limit(8)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private boolean isPastEvent(Event event) {
        LocalDateTime boundary = event.getEndTime() != null ? event.getEndTime() : event.getStartTime();
        return boundary != null && boundary.isBefore(LocalDateTime.now());
    }
}
