package com.isik.campusos.auth.config;

import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.model.UserStatus;
import com.isik.campusos.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")  // Yalnızca 'dev' profile'ında çalışır — production'da seed data insert edilmez
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Öğrenci İşleri hesabı
        if (!userRepository.existsByEmail("ogrenci.isleri@isikun.edu.tr")) {
            User registrar = User.builder()
                    .email("ogrenci.isleri@isikun.edu.tr")
                    .password(passwordEncoder.encode("Admin123!"))
                    .roles("ROLE_REGISTRAR")
                    .firstName("Öğrenci")
                    .lastName("İşleri")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(registrar);
            log.info("✅ Seed: Öğrenci İşleri hesabı oluşturuldu — ogrenci.isleri@isikun.edu.tr / Admin123!");
        }

        // Sistem Admin hesabı
        if (!userRepository.existsByEmail("admin@isikun.edu.tr")) {
            User admin = User.builder()
                    .email("admin@isikun.edu.tr")
                    .password(passwordEncoder.encode("Admin123!"))
                    .roles("ROLE_ADMIN")
                    .firstName("Sistem")
                    .lastName("Yöneticisi")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(admin);
            log.info("✅ Seed: Sistem Admin hesabı oluşturuldu — admin@isikun.edu.tr / Admin123!");
        }

        // Test öğrenci hesabı
        if (!userRepository.existsByEmail("23yobi1001@isik.edu.tr")) {
            User testStudent = User.builder()
                    .email("23yobi1001@isik.edu.tr")
                    .password(passwordEncoder.encode("12345678901")) // Örnek TC
                    .roles("ROLE_STUDENT")
                    .firstName("Test")
                    .lastName("Öğrenci")
                    .studentNumber("23yobi1001")
                    .faculty("İktisadi ve İdari Bilimler Fakültesi")
                    .department("Yönetim Bilişim Sistemleri")
                    .departmentCode("yobi")
                    .enrollmentYear(2023)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(false)
                    .mustChangePassword(true)
                    .build();
            userRepository.save(testStudent);
            log.info("✅ Seed: Test öğrenci hesabı oluşturuldu — 23yobi1001@isik.edu.tr / TC: 12345678901");
        }

        // Özlem Ak — Öğrenci İşleri Daire Başkanlığı personeli
        if (!userRepository.existsByEmail("ozlem.ak@isikun.edu.tr")) {
            User ozlemAk = User.builder()
                    .email("ozlem.ak@isikun.edu.tr")
                    .password(passwordEncoder.encode("12345678901")) // TC Kimlik No
                    .roles("ROLE_REGISTRAR")
                    .firstName("Özlem")
                    .lastName("Ak")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .mustChangePassword(true)
                    .build();
            userRepository.save(ozlemAk);
            log.info("✅ Seed: Özlem Ak hesabı oluşturuldu — ozlem.ak@isikun.edu.tr / TC: 12345678901");
        }
    }
}
