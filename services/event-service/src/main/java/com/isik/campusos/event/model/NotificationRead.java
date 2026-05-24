package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notification_reads",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notification_read_user",
                columnNames = {"notification_id", "user_id"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRead {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "notification_id", nullable = false)
    private String notificationId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        this.readAt = LocalDateTime.now();
    }
}
