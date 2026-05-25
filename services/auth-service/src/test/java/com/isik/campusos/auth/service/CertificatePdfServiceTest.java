package com.isik.campusos.auth.service;

import com.isik.campusos.auth.dto.CertificateIssueRequestedEvent;
import com.isik.campusos.auth.model.User;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CertificatePdfServiceTest {

    private final CertificatePdfService certificatePdfService = new CertificatePdfService();

    @Test
    void generatesPrestigiousUniversityClubCertificateWithTurkishTextAndVerificationInfo() throws Exception {
        User user = User.builder()
                .firstName("Muhammet Hasan")
                .lastName("Karabıyıkoğlu")
                .email("32yobi1053@isik.edu.tr")
                .build();
        CertificateIssueRequestedEvent event = new CertificateIssueRequestedEvent(
                "event-1",
                "Vibe Coding ile Generative AI Projesi Geliştirme Workshop",
                "IT&MIS Kulübü",
                "user-1",
                "Katılım Sertifikası",
                "CERT-2026-ITMIS-0001",
                "2026-05-25T14:30:00",
                "2026-05-25T12:00:00",
                "Şile Kampüsü / İstanbul",
                "Ayşe Yılmaz"
        );

        byte[] pdf = certificatePdfService.generateCertificate(user, event);

        assertThat(pdf).isNotEmpty();
        String text = new PDFTextStripper().getText(Loader.loadPDF(pdf));
        assertThat(text).contains("FMV IŞIK ÜNİVERSİTESİ");
        assertThat(text).contains("IT&MIS Kulübü");
        assertThat(text).contains("Ayşe Yılmaz");
        assertThat(text).doesNotContain("Kulüp Temsilcisi");
        assertThat(text).contains("KATILIM SERTİFİKASI");
        assertThat(text).contains("Muhammet Hasan Karabıyıkoğlu");
        assertThat(text).contains("aktif katılım");
        assertThat(text).contains("değerli");
        assertThat(text).contains("katkılarınızdan dolayı");
        assertThat(text).contains("Sertifika No: CERT-2026-ITMIS-0001");
        assertThat(text).contains("Doğrulama");
    }
}
