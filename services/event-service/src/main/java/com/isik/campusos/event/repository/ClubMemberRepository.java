package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, String> {
    Optional<ClubMember> findByClubIdAndUserId(String clubId, String userId);
    List<ClubMember> findByClubId(String clubId);
    List<ClubMember> findByClubIdAndRole(String clubId, ClubMember.MemberRole role);
    boolean existsByClubIdAndUserId(String clubId, String userId);
    long countByClubId(String clubId);
    long countByClubIdAndStatus(String clubId, ClubMember.MemberStatus status);
}
