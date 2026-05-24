package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubAnnouncement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "club_id", nullable = false)
    private String clubId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String linkUrl;
    private String linkLabel;
    
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "created_by", nullable = false)
    private String createdByUserId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
