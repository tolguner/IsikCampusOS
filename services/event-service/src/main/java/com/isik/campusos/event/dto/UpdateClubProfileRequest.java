package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class UpdateClubProfileRequest {
    private String name;
    private String shortDescription;
    private String vision;
    private String description;
    private String logoUrl;
    private String adminUserId;
    private String presidentFullName;
    private String presidentEmail;
    private String advisorAcademicStaffId;
    private String advisorTitle;
    private String advisorFullName;
    private String advisorEmail;
    private String advisorDepartment;
    private boolean requiresApproval;
}
