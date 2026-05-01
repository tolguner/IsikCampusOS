package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, String> {
    Optional<ClubMember> findByClubIdAndUserId(String clubId, String userId);
    boolean existsByClubIdAndUserId(String clubId, String userId);
}
