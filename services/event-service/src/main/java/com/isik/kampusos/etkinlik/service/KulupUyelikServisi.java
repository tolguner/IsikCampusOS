package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.KulupUyeYaniti;
import com.isik.kampusos.etkinlik.dto.KulupUyeRolGuncellemeTalebi;
import com.isik.kampusos.etkinlik.dto.KulupUyeDurumGuncellemeTalebi;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Kulüp üyeliği işlemleri: katılma/ayrılma, üye listesi ve SKS yöneticisi tarafından
 * rol/durum güncelleme ile üye çıkarma.
 */
@Service
@RequiredArgsConstructor
public class KulupUyelikServisi {

    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final KulupYanitFabrikasi kulupYanitFabrikasi;

    @Transactional
    public KulupUyesi kulupeKatil(String kullaniciId, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Aktif olmayan kulüplere yeni üye kabul edilemez");
        }

        KulupUyesi mevcutUyelik = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, kullaniciId).orElse(null);
        if (mevcutUyelik != null) {
            if (mevcutUyelik.getDurum() != KulupUyesi.UyeDurumu.AKTIF
                    && mevcutUyelik.getRol() != KulupUyesi.UyeRolu.YONETICI) {
                mevcutUyelik.setDurum(KulupUyesi.UyeDurumu.AKTIF);
                return kulupUyesiDeposu.save(mevcutUyelik);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kullanıcı zaten bu kulübün üyesi");
        }

        KulupUyesi uyelik = KulupUyesi.builder()
                .kulupId(kulupId)
                .kullaniciId(kullaniciId)
                .rol(KulupUyesi.UyeRolu.UYE)
                .durum(KulupUyesi.UyeDurumu.AKTIF)
                .build();

        return kulupUyesiDeposu.save(uyelik);
    }

    @Transactional
    public void kuluptenAyril(String kullaniciId, String kulupId) {
        KulupUyesi uyelik = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp üyeliği bulunamadı"));

        if (uyelik.getRol() == KulupUyesi.UyeRolu.YONETICI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kulüp başkanı başka bir başkan atamadan kulüpten ayrılamaz");
        }

        kulupUyesiDeposu.delete(uyelik);
    }

    public List<KulupUyeYaniti> kulupUyeleriniGetir(String kullaniciId, String yetkiler, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())
                && !kulupYanitFabrikasi.sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Sadece kulüp yöneticisi veya SKS yöneticisi üye listesini görüntüleyebilir");
        }
        return kulupUyesiDeposu.findByKulupId(kulupId).stream()
                .map(m -> KulupUyeYaniti.builder()
                        .id(m.getId())
                        .kulupId(m.getKulupId())
                        .kullaniciId(m.getKullaniciId())
                        .adSoyad("") // Frontend enriches this from auth-service
                        .rol(m.getRol().name())
                        .durum(m.getDurum().name())
                        .katilmaTarihi(m.getKatilmaTarihi())
                        .build())
                .toList();
    }

    @Transactional
    public void uyeRolunuGuncelle(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId,
            KulupUyeRolGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulupYanitFabrikasi.sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üye rollerini değiştirebilir");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        KulupUyesi.UyeRolu talepEdilenRol = uyeRolunuCoz(talep.getRol());
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kulüp başkanı rolü buradan değiştirilemez");
        }
        if (talepEdilenRol == KulupUyesi.UyeRolu.YONETICI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kulüp başkanlığını devretmek için başkan atama akışını kullanın");
        }
        hedefUye.setRol(talepEdilenRol);
        kulupUyesiDeposu.save(hedefUye);
    }

    @Transactional
    public void uyeDurumunuGuncelle(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId,
            KulupUyeDurumGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulupYanitFabrikasi.sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üye durumlarını değiştirebilir");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        KulupUyesi.UyeDurumu talepEdilenDurum = uyeDurumunuCoz(talep.getDurum());
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kulüp başkanı durumu değiştirilemez");
        }
        hedefUye.setDurum(talepEdilenDurum);
        kulupUyesiDeposu.save(hedefUye);
    }

    @Transactional
    public void uyeyiCikar(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulupYanitFabrikasi.sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üyeleri çıkarabilir");
        }
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp başkanı çıkarılamaz");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        kulupUyesiDeposu.delete(hedefUye);
    }

    private KulupUyesi.UyeRolu uyeRolunuCoz(String rol) {
        if (rol == null || rol.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üye rolü zorunludur");
        }
        try {
            return KulupUyesi.UyeRolu.valueOf(rol.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz üye rolü");
        }
    }

    private KulupUyesi.UyeDurumu uyeDurumunuCoz(String durum) {
        if (durum == null || durum.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üye durumu zorunludur");
        }
        try {
            return KulupUyesi.UyeDurumu.valueOf(durum.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz üye durumu");
        }
    }
}
