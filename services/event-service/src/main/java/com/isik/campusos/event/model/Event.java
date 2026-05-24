package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
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
    @Enumerated(EnumType.STRING)
    private EventMode eventMode;
    private String onlinePlatform;
    private String onlineMeetingUrl;
    private String locationName;
    @Column(length = 1000)
    private String locationDetail;
    private Double latitude;
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String posterImageUrl;
    
    // Capacity logic
    private boolean hasCapacityLimit;
    private int capacity;
    private boolean capacityLimited;
    
    private boolean hasWaitlistLimit;
    private int waitlistCapacity;
    
    private int currentRsvpCount;
    private int currentWaitlistCount;

    private boolean qrCheckInEnabled;
    private boolean certificateEnabled;
    private String certificateTitle;
    private boolean paid;
    private BigDecimal feeAmount;
    private String iban;
    @Column(length = 1000)
    private String paymentInstructions;
    private boolean reminderEnabled;
    @Column(length = 255)
    private String reminderOffsetsMinutes;
    @Column(length = 255)
    private String sentReminderOffsetsMinutes;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    private String rejectionReason;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime certificatesIssuedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum EventStatus {
        DRAFT, PENDING_SKS_APPROVAL, REVISION_REQUESTED, PUBLISHED, REJECTED, CANCELLED, COMPLETED
    }

    public enum EventMode {
        ONLINE, IN_PERSON
    }
}
