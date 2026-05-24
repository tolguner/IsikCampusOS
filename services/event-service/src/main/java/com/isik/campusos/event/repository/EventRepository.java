package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByStatus(Event.EventStatus status);
    List<Event> findByStatusAndReminderEnabledTrue(Event.EventStatus status);
    List<Event> findByStatusInOrderByUpdatedAtDesc(Collection<Event.EventStatus> statuses);
    List<Event> findByClub_Id(String clubId);
    List<Event> findByClub_IdAndStatusIn(String clubId, Collection<Event.EventStatus> statuses);
    List<Event> findByClub_AdminUserId(String adminUserId);
    long countByClub_Id(String clubId);
}
