package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClubResponse {
    private String id;
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
    private boolean active;
    private boolean requiresApproval;
    private long memberCount;
    private long eventCount;
    private boolean currentUserMember;
    private String currentUserRole;
    private String currentUserStatus;
}
