package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationRead, String> {
    boolean existsByNotificationIdAndUserId(String notificationId, String userId);

    Optional<NotificationRead> findByNotificationIdAndUserId(String notificationId, String userId);
}
