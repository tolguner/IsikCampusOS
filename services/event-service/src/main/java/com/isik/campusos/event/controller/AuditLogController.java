package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.AuditLogResponse;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.AuditLog;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final EventRepository eventRepository;

    @GetMapping("/api/v1/events/{eventId}/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> getEventLogs(Authentication auth,
                                                               @PathVariable String eventId,
                                                               @RequestParam(required = false) String action,
                                                               @RequestParam(required = false) String actorId,
                                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                                               @RequestParam(required = false) String search) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        boolean isClubAdmin = event.getClub().getAdminUserId().trim().equalsIgnoreCase(auth.getName().trim());
        boolean isSks = auth.getAuthorities().toString().contains("ROLE_SKS_ADMIN")
                || auth.getAuthorities().toString().contains("ROLE_ADMIN");
        if (!isClubAdmin && !isSks) {
            throw new AccessDeniedException("Only club admin or SKS admin can view event logs");
        }
        return ResponseEntity.ok(auditLogService.list(AuditLog.EntityType.EVENT, eventId, action, actorId, from, to, search));
    }

    @GetMapping("/api/v1/clubs/{clubId}/audit-logs")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AuditLogResponse>> getClubLogs(@PathVariable String clubId,
                                                              @RequestParam(required = false) String action,
                                                              @RequestParam(required = false) String actorId,
                                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                                              @RequestParam(required = false) String search) {
        return ResponseEntity.ok(auditLogService.list(AuditLog.EntityType.CLUB, clubId, action, actorId, from, to, search));
    }
}
