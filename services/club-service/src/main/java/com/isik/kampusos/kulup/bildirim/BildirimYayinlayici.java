package com.isik.kampusos.kulup.bildirim;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kulup.dto.DuyuruTalebi;
import com.isik.kampusos.kulup.model.Kulup;
import com.isik.kampusos.kulup.repository.KulupDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Bildirim üretici (publisher). Eski {@code BildirimServisi}'nin oluşturma metotlarının yerini alır;
 * bildirimi persist etmek yerine {@code bildirim.olustur} Kafka olayı yayınlar. Bildirimi
 * notification-service tüketip kalıcılaştırır.
 *
 * <p>Bağlantı/etiket çözümü ve hedef kitle mantığı (kulüp başkanlarına fan-out dahil) burada,
 * yani kulüp verisinin bulunduğu serviste kalır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimYayinlayici {

    private static final String TOPIC = "bildirim.olustur";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KulupDeposu kulupDeposu;

    public void kullaniciyiTurIleBilgilendir(String kullaniciId, String baslik, String mesaj,
                                             String ilgiliEtkinlikId, BildirimTuru tur) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(tur.name())
                .hedefKitle(HedefKitle.KULLANICI.name())
                .aliciKullaniciId(kullaniciId)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl(kullaniciBildirimBaglantisiniCoz(tur, ilgiliEtkinlikId))
                .baglantiEtiketi(kullaniciBildirimEtiketiniCoz(tur))
                .build());
    }

    public void kullaniciyiSertifikaylaBilgilendir(String kullaniciId, String baslik, String mesaj,
                                                   String ilgiliEtkinlikId) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(BildirimTuru.SERTIFIKA.name())
                .hedefKitle(HedefKitle.KULLANICI.name())
                .aliciKullaniciId(kullaniciId)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl("/bildirimler")
                .baglantiEtiketi("Sertifikayı görüntüle")
                .build());
    }

    public void kullaniciDuyurusuBilgilendir(String kullaniciId, String baslik, String mesaj,
                                             String baglantiUrl, String baglantiEtiketi, String resimUrl,
                                             String olusturan, String olusturanAdi) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(BildirimTuru.DUYURU.name())
                .hedefKitle(HedefKitle.KULLANICI.name())
                .aliciKullaniciId(kullaniciId)
                .baglantiUrl(bosuTemizle(baglantiUrl))
                .baglantiEtiketi(bosuTemizle(baglantiEtiketi))
                .resimUrl(bosuTemizle(resimUrl))
                .olusturan(olusturan)
                .olusturanAdi(bosuTemizle(olusturanAdi))
                .build());
    }

    public void hedefKitleyiBilgilendir(HedefKitle kitle, String baslik, String mesaj,
                                        String olusturan, String olusturanAdi, String ilgiliEtkinlikId) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(BildirimTuru.DUYURU.name())
                .hedefKitle(kitle.name())
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .build());
    }

    public void sksEtkinlikOnayTalebiBilgilendir(String baslik, String mesaj, String olusturan,
                                                 String olusturanAdi, String ilgiliEtkinlikId) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(BildirimTuru.ETKINLIK_ONAY_TALEBI.name())
                .hedefKitle(HedefKitle.SKS_YONETICILERI.name())
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl("/")
                .baglantiEtiketi("Etkinlik taleplerini aç")
                .build());
    }

    public void sksProfilOnayTalebiBilgilendir(String baslik, String mesaj, String olusturan, String olusturanAdi) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(BildirimTuru.PROFIL_ONAY_TALEBI.name())
                .hedefKitle(HedefKitle.SKS_YONETICILERI.name())
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .baglantiUrl("/")
                .baglantiEtiketi("Profil taleplerini aç")
                .build());
    }

    /**
     * SKS duyurusu. Tüm öğrencilere yayın yapar veya kulüp başkanlarına tek tek (fan-out) gönderir;
     * böylece notification-service'in kulüp verisine erişmesi gerekmez.
     */
    public void duyuruYayinla(String olusturan, DuyuruTalebi talep) {
        if (talep.getBaslik() == null || talep.getBaslik().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru basligi zorunludur");
        }
        if (talep.getMesaj() == null || talep.getMesaj().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru mesaji zorunludur");
        }
        if (talep.getBaglantiEtiketi() != null && !talep.getBaglantiEtiketi().isBlank()
                && (talep.getBaglantiUrl() == null || talep.getBaglantiUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Baglanti etiketi verildiginde baglanti URL'i zorunludur");
        }

        boolean kulupBaskanlari = kulupBaskanlariMi(talep.getHedefKitle());

        if (kulupBaskanlari) {
            kulupDeposu.findAllBySilindiFalseOrderByAdAsc().stream()
                    .map(Kulup::getYoneticiKullaniciId)
                    .filter(id -> id != null && !id.isBlank())
                    .distinct()
                    .forEach(baskanId -> kullaniciDuyurusuBilgilendir(
                            baskanId,
                            talep.getBaslik().trim(),
                            talep.getMesaj().trim(),
                            talep.getBaglantiUrl(),
                            talep.getBaglantiEtiketi(),
                            talep.getResimUrl(),
                            olusturan,
                            talep.getOlusturanAdi()));
            return;
        }

        // Tüm öğrenciler
        yayinla(BildirimOlayi.builder()
                .baslik(talep.getBaslik().trim())
                .mesaj(talep.getMesaj().trim())
                .tur(BildirimTuru.DUYURU.name())
                .hedefKitle(HedefKitle.TUM_OGRENCILER.name())
                .baglantiUrl(bosuTemizle(talep.getBaglantiUrl()))
                .baglantiEtiketi(bosuTemizle(talep.getBaglantiEtiketi()))
                .resimUrl(bosuTemizle(talep.getResimUrl()))
                .olusturan(olusturan)
                .olusturanAdi(bosuTemizle(talep.getOlusturanAdi()))
                .build());
    }

    private boolean kulupBaskanlariMi(String deger) {
        if ("CLUB_PRESIDENTS".equalsIgnoreCase(deger) || "KULUP_BASKANLARI".equalsIgnoreCase(deger)) {
            return true;
        }
        if ("ALL_STUDENTS".equalsIgnoreCase(deger) || "TUM_OGRENCILER".equalsIgnoreCase(deger)) {
            return false;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gecersiz bildirim hedef kitlesi");
    }

    private void yayinla(BildirimOlayi olay) {
        try {
            String key = olay.getAliciKullaniciId() != null ? olay.getAliciKullaniciId() : olay.getHedefKitle();
            kafkaTemplate.send(TOPIC, key, objectMapper.writeValueAsString(olay));
        } catch (Exception e) {
            log.error("bildirim.olustur olayı yayınlanamadı: {}", olay, e);
        }
    }

    private String kullaniciBildirimBaglantisiniCoz(BildirimTuru tur, String ilgiliEtkinlikId) {
        if (ilgiliEtkinlikId == null || ilgiliEtkinlikId.isBlank()) {
            return null;
        }
        if (tur == BildirimTuru.ETKINLIK_ONAY_TALEBI || tur == BildirimTuru.ETKINLIK_REVIZYON_TALEBI) {
            return "/kulup-yonetimi/etkinlikler/" + ilgiliEtkinlikId;
        }
        if (tur == BildirimTuru.PROFIL_ONAY_TALEBI) {
            return "/kulup-yonetimi";
        }
        return null;
    }

    private String kullaniciBildirimEtiketiniCoz(BildirimTuru tur) {
        if (tur == BildirimTuru.ETKINLIK_ONAY_TALEBI || tur == BildirimTuru.ETKINLIK_REVIZYON_TALEBI) {
            return "Etkinliği aç";
        }
        if (tur == BildirimTuru.PROFIL_ONAY_TALEBI) {
            return "Kulüp yönetimini aç";
        }
        return null;
    }

    private String bosuTemizle(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
