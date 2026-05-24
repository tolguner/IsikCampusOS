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

        // SKS yöneticisi hesabı — personel e-postaları @isikun.edu.tr formatındadır.
        userRepository.findByEmail("odul.celep@isik.edu.tr").ifPresent(wrongDomainUser -> {
            wrongDomainUser.setEmail("odul.celep@isikun.edu.tr");
            wrongDomainUser.setPassword(passwordEncoder.encode("odul.celep"));
            wrongDomainUser.setRoles("ROLE_SKS_ADMIN");
            wrongDomainUser.setFirstName("Ödül");
            wrongDomainUser.setLastName("Celep");
            wrongDomainUser.setStatus(UserStatus.ACTIVE);
            wrongDomainUser.setEmailVerified(true);
            wrongDomainUser.setMustChangePassword(false);
            userRepository.save(wrongDomainUser);
            log.info("✅ Seed: SKS yöneticisi e-postası personel formatına taşındı — odul.celep@isikun.edu.tr");
        });

        if (!userRepository.existsByEmail("odul.celep@isikun.edu.tr")) {
            User sksAdmin = User.builder()
                    .email("odul.celep@isikun.edu.tr")
                    .password(passwordEncoder.encode("odul.celep"))
                    .roles("ROLE_SKS_ADMIN")
                    .firstName("Ödül")
                    .lastName("Celep")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(sksAdmin);
            log.info("✅ Seed: SKS yöneticisi hesabı oluşturuldu — odul.celep@isikun.edu.tr / odul.celep");
        }

        // Test öğrenci hesabı — senaryo testleri için doğrudan giriş yapılabilir durumda tutulur.
        User testStudent = userRepository.findByEmail("23yobi1001@isik.edu.tr")
                .orElseGet(() -> User.builder()
                        .email("23yobi1001@isik.edu.tr")
                        .firstName("Test")
                        .lastName("Öğrenci")
                        .studentNumber("23yobi1001")
                        .faculty("İktisadi ve İdari Bilimler Fakültesi")
                        .department("Yönetim Bilişim Sistemleri")
                        .departmentCode("yobi")
                        .enrollmentYear(2023)
                        .build());
        testStudent.setPassword(passwordEncoder.encode("12345678901"));
        testStudent.setRoles("ROLE_STUDENT");
        testStudent.setStatus(UserStatus.ACTIVE);
        testStudent.setEmailVerified(true);
        testStudent.setMustChangePassword(false);
        userRepository.save(testStudent);
        log.info("✅ Seed: Test öğrenci hesabı hazır — 23yobi1001@isik.edu.tr / 12345678901");

        // Mevcut örnek kulüp başkanı hesabı — kulüp yönetimi senaryoları için sabit giriş.
        userRepository.findByEmail("23yobi1053@isik.edu.tr").ifPresent(clubPresident -> {
            clubPresident.setPassword(passwordEncoder.encode("12345678901"));
            clubPresident.setRoles("ROLE_STUDENT");
            clubPresident.setStatus(UserStatus.ACTIVE);
            clubPresident.setEmailVerified(true);
            clubPresident.setMustChangePassword(false);
            userRepository.save(clubPresident);
            log.info("✅ Seed: Kulüp başkanı test hesabı hazır — 23yobi1053@isik.edu.tr / 12345678901");
        });

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
