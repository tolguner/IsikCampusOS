package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String adminUserId; // userId of the club_admin

    private String presidentFullName;
    private String presidentEmail;
    @Column(columnDefinition = "TEXT")
    private String logoUrl;
    private String advisorAcademicStaffId;
    private String advisorTitle;
    private String advisorFullName;
    private String advisorEmail;
    private String advisorDepartment;

    private boolean isActive;
    
    private boolean requiresApproval;
    
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;
}
