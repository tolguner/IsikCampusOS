package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.MenuOgesiTalebi;
import com.isik.kampusos.yemek.dto.SaticiGuncellemeTalebi;
import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SaticiServisi {

    private final SaticiDeposu saticiDeposu;
    private final MenuOgesiDeposu menuOgesiDeposu;

    // --- Öğrenci / herkese görünür ---

    public List<Satici> aktifSaticilar() {
        return saticiDeposu.findByDurumOrderByAdAsc(Satici.SaticiDurumu.AKTIF);
    }

    public List<MenuOgesi> saticiMenusu(String saticiId) {
        saticiDeposu.findById(saticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        return menuOgesiDeposu.findBySaticiIdAndDurumOrderByKategoriAscAdAsc(saticiId, MenuOgesi.MenuDurumu.AKTIF);
    }

    // --- İşletme yöneticisi (kendi satıcısı) ---

    public Satici benimSaticim(String yoneticiId) {
        return saticiBul(yoneticiId);
    }

    @Transactional
    public Satici saticiGuncelle(String yoneticiId, SaticiGuncellemeTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        if (talep.getAd() != null) s.setAd(talep.getAd());
        if (talep.getAciklama() != null) s.setAciklama(talep.getAciklama());
        if (talep.getKonumMetni() != null) s.setKonumMetni(talep.getKonumMetni());
        if (talep.getLogoUrl() != null) s.setLogoUrl(talep.getLogoUrl());
        if (talep.getAcik() != null) s.setAcik(talep.getAcik());
        return saticiDeposu.save(s);
    }

    public List<MenuOgesi> benimMenum(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return menuOgesiDeposu.findBySaticiIdAndDurumOrderByKategoriAscAdAsc(s.getId(), MenuOgesi.MenuDurumu.AKTIF);
    }

    @Transactional
    public MenuOgesi menuEkle(String yoneticiId, MenuOgesiTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        menuDogrula(talep);
        MenuOgesi oge = MenuOgesi.builder()
                .saticiId(s.getId())
                .ad(talep.getAd())
                .aciklama(talep.getAciklama())
                .kategori(talep.getKategori())
                .fiyat(talep.getFiyat())
                .gorselUrl(talep.getGorselUrl())
                .mevcut(talep.getMevcut() == null || talep.getMevcut())
                .durum(MenuOgesi.MenuDurumu.AKTIF)
                .build();
        return menuOgesiDeposu.save(oge);
    }

    @Transactional
    public MenuOgesi menuGuncelle(String yoneticiId, String ogeId, MenuOgesiTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        MenuOgesi oge = menuOgesiSahipligiyleBul(ogeId, s.getId());
        if (talep.getAd() != null) oge.setAd(talep.getAd());
        if (talep.getAciklama() != null) oge.setAciklama(talep.getAciklama());
        if (talep.getKategori() != null) oge.setKategori(talep.getKategori());
        if (talep.getFiyat() != null) {
            if (talep.getFiyat().signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fiyat negatif olamaz.");
            oge.setFiyat(talep.getFiyat());
        }
        if (talep.getGorselUrl() != null) oge.setGorselUrl(talep.getGorselUrl());
        if (talep.getMevcut() != null) oge.setMevcut(talep.getMevcut());
        return menuOgesiDeposu.save(oge);
    }

    @Transactional
    public void menuSil(String yoneticiId, String ogeId) {
        Satici s = saticiBul(yoneticiId);
        MenuOgesi oge = menuOgesiSahipligiyleBul(ogeId, s.getId());
        oge.setDurum(MenuOgesi.MenuDurumu.ARSIVLENDI);
        menuOgesiDeposu.save(oge);
    }

    // --- Sistem yöneticisi ---

    public List<Satici> tumSaticilar() {
        return saticiDeposu.findAll();
    }

    @Transactional
    public Satici adminOlustur(SaticiOlusturmaTalebi talep) {
        if (talep.getAd() == null || talep.getAd().isBlank()
                || talep.getYoneticiKullaniciId() == null || talep.getYoneticiKullaniciId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Satıcı adı ve yönetici kullanıcı zorunludur.");
        }
        if (saticiDeposu.findByYoneticiKullaniciId(talep.getYoneticiKullaniciId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu yönetici zaten bir satıcıya atanmış.");
        }
        Satici s = Satici.builder()
                .ad(talep.getAd())
                .yoneticiKullaniciId(talep.getYoneticiKullaniciId())
                .konumMetni(talep.getKonumMetni())
                .aciklama(talep.getAciklama())
                .logoUrl(talep.getLogoUrl())
                .durum(Satici.SaticiDurumu.AKTIF)
                .acik(true)
                .build();
        return saticiDeposu.save(s);
    }

    @Transactional
    public Satici adminGuncelle(String id, SaticiOlusturmaTalebi talep) {
        Satici s = saticiDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        if (talep.getAd() != null) s.setAd(talep.getAd());
        if (talep.getKonumMetni() != null) s.setKonumMetni(talep.getKonumMetni());
        if (talep.getAciklama() != null) s.setAciklama(talep.getAciklama());
        if (talep.getLogoUrl() != null) s.setLogoUrl(talep.getLogoUrl());
        if (talep.getDurum() != null && !talep.getDurum().isBlank()) {
            try {
                s.setDurum(Satici.SaticiDurumu.valueOf(talep.getDurum().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz durum: " + talep.getDurum());
            }
        }
        return saticiDeposu.save(s);
    }

    // --- yardımcılar ---

    private Satici saticiBul(String yoneticiId) {
        return saticiDeposu.findByYoneticiKullaniciId(yoneticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hesabınıza bağlı bir satıcı bulunamadı."));
    }

    private MenuOgesi menuOgesiSahipligiyleBul(String ogeId, String saticiId) {
        MenuOgesi oge = menuOgesiDeposu.findById(ogeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menü öğesi bulunamadı."));
        if (!oge.getSaticiId().equals(saticiId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu menü öğesi sizin satıcınıza ait değil.");
        }
        return oge;
    }

    private void menuDogrula(MenuOgesiTalebi talep) {
        if (talep.getAd() == null || talep.getAd().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ürün adı zorunludur.");
        }
        if (talep.getFiyat() == null || talep.getFiyat().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçerli bir fiyat zorunludur.");
        }
    }
}
