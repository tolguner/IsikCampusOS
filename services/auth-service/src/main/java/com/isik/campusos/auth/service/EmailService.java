package com.isik.campusos.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public void sendEmailVerificationCode(String to, String code, int validMinutes) {
        sendCode(
                to,
                "IsikCampusOS E-posta Dogrulama Kodu",
                "E-posta adresinizi dogrulamak icin kodunuz: " + code
                        + "\n\nBu kod " + validMinutes + " dakika gecerlidir."
                        + "\n\nBu islemi siz baslatmadiysaniz bu mesaji yok sayabilirsiniz."
        );
    }

    public void sendPasswordResetCode(String to, String code, int validMinutes) {
        sendCode(
                to,
                "IsikCampusOS Sifre Sifirlama Kodu",
                "Sifrenizi sifirlamak icin kodunuz: " + code
                        + "\n\nBu kod " + validMinutes + " dakika gecerlidir."
                        + "\n\nBu islemi siz baslatmadiysaniz bu mesaji yok sayabilirsiniz."
        );
    }

    public void sendCertificateEmail(String to,
                                     String recipientName,
                                     String eventTitle,
                                     byte[] certificatePdf,
                                     String filename) {
        String subject = "IsikCampusOS Katilim Sertifikaniz";
        String body = "Merhaba " + recipientName + ",\n\n"
                + eventTitle + " etkinligi icin katilim sertifikaniz ekte yer almaktadir.\n\n"
                + "IsikCampusOS";

        if (!mailEnabled) {
            log.info("Mail gonderimi kapali. Alici: {}, Konu: {}, Ek: {}, Boyut: {} byte",
                    to, subject, filename, certificatePdf == null ? 0 : certificatePdf.length);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);
            helper.addAttachment(filename, new ByteArrayResource(certificatePdf), "application/pdf");

            mailSender.send(message);
            log.info("Sertifika e-postasi gonderildi. Alici: {}, Etkinlik: {}, Ek: {}", to, eventTitle, filename);
        } catch (Exception e) {
            log.error("Sertifika e-postasi gonderilemedi. Alici: {}, Etkinlik: {}", to, eventTitle, e);
            throw new RuntimeException("Sertifika e-postasi gonderilemedi. Lutfen SMTP ayarlarini kontrol edin.");
        }
    }

    private void sendCode(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Mail gonderimi kapali. Alici: {}, Konu: {}, Icerik: {}", to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("E-posta gonderildi. Alici: {}, Konu: {}", to, subject);
        } catch (Exception e) {
            log.error("E-posta gonderilemedi. Alici: {}, Konu: {}", to, subject, e);
            throw new RuntimeException("E-posta gonderilemedi. Lutfen SMTP ayarlarini kontrol edin.");
        }
    }
}
