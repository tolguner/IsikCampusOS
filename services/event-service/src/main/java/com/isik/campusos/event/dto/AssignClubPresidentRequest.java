package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class AssignClubPresidentRequest {
    private String studentId;
    private String fullName;
    private String email;
}
