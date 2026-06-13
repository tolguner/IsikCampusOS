package com.isik.kampusos.kimlik.service;
 
import com.isik.kampusos.kimlik.dto.SertifikaOlusturmaIstegiOlayi;
import com.isik.kampusos.kimlik.model.Kullanici;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
 
import static org.assertj.core.api.Assertions.assertThat;
 
class SertifikaPdfServisiTest {
 
    private final SertifikaPdfServisi sertifikaPdfServisi = new SertifikaPdfServisi();
 
    @Test
    void generatesPrestigiousUniversityClubCertificateWithTurkishTextAndVerificationInfo() throws Exception {
        Kullanici kullanici = Kullanici.builder()
                .ad("Muhammet Hasan")
                .soyad("Karabıyıkoğlu")
                .eposta("32yobi1053@isik.edu.tr")
                .build();
        SertifikaOlusturmaIstegiOlayi olay = new SertifikaOlusturmaIstegiOlayi(
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
 
        byte[] pdf = sertifikaPdfServisi.generateCertificate(kullanici, olay);
 
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
