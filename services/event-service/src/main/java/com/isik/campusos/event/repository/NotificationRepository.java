package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipientUserIdOrTargetAudienceInOrderByCreatedAtDesc(
            String recipientUserId,
            Collection<Notification.TargetAudience> targetAudiences
    );
}
