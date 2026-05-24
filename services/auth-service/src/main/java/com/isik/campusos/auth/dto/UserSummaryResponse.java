package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Diğer mikroservislerin kullanıcı bilgilerini çekmesi için kullanılan hafif DTO.
 * Hassas bilgiler (şifre, TC vb.) dahil edilmez.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryResponse {
    private String id;
    private String fullName;
    private String studentNumber;
    private String department;
    private String faculty;
    private String email;
}
