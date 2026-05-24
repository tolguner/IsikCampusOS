package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "rsvps",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_rsvp_event_user",
        columnNames = {"event_id", "user_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rsvp {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "check_in_token", unique = true)
    private String checkInToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RsvpStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private LocalDateTime certificateSentAt;
    private LocalDateTime paymentReviewedAt;
    private String paymentReviewedBy;
    @Column(length = 1000)
    private String paymentRejectionReason;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum RsvpStatus {
        PENDING_PAYMENT, CONFIRMED, WAITLISTED, CANCELLED, ATTENDED, NO_SHOW
    }
}
