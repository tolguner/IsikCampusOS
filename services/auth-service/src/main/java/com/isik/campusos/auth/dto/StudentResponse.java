package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String studentNumber;
    private String faculty;
    private String department;
    private String departmentCode;
    private Integer enrollmentYear;
    private String nationalIdMasked;
    private String status;
    private boolean emailVerified;
    private String createdAt;
    private String lastLoginAt;
}
