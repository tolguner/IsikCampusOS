package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClubMemberResponse {
    private String id;
    private String clubId;
    private String userId;
    private String fullName;
    private String role;     // MEMBER, ADMIN
    private String status;   // PENDING, ACTIVE, REJECTED
    private LocalDateTime joinedAt;
}
