package com.isik.campusos.auth.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String email; // Öğrenci: 32yobi1053@isik.edu.tr | Personel: ad.soyad@isikun.edu.tr

    @Column(nullable = false)
    private String password; // BCrypt hash

    @Column(nullable = false)
    private String roles; // e.g., "ROLE_STUDENT", "ROLE_REGISTRAR", "ROLE_ADMIN"

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String studentNumber; // e.g., 32yobi1053 (nullable — personel için null)

    private String faculty;       // Fakülte
    private String department;    // Bölüm
    private String departmentCode; // 4 harfli kısaltma: yobi
    private Integer enrollmentYear; // Kayıt yılı: 2023
    private String nationalIdMasked; // TC/Pasaport tam değer saklanmaz, sadece maskeli görünüm tutulur

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Builder.Default
    private boolean emailVerified = false;

    @Builder.Default
    private boolean mustChangePassword = true;

    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper: tam ad
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return email;
    }
}
