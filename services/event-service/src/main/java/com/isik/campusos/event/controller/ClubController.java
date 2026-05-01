package com.isik.campusos.event.controller;

import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @PostMapping("/{clubId}/join")
    public ResponseEntity<ClubMember> joinClub(@RequestHeader("X-User-Id") String userId,
                                               @PathVariable String clubId) {
        return ResponseEntity.ok(clubService.joinClub(userId, clubId));
    }
}
