package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String location;
    
    // Capacity logic
    private boolean hasCapacityLimit;
    private int capacity;
    
    private boolean hasWaitlistLimit;
    private int waitlistCapacity;
    
    private int currentRsvpCount;
    private int currentWaitlistCount;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    private String rejectionReason;

    public enum EventStatus {
        DRAFT, PENDING_SKS_APPROVAL, PUBLISHED, REJECTED, CANCELLED, COMPLETED
    }
}
