package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentRequest {
    private String firstName;
    private String lastName;
    private String faculty;
    private String department;
}
