package com.isik.campusos.auth.service;

import com.isik.campusos.auth.dto.*;
import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.model.UserStatus;
import com.isik.campusos.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Yeni öğrenci oluştur.
     * E-posta: {öğrenciNo}@isik.edu.tr
     * Varsayılan şifre: TC Kimlik No (hash'lenerek saklanır, TC kendisi saklanmaz)
     */
    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        // Validasyonlar
        if (request.getStudentNumber() == null || request.getStudentNumber().isBlank()) {
            throw new RuntimeException("Öğrenci numarası zorunludur.");
        }
        if (request.getTcKimlikNo() == null || request.getTcKimlikNo().length() != 11) {
            throw new RuntimeException("TC Kimlik No 11 haneli olmalıdır.");
        }

        // E-posta üretimi: {öğrenciNo}@isik.edu.tr (Türkçe karakterler dönüştürülerek)
        String transliteratedNumber = transliterate(request.getStudentNumber());
        String email = transliteratedNumber.toLowerCase() + "@isik.edu.tr";

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Bu öğrenci numarasına ait bir hesap zaten mevcut.");
        }
        if (userRepository.existsByStudentNumber(request.getStudentNumber())) {
            throw new RuntimeException("Bu öğrenci numarası zaten kayıtlı.");
        }

        // Kullanıcı oluştur — varsayılan şifre: TC Kimlik No
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getTcKimlikNo()))
                .roles("ROLE_STUDENT")
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .studentNumber(request.getStudentNumber().toUpperCase(java.util.Locale.forLanguageTag("tr-TR")))
                .faculty(request.getFaculty())
                .department(request.getDepartment())
                .departmentCode(request.getDepartmentCode() != null ? request.getDepartmentCode().toLowerCase() : null)
                .enrollmentYear(request.getEnrollmentYear())
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .mustChangePassword(true)
                .build();

        User saved = userRepository.save(user);

        // Kafka event: profil servisi boş profil oluşsun
        try {
            String payload = String.format(
                    "{\"userId\":\"%s\", \"email\":\"%s\", \"firstName\":\"%s\", \"lastName\":\"%s\", \"studentNumber\":\"%s\"}",
                    saved.getId(), saved.getEmail(), saved.getFirstName(), saved.getLastName(), saved.getStudentNumber()
            );
            kafkaTemplate.send("user.registered", saved.getId(), payload);
        } catch (Exception e) {
            log.warn("Kafka event gönderilemedi (user.registered): {}", e.getMessage());
        }

        log.info("Yeni öğrenci oluşturuldu: {} - {} {}", saved.getStudentNumber(), saved.getFirstName(), saved.getLastName());

        return toResponse(saved);
    }

    /**
     * Öğrenci listesi — sayfalı, filtrelenebilir.
     */
    public Page<StudentResponse> listStudents(int page, int size, String search, String status, String faculty) {
        UserStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = UserStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Geçersiz durum filtresi: " + status);
            }
        }

        return userRepository.findStudents(
                search,
                statusEnum,
                faculty,
                PageRequest.of(page, size)
        ).map(this::toResponse);
    }

    /**
     * Tekil öğrenci detayı.
     */
    public StudentResponse getStudent(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
        return toResponse(user);
    }

    /**
     * Öğrenci bilgilerini güncelle.
     */
    @Transactional
    public StudentResponse updateStudent(String id, UpdateStudentRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getFaculty() != null) user.setFaculty(request.getFaculty());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());

        User saved = userRepository.save(user);
        log.info("Öğrenci güncellendi: {} - {} {}", saved.getStudentNumber(), saved.getFirstName(), saved.getLastName());
        return toResponse(saved);
    }

    /**
     * Öğrenci durumunu değiştir.
     * ACTIVE → GRADUATED (Mezun)
     * ACTIVE → EXPELLED (İlişik kesildi)
     * ACTIVE ↔ INACTIVE (Geçici dondurma/açma)
     */
    @Transactional
    public StudentResponse changeStatus(String id, ChangeStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));

        UserStatus newStatus;
        try {
            newStatus = UserStatus.valueOf(request.getNewStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Geçersiz durum: " + request.getNewStatus());
        }

        UserStatus currentStatus = user.getStatus();

        // Durum geçiş kuralları
        boolean validTransition = switch (newStatus) {
            case ACTIVE -> currentStatus == UserStatus.INACTIVE;
            case INACTIVE -> currentStatus == UserStatus.ACTIVE;
            case GRADUATED -> currentStatus == UserStatus.ACTIVE || currentStatus == UserStatus.INACTIVE;
            case EXPELLED -> currentStatus == UserStatus.ACTIVE || currentStatus == UserStatus.INACTIVE;
        };

        if (!validTransition) {
            throw new RuntimeException(
                    String.format("'%s' durumundan '%s' durumuna geçiş yapılamaz.", currentStatus, newStatus));
        }

        user.setStatus(newStatus);
        User saved = userRepository.save(user);

        log.info("Öğrenci durumu değiştirildi: {} → {} (Sebep: {})",
                saved.getStudentNumber(), newStatus, request.getReason());

        return toResponse(saved);
    }

    /**
     * Öğrenci şifresini TC Kimlik No'ya geri döndür.
     * Öğrenci İşleri personeli tarafından kullanılır.
     */
    @Transactional
    public void resetPassword(String id, String tcKimlikNo) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));

        if (tcKimlikNo == null || tcKimlikNo.length() != 11) {
            throw new RuntimeException("TC Kimlik No 11 haneli olmalıdır.");
        }

        user.setPassword(passwordEncoder.encode(tcKimlikNo));
        user.setMustChangePassword(true);
        userRepository.save(user);

        log.info("Öğrenci şifresi sıfırlandı: {}", user.getStudentNumber());
    }

    private StudentResponse toResponse(User user) {
        return StudentResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .studentNumber(user.getStudentNumber())
                .faculty(user.getFaculty())
                .department(user.getDepartment())
                .departmentCode(user.getDepartmentCode())
                .enrollmentYear(user.getEnrollmentYear())
                .status(user.getStatus().name())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .lastLoginAt(user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null)
                .build();
    }

    private String transliterate(String input) {
        if (input == null) return null;
        return input.replace("\u011F", "g").replace("\u011E", "G") // ğ, Ğ
                    .replace("\u00FC", "u").replace("\u00DC", "U") // ü, Ü
                    .replace("\u015F", "s").replace("\u015E", "S") // ş, Ş
                    .replace("\u0131", "i").replace("\u0130", "I") // ı, İ
                    .replace("\u00F6", "o").replace("\u00D6", "O") // ö, Ö
                    .replace("\u00E7", "c").replace("\u00C7", "C"); // ç, Ç
    }
}
