package com.isik.kampusos.kimlik.service;
 
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
public class EpostaServisi {
 
    private final JavaMailSender mailSender;
 
    @Value("${app.mail.from}")
    private String fromAddress;
 
    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;
 
    public void epostaDogrulamaKoduGonder(String alici, String kod, int gecerlilikSuresiDakika) {
        kodGonder(
                alici,
                "IsikCampusOS E-posta Doğrulama Kodu",
                "E-posta adresinizi doğrulamak için kodunuz: " + kod
                        + "\n\nBu kod " + gecerlilikSuresiDakika + " dakika geçerlidir."
                        + "\n\nBu işlemi siz başlatmadıysanız bu mesajı yok sayabilirsiniz."
        );
    }
 
    public void sifreSifirlamaKoduGonder(String alici, String kod, int gecerlilikSuresiDakika) {
        kodGonder(
                alici,
                "IsikCampusOS Şifre Sıfırlama Kodu",
                "Şifrenizi sıfırlamak için kodunuz: " + kod
                        + "\n\nBu kod " + gecerlilikSuresiDakika + " dakika geçerlidir."
                        + "\n\nBu işlemi siz başlatmadıysanız bu mesajı yok sayabilirsiniz."
        );
    }
 
    public void sertifikaEpostasiGonder(String alici,
                                     String aliciAdi,
                                     String etkinlikBasligi,
                                     byte[] sertifikaPdf,
                                     String dosyaAdi) {
        String konu = "IsikCampusOS Katılım Sertifikanız";
        String icerik = "Merhaba " + aliciAdi + ",\n\n"
                + etkinlikBasligi + " etkinliği için katılım sertifikanız ekte yer almaktadır.\n\n"
                + "IsikCampusOS";
 
        if (!mailEnabled) {
            log.info("Mail gönderimi kapalı. Alıcı: {}, Konu: {}, Ek: {}, Boyut: {} byte",
                    alici, konu, dosyaAdi, sertifikaPdf == null ? 0 : sertifikaPdf.length);
            return;
        }
 
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(alici);
            helper.setSubject(konu);
            helper.setText(icerik);
            helper.addAttachment(dosyaAdi, new ByteArrayResource(sertifikaPdf), "application/pdf");
 
            mailSender.send(message);
            log.info("Sertifika e-postası gönderildi. Alıcı: {}, Etkinlik: {}, Ek: {}", alici, etkinlikBasligi, dosyaAdi);
        } catch (Exception e) {
            log.error("Sertifika e-postası gönderilemedi. Alıcı: {}, Etkinlik: {}", alici, etkinlikBasligi, e);
            throw new RuntimeException("Sertifika e-postası gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.");
        }
    }
 
    private void kodGonder(String alici, String konu, String icerik) {
        if (!mailEnabled) {
            log.info("Mail gönderimi kapalı. Alıcı: {}, Konu: {}, İçerik: {}", alici, konu, icerik);
            return;
        }
 
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(alici);
            message.setSubject(konu);
            message.setText(icerik);
 
            mailSender.send(message);
            log.info("E-posta gönderildi. Alıcı: {}, Konu: {}", alici, konu);
        } catch (Exception e) {
            log.error("E-posta gönderilemedi. Alıcı: {}, Konu: {}", alici, konu, e);
            throw new RuntimeException("E-posta gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.");
        }
    }
}
