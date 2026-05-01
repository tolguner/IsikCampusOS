package com.isik.campusos.profile.controller;

import com.isik.campusos.profile.dto.ProfileDto;
import com.isik.campusos.profile.model.Profile;
import com.isik.campusos.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
