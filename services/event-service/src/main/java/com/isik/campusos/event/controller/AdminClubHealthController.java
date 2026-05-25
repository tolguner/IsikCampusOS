package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.ClubHealthActionRequest;
import com.isik.campusos.event.dto.ClubHealthResponse;
import com.isik.campusos.event.service.ClubHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/clubs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
public class AdminClubHealthController {

    private final ClubHealthService clubHealthService;

    @GetMapping("/health")
    public ResponseEntity<List<ClubHealthResponse>> getClubHealth() {
        return ResponseEntity.ok(clubHealthService.listHealth());
    }

    @PostMapping("/{clubId}/health-notes")
    public ResponseEntity<ClubHealthResponse> addHealthNote(Authentication auth,
                                                            @PathVariable String clubId,
                                                            @RequestBody ClubHealthActionRequest request) {
        return ResponseEntity.ok(clubHealthService.addNote(clubId, auth.getName(), request));
    }

    @PostMapping("/{clubId}/watchlist")
    public ResponseEntity<ClubHealthResponse> watchlist(Authentication auth,
                                                        @PathVariable String clubId,
                                                        @RequestBody(required = false) ClubHealthActionRequest request) {
        return ResponseEntity.ok(clubHealthService.watchlist(clubId, auth.getName(), request));
    }

    @PostMapping("/{clubId}/action-request")
    public ResponseEntity<ClubHealthResponse> requestAction(Authentication auth,
                                                            @PathVariable String clubId,
                                                            @RequestBody ClubHealthActionRequest request) {
        return ResponseEntity.ok(clubHealthService.requestAction(clubId, auth.getName(), request));
    }
}
