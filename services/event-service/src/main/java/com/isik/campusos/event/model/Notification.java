package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 3000)
    private String message;

    private String linkUrl;
    private String linkLabel;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetAudience targetAudience;

    private String recipientUserId;
    private String relatedEventId;
    private String createdBy;
    private String createdByName;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum NotificationType {
        ANNOUNCEMENT, EVENT_REVISION_REQUEST, CERTIFICATE
    }

    public enum TargetAudience {
        USER, ALL_STUDENTS, CLUB_PRESIDENTS, SKS_ADMINS
    }
}
