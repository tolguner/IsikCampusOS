package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.AdminIncelemeTalebi;
import com.isik.kampusos.yolculuk.dto.AracTalebi;
import com.isik.kampusos.yolculuk.model.Arac;
import com.isik.kampusos.yolculuk.repository.AracDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/** Sürücü garajı: çoklu araç ekleme/düzenleme/silme + yönetici onay akışı. Görsel zorunlu. */
@Service
@RequiredArgsConstructor
public class AracServisi {

    private final AracDeposu depo;

    public List<Arac> benimAraclarim(String kullaniciId) {
        return depo.findByKullaniciIdOrderByOlusturulmaTarihiDesc(kullaniciId);
    }

    @Transactional
    public Arac ekle(String kullaniciId, AracTalebi talep) {
        Arac arac = Arac.builder()
                .kullaniciId(kullaniciId)
                .marka(talep.getMarka())
                .model(talep.getModel())
                .aracTipi(talep.getAracTipi())
                .modelYili(talep.getModelYili())
                .markaModel(zorunlu(markaModelHesapla(talep), "Araç marka/model"))
                .plaka(zorunlu(talep.getPlaka(), "Plaka").toUpperCase(Locale.forLanguageTag("tr-TR")))
                .renk(talep.getRenk())
                .koltukKapasitesi(talep.getKoltukKapasitesi())
                .gorselUrl(zorunlu(talep.getGorselUrl(), "Araç görseli"))
                .durum(Arac.AracDurumu.BEKLEMEDE)
                .build();
        return depo.save(arac);
    }

    /** marka + model varsa birleştirir; yoksa legacy markaModel alanına düşer. */
    private String markaModelHesapla(AracTalebi talep) {
        String marka = talep.getMarka() == null ? "" : talep.getMarka().trim();
        String model = talep.getModel() == null ? "" : talep.getModel().trim();
        String birlesik = (marka + " " + model).trim();
        if (!birlesik.isBlank()) return birlesik;
        return talep.getMarkaModel();
    }

    /** Araç güncellenince yeniden onaya düşer (onaylı araç düzenlenirse durum BEKLEMEDE olur). */
    @Transactional
    public Arac guncelle(String kullaniciId, String id, AracTalebi talep) {
        Arac arac = sahipligiDogrula(kullaniciId, id);
        arac.setMarka(talep.getMarka());
        arac.setModel(talep.getModel());
        arac.setAracTipi(talep.getAracTipi());
        arac.setModelYili(talep.getModelYili());
        arac.setMarkaModel(zorunlu(markaModelHesapla(talep), "Araç marka/model"));
        arac.setPlaka(zorunlu(talep.getPlaka(), "Plaka").toUpperCase(Locale.forLanguageTag("tr-TR")));
        arac.setRenk(talep.getRenk());
        arac.setKoltukKapasitesi(talep.getKoltukKapasitesi());
        arac.setGorselUrl(zorunlu(talep.getGorselUrl(), "Araç görseli"));
        arac.setDurum(Arac.AracDurumu.BEKLEMEDE);
        arac.setAdminNotu(null);
        arac.setInceleyenKullaniciId(null);
        arac.setIncelenmeTarihi(null);
        return depo.save(arac);
    }

    @Transactional
    public void sil(String kullaniciId, String id) {
        Arac arac = sahipligiDogrula(kullaniciId, id);
        depo.delete(arac);
    }

    public List<Arac> bekleyenler() {
        return depo.findByDurumOrderByOlusturulmaTarihiAsc(Arac.AracDurumu.BEKLEMEDE);
    }

    @Transactional
    public Arac incele(String adminId, String id, AdminIncelemeTalebi talep) {
        Arac arac = depo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Araç bulunamadı."));
        Arac.AracDurumu durum;
        try {
            durum = Arac.AracDurumu.valueOf(talep.getDurum().trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz araç durumu.");
        }
        arac.setDurum(durum);
        arac.setAdminNotu(talep.getNot());
        arac.setInceleyenKullaniciId(adminId);
        arac.setIncelenmeTarihi(LocalDateTime.now());
        return depo.save(arac);
    }

    private Arac sahipligiDogrula(String kullaniciId, String id) {
        return depo.findByIdAndKullaniciId(id, kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Araç bulunamadı."));
    }

    private String zorunlu(String deger, String alan) {
        if (deger == null || deger.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, alan + " zorunludur.");
        }
        return deger.trim();
    }
}
