package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.ClubProfileChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClubProfileChangeRequestRepository extends JpaRepository<ClubProfileChangeRequest, String> {
    List<ClubProfileChangeRequest> findByStatusInOrderByCreatedAtDesc(Collection<ClubProfileChangeRequest.ChangeStatus> statuses);
    Optional<ClubProfileChangeRequest> findFirstByClub_IdAndStatusOrderByCreatedAtDesc(String clubId, ClubProfileChangeRequest.ChangeStatus status);
}
