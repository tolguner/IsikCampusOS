package com.isik.campusos.event.dto;

import com.isik.campusos.event.model.ClubProfileChangeRequest;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClubProfileChangeRequestResponse {
    private String id;
    private ClubResponse club;
    private String requestedBy;
    private String name;
    private String shortDescription;
    private String vision;
    private String logoUrl;
    private ClubProfileChangeRequest.ChangeStatus status;
    private String feedback;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
