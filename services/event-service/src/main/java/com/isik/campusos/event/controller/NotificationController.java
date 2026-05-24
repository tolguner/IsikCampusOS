package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.AnnouncementRequest;
import com.isik.campusos.event.dto.NotificationResponse;
import com.isik.campusos.event.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.listVisibleNotifications(
                auth.getName(),
                auth.getAuthorities().toString()
        ));
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<NotificationResponse> createAnnouncement(Authentication auth,
                                                                   @RequestBody AnnouncementRequest request) {
        return ResponseEntity.ok(notificationService.createAnnouncement(auth.getName(), request));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(Authentication auth,
                                                           @PathVariable String notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(
                auth.getName(),
                auth.getAuthorities().toString(),
                notificationId
        ));
    }
}
