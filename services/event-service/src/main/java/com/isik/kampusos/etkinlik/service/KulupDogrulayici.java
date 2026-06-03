package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.model.AkademikKadro;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Kulüp profil/danışman/başkan alanlarının doğrulaması ve yönetici (başkan) güncelleme
 * yardımcıları. Hem {@link KulupServisi} hem {@link KulupProfilTalepServisi} tarafından
 * paylaşılır; yaprak bileşen olduğu için döngüsel bağımlılık oluşmaz.
 */
@Component
@RequiredArgsConstructor
public class KulupDogrulayici {

    private static final int KISA_ACIKLAMA_MIN_UZUNLUK = 20;
    private static final int KISA_ACIKLAMA_MAX_UZUNLUK = 180;
    private static final int VIZYON_MIN_UZUNLUK = 80;
    private static final int VIZYON_MAX_UZUNLUK = 3000;

    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final AkademikKadroServisi akademikKadroServisi;

    public void profilAlanlariniDogrula(
            String ad,
            String kisaAciklama,
            String vizyon,
            String danismanAdSoyad,
            String danismanEposta,
            String danismanBolumu) {
        kulupProfilIcerikAlanlariniDogrula(ad, kisaAciklama, vizyon);
        danismanAlanlariniDogrula(danismanAdSoyad, danismanEposta, danismanBolumu);
    }

    public void kulupProfilIcerikAlanlariniDogrula(String ad, String kisaAciklama, String vizyon) {
        if (ad == null || ad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp adı zorunludur");
        }
        if (kisaAciklama == null || kisaAciklama.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp kısa açıklaması zorunludur");
        }
        metinUzunlugunuDogrula(
                kisaAciklama.trim(),
                KISA_ACIKLAMA_MIN_UZUNLUK,
                KISA_ACIKLAMA_MAX_UZUNLUK,
                "Kulüp kısa açıklaması");
        if (vizyon == null || vizyon.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp vizyonu zorunludur");
        }
        metinUzunlugunuDogrula(
                vizyon.trim(),
                VIZYON_MIN_UZUNLUK,
                VIZYON_MAX_UZUNLUK,
                "Kulüp vizyonu");
    }

    private void danismanAlanlariniDogrula(String danismanAdSoyad, String danismanEposta, String danismanBolumu) {
        if (danismanAdSoyad == null || danismanAdSoyad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman adı soyadı zorunludur");
        }
        if (danismanEposta == null || danismanEposta.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman e-postası zorunludur");
        }
        if (!danismanEposta.trim().toLowerCase().endsWith("@isikun.edu.tr")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman e-postası @isikun.edu.tr ile bitmelidir");
        }
        if (danismanBolumu == null || danismanBolumu.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman bölümü zorunludur");
        }
    }

    private void metinUzunlugunuDogrula(String deger, int minUzunluk, int maxUzunluk, String alanAdi) {
        if (deger.length() < minUzunluk || deger.length() > maxUzunluk) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    alanAdi + " en az " + minUzunluk + " ve en fazla " + maxUzunluk + " karakter olmalıdır");
        }
    }

    public String vizyonCoz(String vizyon, String aciklama) {
        if (vizyon != null && !vizyon.isBlank()) {
            return vizyon;
        }
        return aciklama;
    }

    public DanismanBilgisi danismanCoz(
            String akademikKadroId,
            String danismanUnvani,
            String danismanAdSoyad,
            String danismanEposta,
            String danismanBolumu) {
        if (akademikKadroId != null && !akademikKadroId.isBlank()) {
            AkademikKadro kadro = akademikKadroServisi.idIleAktifBul(akademikKadroId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Seçilen akademik danışman bulunamadı"));
            return new DanismanBilgisi(
                    kadro.getId(),
                    bosuTemizle(kadro.getAkademikUnvan()),
                    bosuTemizle(kadro.getTamAd()),
                    bosuTemizle(kadro.getEposta()),
                    bosuTemizle(kadro.getBolum()));
        }

        return new DanismanBilgisi(
                null,
                bosuTemizle(danismanUnvani),
                bosuTemizle(danismanAdSoyad),
                bosuTemizle(danismanEposta),
                bosuTemizle(danismanBolumu));
    }

    public void baskanKullanilabilirMiDogrula(String ogrenciId, String mevcutKulupId) {
        if (ogrenciId == null || ogrenciId.isBlank()) {
            return;
        }

        boolean zatenBaskan = mevcutKulupId == null
                ? kulupDeposu.existsByYoneticiKullaniciIdAndSilindiFalse(ogrenciId.trim())
                : kulupDeposu.existsByYoneticiKullaniciIdAndSilindiFalseAndIdNot(ogrenciId.trim(), mevcutKulupId);
        if (zatenBaskan) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu öğrenci zaten başka bir kulübün başkanı");
        }
    }

    public void baskanAlanlariniDogrula(String ogrenciId, String adSoyad, String eposta) {
        if (ogrenciId == null || ogrenciId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Öğrenci numarası zorunludur");
        }
        if (adSoyad == null || adSoyad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başkan adı soyadı zorunludur");
        }
        if (eposta == null || eposta.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başkan e-postası zorunludur");
        }
    }

    public void yoneticiyiGuncelle(Kulup kulup, String ogrenciId, String adSoyad, String eposta) {
        String yeniYoneticiId = ogrenciId.trim();
        String eskiYoneticiId = kulup.getYoneticiKullaniciId();

        if (eskiYoneticiId != null && !eskiYoneticiId.trim().equalsIgnoreCase(yeniYoneticiId.trim())) {
            kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulup.getId(), eskiYoneticiId)
                    .ifPresent(eskiUyelik -> {
                        eskiUyelik.setRol(KulupUyesi.UyeRolu.UYE);
                        kulupUyesiDeposu.save(eskiUyelik);
                    });
        }

        KulupUyesi baskanUyeligi = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulup.getId(), yeniYoneticiId)
                .orElse(KulupUyesi.builder()
                        .kulupId(kulup.getId())
                        .kullaniciId(yeniYoneticiId)
                        .build());
        baskanUyeligi.setRol(KulupUyesi.UyeRolu.YONETICI);
        baskanUyeligi.setDurum(KulupUyesi.UyeDurumu.AKTIF);
        kulupUyesiDeposu.save(baskanUyeligi);

        kulup.setYoneticiKullaniciId(yeniYoneticiId);
        kulup.setBaskanTamAdi(adSoyad.trim());
        kulup.setBaskanEpostasi(eposta.trim());
    }

    public void danismanKullanilabilirMiDogrula(String akademikStaffId, String mevcutKulupId) {
        if (akademikStaffId == null || akademikStaffId.isBlank()) {
            return;
        }

        boolean zatenDanisman = mevcutKulupId == null
                ? kulupDeposu.existsByDanismanAkademikPersonelIdAndSilindiFalse(akademikStaffId.trim())
                : kulupDeposu.existsByDanismanAkademikPersonelIdAndSilindiFalseAndIdNot(akademikStaffId.trim(),
                        mevcutKulupId);
        if (zatenDanisman) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu akademik danışman zaten başka bir kulübe atanmış");
        }
    }

    private String bosuTemizle(String deger) {
        return deger == null ? "" : deger.trim();
    }

    public record DanismanBilgisi(
            String akademikStaffId,
            String title,
            String adSoyad,
            String eposta,
            String bolum) {
    }
}
