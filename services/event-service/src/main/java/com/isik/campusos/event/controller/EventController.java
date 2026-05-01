package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.CreateEventRequest;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.service.EventService;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.service.EventRsvpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    /**
     * Etkinliği onayla ve yayınla.
     * SecurityConfig: yalnızca ROLE_SKS_ADMIN veya ROLE_ADMIN erişebilir.
     */
    @PostMapping("/{eventId}/approve")
    public ResponseEntity<Event> approveEvent(Authentication auth,
                                              @PathVariable String eventId) {
        return ResponseEntity.ok(eventService.approveEvent(auth.getName(), eventId));
    }

    /** RSVP oluştur — tüm authenticated kullanıcılar */
    @PostMapping("/{eventId}/rsvp")
    public ResponseEntity<Rsvp> createRsvp(Authentication auth,
                                           @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.createRsvp(auth.getName(), eventId));
    }

    /** RSVP iptal et */
    @PostMapping("/{eventId}/rsvp/cancel")
    public ResponseEntity<Rsvp> cancelRsvp(Authentication auth,
                                           @PathVariable String eventId) {
        return ResponseEntity.ok(eventRsvpService.cancelRsvp(auth.getName(), eventId));
    }

    /** Kullanıcı check-in — kulüp admin veya sistem admin (servis katmanında kontrol) */
    @PostMapping("/{eventId}/checkin/{targetUserId}")
    public ResponseEntity<Rsvp> checkInUser(Authentication auth,
                                            @PathVariable String eventId,
                                            @PathVariable String targetUserId) {
        return ResponseEntity.ok(eventRsvpService.checkInUser(auth.getName(), auth.getAuthorities().toString(), eventId, targetUserId));
    }
}

