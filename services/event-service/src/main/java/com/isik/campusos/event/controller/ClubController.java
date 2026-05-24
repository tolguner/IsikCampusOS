package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.*;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.service.ClubService;
import com.isik.campusos.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<ClubResponse>> getClubs(Authentication auth) {
        return ResponseEntity.ok(clubService.listActiveClubs(auth.getName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClubResponse>> getAllClubsForAdmin(Authentication auth) {
        return ResponseEntity.ok(clubService.listAllClubs(auth.getName()));
    }

    @GetMapping("/managed")
    public ResponseEntity<List<ClubResponse>> getManagedClubs(Authentication auth) {
        return ResponseEntity.ok(clubService.listManagedClubs(auth.getName()));
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<ClubResponse> getClub(Authentication auth,
                                                @PathVariable String clubId) {
        return ResponseEntity.ok(clubService.getClubForAdminOrManager(
                auth.getName(),
                auth.getAuthorities().toString(),
                clubId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubResponse> createClub(@RequestBody CreateClubRequest request) {
        return ResponseEntity.ok(clubService.createClub(request));
    }

    @PatchMapping("/{clubId}/profile")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubResponse> updateClubProfile(Authentication auth,
                                                          @PathVariable String clubId,
                                                          @RequestBody UpdateClubProfileRequest request) {
        return ResponseEntity.ok(clubService.updateClubProfile(clubId, request, auth.getName()));
    }

    @PostMapping("/{clubId}/profile-update-requests")
    public ResponseEntity<ClubProfileChangeRequestResponse> requestProfileUpdate(Authentication auth,
                                                                                 @PathVariable String clubId,
                                                                                 @RequestBody UpdateClubProfileRequest request) {
        return ResponseEntity.ok(clubService.requestProfileUpdate(auth.getName(), clubId, request));
    }

    @GetMapping("/profile-update-requests")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClubProfileChangeRequestResponse>> getProfileChangeQueue(Authentication auth) {
        return ResponseEntity.ok(clubService.getProfileChangeQueue(auth.getName()));
    }

    @PostMapping("/profile-update-requests/{requestId}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubProfileChangeRequestResponse> approveProfileChange(Authentication auth,
                                                                                 @PathVariable String requestId) {
        return ResponseEntity.ok(clubService.approveProfileChange(requestId, auth.getName()));
    }

    @PostMapping("/profile-update-requests/{requestId}/revision-request")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubProfileChangeRequestResponse> requestProfileChangeRevision(
            Authentication auth,
            @PathVariable String requestId,
            @RequestBody EventFeedbackRequest request) {
        return ResponseEntity.ok(clubService.requestProfileChangeRevision(requestId, auth.getName(), request));
    }

    @PostMapping("/profile-update-requests/{requestId}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubProfileChangeRequestResponse> rejectProfileChange(
            Authentication auth,
            @PathVariable String requestId,
            @RequestBody EventFeedbackRequest request) {
        return ResponseEntity.ok(clubService.rejectProfileChange(requestId, auth.getName(), request));
    }

    @GetMapping("/{clubId}/announcements")
    public ResponseEntity<List<ClubAnnouncementResponse>> getClubAnnouncements(@PathVariable String clubId) {
        return ResponseEntity.ok(clubService.getClubAnnouncements(clubId));
    }

    @PostMapping("/{clubId}/announcements")
    public ResponseEntity<Void> createClubAnnouncement(Authentication auth,
                                                       @PathVariable String clubId,
                                                       @RequestBody ClubAnnouncementRequest request) {
        clubService.createClubAnnouncement(auth.getName(), clubId, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{clubId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubResponse> changeClubStatus(Authentication auth,
                                                         @PathVariable String clubId,
                                                         @RequestBody ClubStatusRequest request) {
        return ResponseEntity.ok(clubService.changeClubStatus(clubId, request, auth.getName()));
    }

    @PatchMapping("/{clubId}/president")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ClubResponse> assignPresident(Authentication auth,
                                                        @PathVariable String clubId,
                                                        @RequestBody AssignClubPresidentRequest request) {
        return ResponseEntity.ok(clubService.assignPresident(clubId, request, auth.getName()));
    }

    @DeleteMapping("/{clubId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteClub(Authentication auth, @PathVariable String clubId) {
        clubService.deleteClub(clubId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{clubId}/events")
    public ResponseEntity<List<Event>> getClubEvents(@PathVariable String clubId) {
        return ResponseEntity.ok(eventService.getClubEvents(clubId));
    }

    @GetMapping("/{clubId}/members")
    public ResponseEntity<List<ClubMemberResponse>> getClubMembers(Authentication auth, @PathVariable String clubId) {
        return ResponseEntity.ok(clubService.getClubMembers(auth.getName(), auth.getAuthorities().toString(), clubId));
    }

    @PatchMapping("/{clubId}/members/{userId}/role")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateMemberRole(Authentication auth,
                                                 @PathVariable String clubId,
                                                 @PathVariable String userId,
                                                 @RequestBody ClubMemberRoleUpdateRequest request) {
        clubService.updateMemberRole(auth.getName(), auth.getAuthorities().toString(), clubId, userId, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{clubId}/members/{userId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateMemberStatus(Authentication auth,
                                                   @PathVariable String clubId,
                                                   @PathVariable String userId,
                                                   @RequestBody ClubMemberStatusUpdateRequest request) {
        clubService.updateMemberStatus(auth.getName(), auth.getAuthorities().toString(), clubId, userId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{clubId}/members/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> removeMember(Authentication auth,
                                             @PathVariable String clubId,
                                             @PathVariable String userId) {
        clubService.removeMember(auth.getName(), auth.getAuthorities().toString(), clubId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{clubId}/join")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<ClubMember> joinClub(Authentication auth,
                                               @PathVariable String clubId) {
        return ResponseEntity.ok(clubService.joinClub(auth.getName(), clubId));
    }

    @DeleteMapping("/{clubId}/membership")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Void> leaveClub(Authentication auth,
                                          @PathVariable String clubId) {
        clubService.leaveClub(auth.getName(), clubId);
        return ResponseEntity.noContent().build();
    }
}
