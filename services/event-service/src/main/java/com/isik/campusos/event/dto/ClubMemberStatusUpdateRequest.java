package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class ClubMemberStatusUpdateRequest {
    private String status; // ACTIVE or REJECTED
}
