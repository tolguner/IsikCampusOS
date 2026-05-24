package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class ClubMemberRoleUpdateRequest {
    private String role; // ADMIN or MEMBER
}
