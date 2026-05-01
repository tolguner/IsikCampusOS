package com.isik.campusos.event.service;

import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.repository.ClubMemberRepository;
import com.isik.campusos.event.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;

    @Transactional
    public ClubMember joinClub(String userId, String clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        if (clubMemberRepository.existsByClubIdAndUserId(clubId, userId)) {
            throw new RuntimeException("User is already a member of this club");
        }

        ClubMember membership = ClubMember.builder()
                .clubId(clubId)
                .userId(userId)
                .role(ClubMember.MemberRole.MEMBER)
                .build();

        return clubMemberRepository.save(membership);
    }
}
