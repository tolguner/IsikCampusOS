package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Rsvp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RsvpRepository extends JpaRepository<Rsvp, String> {
    List<Rsvp> findByEventId(String eventId);
    Optional<Rsvp> findByEventIdAndUserId(String eventId, String userId);
    List<Rsvp> findByEventIdAndStatusOrderByCreatedAtAsc(String eventId, Rsvp.RsvpStatus status);
}
