package com.isik.campusos.profile.controller;

import com.isik.campusos.profile.dto.ProfileChangeRequestDto;
import com.isik.campusos.profile.dto.ProfileChangeReviewDto;
import com.isik.campusos.profile.dto.ProfileDto;
import com.isik.campusos.profile.model.Profile;
import com.isik.campusos.profile.model.ProfileChangeRequest;
import com.isik.campusos.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // API Gateway injects X-User-Id header
    @GetMapping("/me")
    public ResponseEntity<Profile> getMyProfile(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(profileService.getProfileByUserId(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<Profile> updateMyProfile(@RequestHeader("X-User-Id") String userId, 
                                                   @RequestBody ProfileDto profileDto) {
        return ResponseEntity.ok(profileService.updateProfile(userId, profileDto));
    }

    @GetMapping("/me/change-requests")
    public ResponseEntity<List<ProfileChangeRequest>> getMyChangeRequests(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(profileService.getMyChangeRequests(userId));
    }

    @PostMapping("/me/change-requests")
    public ResponseEntity<ProfileChangeRequest> requestProfileChange(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody ProfileChangeRequestDto requestDto) {
        return ResponseEntity.ok(profileService.requestProfileChange(userId, requestDto));
    }

    @GetMapping("/change-requests/pending")
    public ResponseEntity<List<ProfileChangeRequest>> getPendingChangeRequests(
            @RequestHeader("X-User-Roles") String roles) {
        return ResponseEntity.ok(profileService.getPendingChangeRequests(roles));
    }

    @PostMapping("/change-requests/{requestId}/approve")
    public ResponseEntity<ProfileChangeRequest> approveChangeRequest(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Roles") String roles,
            @PathVariable String requestId) {
        return ResponseEntity.ok(profileService.approveChangeRequest(requestId, userId, roles));
    }

    @PostMapping("/change-requests/{requestId}/reject")
    public ResponseEntity<ProfileChangeRequest> rejectChangeRequest(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Roles") String roles,
            @PathVariable String requestId,
            @RequestBody(required = false) ProfileChangeReviewDto reviewDto) {
        return ResponseEntity.ok(profileService.rejectChangeRequest(requestId, userId, roles, reviewDto));
    }
}
