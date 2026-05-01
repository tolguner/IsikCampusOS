package com.isik.campusos.auth.service;

import com.isik.campusos.auth.dto.AuthResponse;
import com.isik.campusos.auth.dto.ChangePasswordRequest;
import com.isik.campusos.auth.dto.ForgotPasswordRequest;
import com.isik.campusos.auth.dto.LoginRequest;
import com.isik.campusos.auth.dto.ResetPasswordRequest;
import com.isik.campusos.auth.dto.VerifyEmailRequest;
import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.model.UserStatus;
import com.isik.campusos.auth.model.VerificationCode;
import com.isik.campusos.auth.repository.UserRepository;
import com.isik.campusos.auth.repository.VerificationCodeRepository;
import com.isik.campusos.auth.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final EmailService emailService;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Gecersiz e-posta veya sifre."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            String message = switch (user.getStatus()) {
                case INACTIVE -> "Hesabiniz gecici olarak askiya alinmistir. Ogrenci Isleri ile iletisime gecin.";
                case GRADUATED -> "Mezuniyet durumunuz nedeniyle hesabiniz kapatilmistir.";
                case EXPELLED -> "Hesabiniz ilisigi kesme nedeniyle kapatilmistir.";
                default -> "Hesabiniz aktif degil.";
            };
            throw new RuntimeException(message);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Gecersiz e-posta veya sifre.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtProvider.generateToken(user);

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRoles(),
                user.getFullName(),
                user.getFirstName(),
                user.getLastName(),
                user.getFaculty(),
                user.getDepartment(),
                user.getEnrollmentYear(),
                user.getStudentNumber(),
                user.isMustChangePassword(),
                user.isEmailVerified(),
                user.getStatus().name()
        );
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi."));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mevcut sifreniz hatali.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Yeni sifre en az 6 karakter olmalidir.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Bu e-posta adresiyle kayitli bir hesap bulunamadi."));

        String code = generateCode();

        VerificationCode vc = VerificationCode.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .code(code)
                .codeType("PASSWORD_RESET")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        verificationCodeRepository.save(vc);
        emailService.sendPasswordResetCode(user.getEmail(), code, 15);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationCode vc = verificationCodeRepository
                .findByEmailAndCodeAndCodeTypeAndUsedFalse(request.getEmail(), request.getCode(), "PASSWORD_RESET")
                .orElseThrow(() -> new RuntimeException("Gecersiz veya suresi dolmus kod."));

        if (vc.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kodun suresi dolmus. Lutfen yeni bir kod talep edin.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Yeni sifre en az 6 karakter olmalidir.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        vc.setUsed(true);
        verificationCodeRepository.save(vc);
    }

    @Transactional
    public void sendVerificationCode(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi."));

        if (user.isEmailVerified()) {
            throw new RuntimeException("E-posta zaten dogrulanmis.");
        }

        String code = generateCode();

        VerificationCode vc = VerificationCode.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .code(code)
                .codeType("EMAIL_VERIFICATION")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        verificationCodeRepository.save(vc);
        emailService.sendEmailVerificationCode(user.getEmail(), code, 10);
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        VerificationCode vc = verificationCodeRepository
                .findByEmailAndCodeAndCodeTypeAndUsedFalse(request.getEmail(), request.getCode(), "EMAIL_VERIFICATION")
                .orElseThrow(() -> new RuntimeException("Gecersiz veya suresi dolmus dogrulama kodu."));

        if (vc.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Dogrulama kodunun suresi dolmus. Lutfen yeni bir kod talep edin.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi."));

        user.setEmailVerified(true);
        userRepository.save(user);

        vc.setUsed(true);
        verificationCodeRepository.save(vc);
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
