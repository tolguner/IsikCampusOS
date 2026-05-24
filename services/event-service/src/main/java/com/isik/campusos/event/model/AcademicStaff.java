package com.isik.campusos.event.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "academic_staff",
        indexes = {
                @Index(name = "idx_academic_staff_full_name", columnList = "fullName"),
                @Index(name = "idx_academic_staff_email", columnList = "email"),
                @Index(name = "idx_academic_staff_active", columnList = "active")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicStaff {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String academicTitle;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true)
    private String email;

    private String facultyOrUnit;
    private String department;
    private String role;

    @Column(unique = true)
    private String profileUrl;

    @Column(columnDefinition = "TEXT")
    private String sourcePageUrl;

    private String sourcePageLastModified;
    private Instant lastSyncedAt;

    @Column(nullable = false)
    private boolean active;
}
