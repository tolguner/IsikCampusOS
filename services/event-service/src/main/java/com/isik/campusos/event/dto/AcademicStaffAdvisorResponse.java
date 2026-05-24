package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AcademicStaffAdvisorResponse {
    private String id;
    private String academicTitle;
    private String fullName;
    private String displayName;
    private String email;
    private String facultyOrUnit;
    private String department;
    private String role;
    private String profileUrl;
    private Instant lastSyncedAt;
}
