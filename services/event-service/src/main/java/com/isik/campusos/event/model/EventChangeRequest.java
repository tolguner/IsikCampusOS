package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_change_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    private String requestedBy;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    @Enumerated(EnumType.STRING)
    private Event.EventMode eventMode;
    private String onlinePlatform;
    private String onlineMeetingUrl;
    private String locationName;
    @Column(length = 1000)
    private String locationDetail;
    private Double latitude;
    private Double longitude;
    @Column(columnDefinition = "TEXT")
    private String posterImageUrl;
    private boolean hasCapacityLimit;
    private int capacity;
    private boolean capacityLimited;
    private boolean hasWaitlistLimit;
    private int waitlistCapacity;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeStatus status;

    @Column(length = 2000)
    private String feedback;

    private String reviewedBy;
    private LocalDateTime reviewedAt;
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

    public enum ChangeStatus {
        PENDING_SKS_APPROVAL, REVISION_REQUESTED, APPROVED
    }
}
