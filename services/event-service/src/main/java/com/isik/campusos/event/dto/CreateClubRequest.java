package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class CreateClubRequest {
    private String name;
    private String shortDescription;
    private String vision;
    private String description;
    private String adminUserId;
    private String presidentFullName;
    private String presidentEmail;
    private String logoUrl;
    private String advisorAcademicStaffId;
    private String advisorTitle;
    private String advisorFullName;
    private String advisorEmail;
    private String advisorDepartment;
    private boolean requiresApproval;
}
