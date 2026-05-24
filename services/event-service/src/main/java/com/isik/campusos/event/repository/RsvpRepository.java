package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Rsvp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RsvpRepository extends JpaRepository<Rsvp, String> {
    List<Rsvp> findByEventId(String eventId);
    List<Rsvp> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Rsvp> findByEventIdAndUserId(String eventId, String userId);
    Optional<Rsvp> findByEventIdAndCheckInToken(String eventId, String checkInToken);
    List<Rsvp> findByEventIdAndStatusOrderByCreatedAtAsc(String eventId, Rsvp.RsvpStatus status);
    List<Rsvp> findByEventIdAndStatusInOrderByCreatedAtAsc(String eventId, List<Rsvp.RsvpStatus> statuses);
}
