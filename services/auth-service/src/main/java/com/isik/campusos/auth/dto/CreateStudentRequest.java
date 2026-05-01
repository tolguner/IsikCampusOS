package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {
    private String firstName;
    private String lastName;
    private String studentNumber;   // e.g., 32yobi1053
    private String tcKimlikNo;      // 11 haneli TC — varsayılan şifre olarak hash'lenecek, saklanmayacak
    private String faculty;
    private String department;
    private String departmentCode;  // 4 harfli kısaltma: yobi
    private Integer enrollmentYear;
}
