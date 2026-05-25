package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_health_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubHealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String clubId;

    private boolean watchlisted;

    @Column(columnDefinition = "TEXT")
    private String latestNote;

    private String latestNoteBy;
    private LocalDateTime latestNoteAt;
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onWrite() {
        this.updatedAt = LocalDateTime.now();
    }
}
