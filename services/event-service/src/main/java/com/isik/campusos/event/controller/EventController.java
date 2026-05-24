package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.CertificateIssueResponse;
import com.isik.campusos.event.dto.CheckInQrRequest;
import com.isik.campusos.event.dto.CreateEventRequest;
import com.isik.campusos.event.dto.EventCancelRequest;
import com.isik.campusos.event.dto.EventFeedbackRequest;
import com.isik.campusos.event.dto.EventParticipantResponse;
import com.isik.campusos.event.dto.UpdateEventRequest;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.EventChangeRequest;
import com.isik.campusos.event.service.EventService;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.service.EventRsvpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRsvpService eventRsvpService;

    /** Yayınlanmış etkinlikleri listele — tüm authenticated kullanıcılar */
    @GetMapping
    public ResponseEntity<List<Event>> getPublishedEvents() {
        return ResponseEntity.ok(eventService.getPublishedEvents());
    }

    /** Kulüp admininin yönettiği etkinlikleri listele */
    @GetMapping("/managed")
    public ResponseEntity<List<Event>> getManagedEvents(Authentication auth) {
        return ResponseEntity.ok(eventService.getManagedEvents(auth.getName()));
    }

    @GetMapping("/review-queue")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<Event>> getReviewQueue() {
        return ResponseEntity.ok(eventService.getReviewQueue());
    }

    @GetMapping("/change-requests")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<EventChangeRequest>> getChangeRequests() {
        return ResponseEntity.ok(eventService.getChangeRequestQueue());
    }

    /** Etkinlik taslağı oluştur — kulüp admin kontrolü servis katmanında */
    @PostMapping("/draft")
    public ResponseEntity<Event> createDraft(Authentication auth,
                                             @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(eventService.createEventDraft(auth.getName(), request));
    }

    /** Etkinliği onaya gönder — kulüp admin kontrolü servis katmanında */
    @PostMapping("/{eventId}/submit")
    public ResponseEntity<Event> submitEvent(Authentication auth,
                                             @PathVariable String eventId) {
        return ResponseEntity.ok(eventService.submitForApproval(auth.getName(), eventId));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<Event> updateEvent(Authentication auth,
                                             @PathVariable String eventId,
                                             @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(auth.getName(), eventId, request));
    }

    /**
     * Etkinliği onayla ve yayınla.
     * SecurityConfig: yalnızca ROLE_SKS_ADMIN veya ROLE_ADMIN erişebilir.
     */
    @PostMapping("/{eventId}/approve")
    public ResponseEntity<Event> approveEvent(Authentication auth,
                                              @PathVariable String eventId) {
        return ResponseEntity.ok(eventService.approveEvent(auth.getName(), eventId));
    }

    @PostMapping("/{eventId}/revision-request")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Event> requestRevision(Authentication auth,
                                                 @PathVariable String eventId,
                                                 @RequestBody EventFeedbackRequest request) {
        return ResponseEntity.ok(eventService.requestRevision(auth.getName(), eventId, request));
    }

    @PostMapping("/{eventId}/cancel")
    public ResponseEntity<Event> cancelEvent(Authentication auth,
                                             @PathVariable String eventId,
                                             @RequestBody EventCancelRequest request) {
        return ResponseEntity.ok(eventService.cancelEvent(auth.getName(), auth.getAuthorities().toString(), eventId, request));
    }

    @PostMapping("/change-requests/{changeRequestId}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Event> approveChangeRequest(Authentication auth,
                                                     @PathVariable String changeRequestId) {
        return ResponseEntity.ok(eventService.approveChangeRequest(auth.getName(), changeRequestId));
    }

    @PostMapping("/change-requests/{changeRequestId}/revision-request")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<EventChangeRequest> requestChangeRevision(Authentication auth,
                                                                    @PathVariable String changeRequestId,
                                                                    @RequestBody EventFeedbackRequest request) {
        return ResponseEntity.ok(eventService.requestChangeRevision(auth.getName(), changeRequestId, request));
    }

    /** RSVP oluştur — yalnızca öğrenciler */
    @PostMapping("/{eventId}/rsvp")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Rsvp> createRsvp(Authentication auth,
                                           @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.createRsvp(auth.getName(), eventId));
    }

    /** RSVP iptal et */
    @PostMapping("/{eventId}/rsvp/cancel")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Rsvp> cancelRsvp(Authentication auth,
                                           @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.cancelRsvp(auth.getName(), eventId));
    }

    @GetMapping("/my-rsvps")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<Rsvp>> getMyRsvps(Authentication auth) {
        return ResponseEntity.ok(eventRsvpService.listMyRsvps(auth.getName()));
    }

    /** Kullanıcı check-in — kulüp admin veya sistem admin (servis katmanında kontrol) */
    @PostMapping("/{eventId}/checkin/{targetUserId}")
    public ResponseEntity<Rsvp> checkInUser(Authentication auth,
                                            @PathVariable String eventId,
                                            @PathVariable String targetUserId) {
        return ResponseEntity.ok(eventRsvpService.checkInUser(auth.getName(), auth.getAuthorities().toString(), eventId, targetUserId));
    }

    /** Kulüp admini/SKS etkinlik katılımcılarını ve katılım durumlarını görür */
    @GetMapping("/{eventId}/participants")
    public ResponseEntity<List<EventParticipantResponse>> getParticipants(Authentication auth,
                                                                         @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.listParticipants(auth.getName(), auth.getAuthorities().toString(), eventId));
    }

    @PostMapping("/{eventId}/rsvps/{rsvpId}/payment/approve")
    public ResponseEntity<Rsvp> approvePayment(Authentication auth,
                                               @PathVariable String eventId,
                                               @PathVariable String rsvpId) {
        return ResponseEntity.ok(eventRsvpService.approvePayment(auth.getName(), auth.getAuthorities().toString(), eventId, rsvpId));
    }

    @PostMapping("/{eventId}/rsvps/{rsvpId}/payment/reject")
    public ResponseEntity<Rsvp> rejectPayment(Authentication auth,
                                              @PathVariable String eventId,
                                              @PathVariable String rsvpId) {
        return ResponseEntity.ok(eventRsvpService.rejectPayment(auth.getName(), auth.getAuthorities().toString(), eventId, rsvpId));
    }

    /** QR koddan gelen token ile katılım doğrulama */
    @PostMapping("/{eventId}/checkin/qr")
    public ResponseEntity<Rsvp> checkInWithQr(Authentication auth,
                                             @PathVariable String eventId,
                                             @RequestBody CheckInQrRequest request) {
        return ResponseEntity.ok(eventRsvpService.checkInWithQrToken(
                auth.getName(),
                auth.getAuthorities().toString(),
                eventId,
                request.getToken()
        ));
    }

    /** Sertifikalı etkinliklerde katılanlara sertifika gönderimini tetikle */
    @PostMapping("/{eventId}/certificates/issue")
    public ResponseEntity<CertificateIssueResponse> issueCertificates(Authentication auth,
                                                                      @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.issueCertificates(auth.getName(), auth.getAuthorities().toString(), eventId));
    }
}
