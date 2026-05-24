package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.EventChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventChangeRequestRepository extends JpaRepository<EventChangeRequest, String> {
    List<EventChangeRequest> findByStatusInOrderByCreatedAtDesc(Collection<EventChangeRequest.ChangeStatus> statuses);
    Optional<EventChangeRequest> findFirstByEvent_IdAndStatusOrderByCreatedAtDesc(String eventId, EventChangeRequest.ChangeStatus status);
}
