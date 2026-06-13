package com.isik.kampusos.kimlik.messaging.consumer;
 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kimlik.dto.SertifikaOlusturmaIstegiOlayi;
import com.isik.kampusos.kimlik.model.SertifikaTeslimatGunlugu;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.repository.SertifikaTeslimatGunluguDeposu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import com.isik.kampusos.kimlik.service.SertifikaPdfServisi;
import com.isik.kampusos.kimlik.service.EpostaServisi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
 
import java.time.LocalDateTime;
import java.util.Optional;
 
@Service
@RequiredArgsConstructor
@Slf4j
public class SertifikaOlusturmaOlayTuketicisi {
 
    private final ObjectMapper objectMapper;
    private final KullaniciDeposu kullaniciDeposu;
    private final SertifikaTeslimatGunluguDeposu sertifikaTeslimatGunluguDeposu;
    private final SertifikaPdfServisi sertifikaPdfServisi;
    private final EpostaServisi epostaServisi;
 
    @KafkaListener(topics = "etkinlik.sertifika.olusturma-talep-edildi", groupId = "kimlik-servisi-sertifika-postacisi")
    public void consumeSertifikaOlusturmaIstegi(String mesaj) {
        log.info("etkinlik.sertifika.olusturma-talep-edildi olayı alındı: {}", mesaj);
        SertifikaOlusturmaIstegiOlayi olay = parse(mesaj);
 
        Optional<SertifikaTeslimatGunlugu> mevcutTeslimat = sertifikaTeslimatGunluguDeposu.findBySertifikaKodu(olay.getSertifikaKodu());
        if (mevcutTeslimat
                .filter(teslimat -> teslimat.getDurum() == SertifikaTeslimatGunlugu.TeslimatDurumu.GONDERILDI)
                .isPresent()) {
            log.info("Sertifika zaten gönderildi. Mükerrer olay atlanıyor. Sertifika kodu: {}", olay.getSertifikaKodu());
            return;
        }
 
        String eposta = olay.getKullaniciId() == null ? "bilinmeyen" : olay.getKullaniciId();
        try {
            Kullanici kullanici = kullaniciDeposu.findById(olay.getKullaniciId())
                    .orElseThrow(() -> new IllegalArgumentException("Kullanıcı bulunamadı: " + olay.getKullaniciId()));
            eposta = kullanici.getEposta();
 
            byte[] pdf = sertifikaPdfServisi.generateCertificate(kullanici, olay);
            epostaServisi.sertifikaEpostasiGonder(
                    kullanici.getEposta(),
                    kullanici.getTamAd(),
                    olay.getEtkinlikBasligi(),
                    pdf,
                    sertifikaDosyaAdi(olay)
            );
 
            teslimatKaydet(olay, kullanici.getEposta(), SertifikaTeslimatGunlugu.TeslimatDurumu.GONDERILDI, null, LocalDateTime.now());
        } catch (Exception e) {
            teslimatKaydet(
                    olay,
                    eposta,
                    SertifikaTeslimatGunlugu.TeslimatDurumu.HATA,
                    e.getMessage(),
                    null
            );
            log.error("Sertifika teslimatı başarısız oldu. Sertifika kodu: {}", olay.getSertifikaKodu(), e);
            throw new RuntimeException("Sertifika teslimatı başarısız oldu", e);
        }
    }
 
    private SertifikaOlusturmaIstegiOlayi parse(String mesaj) {
        try {
            SertifikaOlusturmaIstegiOlayi olay = objectMapper.readValue(mesaj, SertifikaOlusturmaIstegiOlayi.class);
            if (bosMu(olay.getSertifikaKodu()) || bosMu(olay.getKullaniciId()) || bosMu(olay.getEtkinlikId())) {
                throw new IllegalArgumentException("Sertifika olayı sertifikaKodu, kullaniciId ve etkinlikId alanlarını barındırmalıdır.");
            }
            return olay;
        } catch (Exception e) {
            log.error("Sertifika olayı ayrıştırılamadı: {}", mesaj, e);
            throw new RuntimeException("Sertifika olayı ayrıştırılamadı", e);
        }
    }
 
    private void teslimatKaydet(SertifikaOlusturmaIstegiOlayi olay,
                                 String eposta,
                                 SertifikaTeslimatGunlugu.TeslimatDurumu durum,
                                 String hataMesaji,
                                 LocalDateTime gonderilmeTarihi) {
        SertifikaTeslimatGunlugu gunluk = sertifikaTeslimatGunluguDeposu.findBySertifikaKodu(olay.getSertifikaKodu())
                .orElseGet(() -> SertifikaTeslimatGunlugu.builder()
                        .sertifikaKodu(olay.getSertifikaKodu())
                        .kullaniciId(olay.getKullaniciId())
                        .etkinlikId(olay.getEtkinlikId())
                        .build());
        gunluk.setKullaniciId(olay.getKullaniciId());
        gunluk.setEposta(eposta);
        gunluk.setEtkinlikId(olay.getEtkinlikId());
        gunluk.setAliciAdi(aliciAdiCozumle(olay, eposta));
        gunluk.setEtkinlikBasligi(olay.getEtkinlikBasligi());
        gunluk.setKulupAdi(olay.getKulupAdi());
        gunluk.setSertifikaBasligi(olay.getSertifikaBasligi());
        gunluk.setVerilmeTarihi(verilmeTarihiCozumle(olay.getOlusturulmaTarihi()));
        gunluk.setDurum(durum);
        gunluk.setHataMesaji(kirp(hataMesaji));
        gunluk.setGonderilmeTarihi(gonderilmeTarihi);
        sertifikaTeslimatGunluguDeposu.save(gunluk);
    }
 
    private String aliciAdiCozumle(SertifikaOlusturmaIstegiOlayi olay, String eposta) {
        return kullaniciDeposu.findById(olay.getKullaniciId())
                .map(Kullanici::getTamAd)
                .orElse(eposta);
    }
 
    private LocalDateTime verilmeTarihiCozumle(String deger) {
        if (deger == null || deger.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(deger);
        } catch (Exception ignored) {
            return null;
        }
    }
 
    private String sertifikaDosyaAdi(SertifikaOlusturmaIstegiOlayi olay) {
        String kod = olay.getSertifikaKodu().replaceAll("[^A-Za-z0-9_-]", "_");
        return "isikcampusos-sertifika-" + kod + ".pdf";
    }
 
    private String kirp(String deger) {
        if (deger == null) {
            return null;
        }
        return deger.length() <= 2000 ? deger : deger.substring(0, 2000);
    }
 
    private boolean bosMu(String deger) {
        return deger == null || deger.isBlank();
    }
}
