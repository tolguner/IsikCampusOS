package com.isik.campusos.event.dto;

import com.isik.campusos.event.model.Rsvp;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EventParticipantResponse {
    private String rsvpId;
    private String eventId;
    private String userId;
    private Rsvp.RsvpStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private boolean paymentPending;
    private boolean paymentConfirmed;
    private LocalDateTime paymentReviewedAt;
    private String paymentReviewedBy;
    private String paymentRejectionReason;
    private boolean certificateSent;
    private LocalDateTime certificateSentAt;
}
