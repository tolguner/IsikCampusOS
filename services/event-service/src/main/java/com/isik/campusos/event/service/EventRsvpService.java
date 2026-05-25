package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.CertificateIssueResponse;
import com.isik.campusos.event.dto.EventParticipantResponse;
import com.isik.campusos.event.model.AuditLog;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.Rsvp;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventRsvpService {

    private final EventRepository eventRepository;
    private final RsvpRepository rsvpRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public Rsvp createRsvp(String userId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Can only RSVP to published events");
        }

        Optional<Rsvp> existingRsvp = rsvpRepository.findByEventIdAndUserId(eventId, userId);
        if (existingRsvp.isPresent() && existingRsvp.get().getStatus() != Rsvp.RsvpStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already RSVP'd to this event");
        }

        Rsvp rsvp = existingRsvp.orElseGet(() -> Rsvp.builder()
                .eventId(eventId)
                .userId(userId)
                .build());
        rsvp.setPaymentReviewedAt(null);
        rsvp.setPaymentReviewedBy(null);
        rsvp.setPaymentRejectionReason(null);
        rsvp.setCheckedInAt(null);
        rsvp.setCheckedInBy(null);
        rsvp.setCertificateSentAt(null);
        rsvp.setCheckInToken(null);

        if (!event.isHasCapacityLimit()) {
            applyInitialRsvpStatus(event, rsvp);
            event.setCurrentRsvpCount(event.getCurrentRsvpCount() + 1);
        } else {
            if (event.getCurrentRsvpCount() < event.getCapacity()) {
                applyInitialRsvpStatus(event, rsvp);
                event.setCurrentRsvpCount(event.getCurrentRsvpCount() + 1);
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Event capacity is full");
            }
        }

        eventRepository.save(event);
        return rsvpRepository.save(rsvp);
    }

    @Transactional
    public Rsvp cancelRsvp(String userId, String eventId) {
        Rsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP not found"));

        if (rsvp.getStatus() == Rsvp.RsvpStatus.CANCELLED) {
            return rsvp;
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        
        if (rsvp.getStatus() == Rsvp.RsvpStatus.CONFIRMED || rsvp.getStatus() == Rsvp.RsvpStatus.PENDING_PAYMENT) {
            event.setCurrentRsvpCount(event.getCurrentRsvpCount() - 1);
        } else if (rsvp.getStatus() == Rsvp.RsvpStatus.WAITLISTED) {
            event.setCurrentWaitlistCount(event.getCurrentWaitlistCount() - 1);
        }

        rsvp.setStatus(Rsvp.RsvpStatus.CANCELLED);
        eventRepository.save(event);
        return rsvpRepository.save(rsvp);
    }

    @Transactional
    public Rsvp checkInUser(String adminId, String roles, String eventId, String targetUserId) {
        Event event = getEventForClubManagement(adminId, eventId);
        ensureEventAcceptsCheckIns(event);

        Rsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP not found"));

        if (rsvp.getStatus() != Rsvp.RsvpStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is not confirmed for this event");
        }

        markAttended(rsvp, adminId);
        Rsvp saved = rsvpRepository.save(rsvp);
        auditLogService.record(AuditLog.EntityType.EVENT, eventId, "MANUAL_CHECK_IN", adminId, roles,
                targetUserId + " öğrencisinin yoklaması manuel alındı.");
        return saved;
    }

    @Transactional
    public Rsvp approvePayment(String adminId, String roles, String eventId, String rsvpId) {
        Event event = getEventForClubManagement(adminId, eventId);
        ensureEventIsNotPast(event, "Past events cannot accept payment review");
        Rsvp rsvp = rsvpRepository.findById(rsvpId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP not found"));
        ensureRsvpBelongsToEvent(rsvp, eventId);

        if (!event.isPaid()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is not paid");
        }
        if (rsvp.getStatus() != Rsvp.RsvpStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RSVP is not waiting for payment approval");
        }

        rsvp.setStatus(Rsvp.RsvpStatus.CONFIRMED);
        rsvp.setCheckInToken(generateCheckInToken());
        rsvp.setPaymentReviewedAt(LocalDateTime.now());
        rsvp.setPaymentReviewedBy(adminId);
        rsvp.setPaymentRejectionReason(null);
        Rsvp saved = rsvpRepository.save(rsvp);
        auditLogService.record(AuditLog.EntityType.EVENT, eventId, "PAYMENT_APPROVED", adminId, roles,
                rsvp.getUserId() + " öğrencisinin ödemesi onaylandı.");
        return saved;
    }

    @Transactional
    public Rsvp rejectPayment(String adminId, String roles, String eventId, String rsvpId) {
        Event event = getEventForClubManagement(adminId, eventId);
        ensureEventIsNotPast(event, "Past events cannot accept payment review");
        Rsvp rsvp = rsvpRepository.findById(rsvpId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP not found"));
        ensureRsvpBelongsToEvent(rsvp, eventId);

        if (rsvp.getStatus() != Rsvp.RsvpStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RSVP is not waiting for payment approval");
        }

        rsvp.setStatus(Rsvp.RsvpStatus.CANCELLED);
        rsvp.setPaymentReviewedAt(LocalDateTime.now());
        rsvp.setPaymentReviewedBy(adminId);
        rsvp.setPaymentRejectionReason("Ödeme onaylanmadı");
        event.setCurrentRsvpCount(Math.max(0, event.getCurrentRsvpCount() - 1));
        eventRepository.save(event);
        Rsvp saved = rsvpRepository.save(rsvp);
        auditLogService.record(AuditLog.EntityType.EVENT, eventId, "PAYMENT_REJECTED", adminId, roles,
                rsvp.getUserId() + " öğrencisinin ödemesi reddedildi.");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Rsvp> listMyRsvps(String userId) {
        return rsvpRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<EventParticipantResponse> listParticipants(String adminId, String roles, String eventId) {
        Event event = getEventForManagement(adminId, roles, eventId);
        return rsvpRepository.findByEventId(event.getId()).stream()
                .map(this::toParticipantResponse)
                .toList();
    }

    @Transactional
    public Rsvp checkInWithQrToken(String adminId, String roles, String eventId, String token) {
        Event event = getEventForClubManagement(adminId, eventId);
        ensureEventAcceptsCheckIns(event);

        if (!event.isQrCheckInEnabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "QR check-in is not enabled for this event");
        }
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "QR check-in token is required");
        }

        Rsvp rsvp = rsvpRepository.findByEventIdAndCheckInToken(eventId, token.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP not found for QR token"));

        if (rsvp.getStatus() != Rsvp.RsvpStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed participants can be checked in");
        }

        markAttended(rsvp, adminId);
        Rsvp saved = rsvpRepository.save(rsvp);
        auditLogService.record(AuditLog.EntityType.EVENT, eventId, "QR_CHECK_IN", adminId, roles,
                rsvp.getUserId() + " öğrencisinin QR yoklaması alındı.");
        return saved;
    }

    @Transactional
    public CertificateIssueResponse issueCertificates(String adminId, String roles, String eventId) {
        Event event = getEventForManagement(adminId, roles, eventId);

        if (!event.isCertificateEnabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Certificate issuing is not enabled for this event");
        }
        ensureEventIsPast(event, "Certificates can only be issued after the event has ended");

        List<Rsvp> eligible = rsvpRepository.findByEventIdAndStatusOrderByCreatedAtAsc(eventId, Rsvp.RsvpStatus.ATTENDED);
        int issued = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Rsvp rsvp : eligible) {
            if (rsvp.getCertificateSentAt() == null) {
                rsvp.setCertificateSentAt(now);
                issued++;
                String certificateCode = certificateCode(event, rsvp);
                notificationService.notifyUserCertificate(
                        rsvp.getUserId(),
                        "Katılım sertifikan hazır",
                        String.format("%s etkinliği için katılım sertifikan oluşturuldu. Sertifika kodu: %s",
                                certificateTitle(event), certificateCode),
                        event.getId()
                );
                String payload = certificatePayload(event, rsvp, certificateCode, now);
                kafkaTemplate.send("event.certificate.issue-requested", rsvp.getUserId(), payload);
            }
        }

        if (issued > 0) {
            rsvpRepository.saveAll(eligible);
            event.setCertificatesIssuedAt(now);
            eventRepository.save(event);
            auditLogService.record(AuditLog.EntityType.EVENT, eventId, "CERTIFICATES_ISSUED", adminId, roles,
                    issued + " katılımcı için sertifika gönderimi başlatıldı.");
        }

        return new CertificateIssueResponse(eventId, eligible.size(), issued);
    }

    private Event getEventForManagement(String adminId, String roles, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        boolean isClubAdmin = event.getClub().getAdminUserId().trim().equalsIgnoreCase(adminId.trim());
        boolean isSystemAdmin = roles != null && (roles.contains("ROLE_SKS_ADMIN") || roles.contains("ROLE_ADMIN"));

        if (!isClubAdmin && !isSystemAdmin) {
            throw new AccessDeniedException("Only club admin or system admin can manage event participants");
        }

        return event;
    }

    private Event getEventForClubManagement(String adminId, String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (!event.getClub().getAdminUserId().trim().equalsIgnoreCase(adminId.trim())) {
            throw new AccessDeniedException("Only club admin can manage event payments");
        }

        return event;
    }

    private void markAttended(Rsvp rsvp, String checkedInBy) {
        rsvp.setStatus(Rsvp.RsvpStatus.ATTENDED);
        rsvp.setCheckedInBy(checkedInBy);
        rsvp.setCheckedInAt(LocalDateTime.now());
    }

    private void ensureEventAcceptsCheckIns(Event event) {
        LocalDateTime startsAt = event.getStartTime();
        LocalDateTime endsAt = event.getEndTime() != null ? event.getEndTime() : event.getStartTime();
        LocalDateTime now = LocalDateTime.now();

        if (startsAt != null && now.isBefore(startsAt.minusHours(1))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Check-ins open one hour before the event starts");
        }
        if (endsAt != null && now.isAfter(endsAt.plusHours(1))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Check-ins close one hour after the event ends");
        }
    }

    private void ensureEventIsNotPast(Event event, String message) {
        LocalDateTime boundary = event.getEndTime() != null ? event.getEndTime() : event.getStartTime();
        if (boundary != null && boundary.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
    }

    private void ensureEventIsPast(Event event, String message) {
        LocalDateTime boundary = event.getEndTime() != null ? event.getEndTime() : event.getStartTime();
        if (boundary == null || boundary.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
    }

    private String certificatePayload(Event event, Rsvp rsvp, String certificateCode, LocalDateTime issuedAt) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventTitle\":\"%s\",\"clubName\":\"%s\",\"userId\":\"%s\",\"certificateTitle\":\"%s\",\"certificateCode\":\"%s\",\"issuedAt\":\"%s\",\"eventDate\":\"%s\",\"eventLocation\":\"%s\",\"clubPresidentName\":\"%s\"}",
                json(event.getId()),
                json(event.getTitle()),
                json(event.getClub().getName()),
                json(rsvp.getUserId()),
                json(certificateTitle(event)),
                json(certificateCode),
                json(issuedAt.toString()),
                json(event.getStartTime() != null ? event.getStartTime().toString() : ""),
                json(certificateLocation(event)),
                json(event.getClub().getPresidentFullName())
        );
    }

    private String certificateLocation(Event event) {
        if (event.getLocationName() != null && !event.getLocationName().isBlank()) {
            return event.getLocationName().trim();
        }
        if (event.getLocation() != null && !event.getLocation().isBlank()) {
            return event.getLocation().trim();
        }
        if (event.getEventMode() == Event.EventMode.ONLINE) {
            return event.getOnlinePlatform() != null && !event.getOnlinePlatform().isBlank()
                    ? event.getOnlinePlatform().trim()
                    : "Online Etkinlik";
        }
        return "FMV Işık Üniversitesi";
    }

    private String certificateTitle(Event event) {
        if (event.getCertificateTitle() != null && !event.getCertificateTitle().isBlank()) {
            return event.getCertificateTitle().trim();
        }
        return event.getTitle();
    }

    private String certificateCode(Event event, Rsvp rsvp) {
        return "CERT-" + shortId(event.getId()) + "-" + shortId(rsvp.getId());
    }

    private String shortId(String value) {
        String normalized = value == null ? "" : value.replace("-", "").toUpperCase();
        return normalized.length() <= 8 ? normalized : normalized.substring(0, 8);
    }

    private String json(String value) {
        return value == null ? "" : value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private EventParticipantResponse toParticipantResponse(Rsvp rsvp) {
        return EventParticipantResponse.builder()
                .rsvpId(rsvp.getId())
                .eventId(rsvp.getEventId())
                .userId(rsvp.getUserId())
                .status(rsvp.getStatus())
                .registeredAt(rsvp.getCreatedAt())
                .checkedInAt(rsvp.getCheckedInAt())
                .checkedInBy(rsvp.getCheckedInBy())
                .paymentPending(rsvp.getStatus() == Rsvp.RsvpStatus.PENDING_PAYMENT)
                .paymentConfirmed(rsvp.getPaymentReviewedAt() != null && rsvp.getStatus() != Rsvp.RsvpStatus.CANCELLED)
                .paymentReviewedAt(rsvp.getPaymentReviewedAt())
                .paymentReviewedBy(rsvp.getPaymentReviewedBy())
                .paymentRejectionReason(rsvp.getPaymentRejectionReason())
                .certificateSent(rsvp.getCertificateSentAt() != null)
                .certificateSentAt(rsvp.getCertificateSentAt())
                .build();
    }

    private void applyInitialRsvpStatus(Event event, Rsvp rsvp) {
        if (event.isPaid()) {
            rsvp.setStatus(Rsvp.RsvpStatus.PENDING_PAYMENT);
            return;
        }

        rsvp.setStatus(Rsvp.RsvpStatus.CONFIRMED);
        rsvp.setCheckInToken(generateCheckInToken());
    }

    private void ensureRsvpBelongsToEvent(Rsvp rsvp, String eventId) {
        if (!eventId.equals(rsvp.getEventId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RSVP does not belong to this event");
        }
    }

    private String generateCheckInToken() {
        return UUID.randomUUID().toString();
    }
}
