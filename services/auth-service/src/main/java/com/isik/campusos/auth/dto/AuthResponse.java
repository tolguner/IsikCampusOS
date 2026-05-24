package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String roles;
    private String fullName;
    private String firstName;
    private String lastName;
    private String faculty;
    private String department;
    private Integer enrollmentYear;
    private String studentNumber;
    private String nationalIdMasked;
    private boolean mustChangePassword;
    private boolean emailVerified;
    private String status;
}
