package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.AdminIncelemeTalebi;
import com.isik.kampusos.yolculuk.dto.SurucuDogrulamaTalebi;
import com.isik.kampusos.yolculuk.model.SurucuDogrulama;
import com.isik.kampusos.yolculuk.repository.SurucuDogrulamaDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SurucuDogrulamaServisi {

    private final SurucuDogrulamaDeposu depo;
    private final KullaniciOzetIstemcisi kullaniciOzetIstemcisi;
    private final EhliyetAnalizServisi ehliyetAnalizServisi;

    public SurucuDogrulama benim(String kullaniciId) {
        return depo.findByKullaniciId(kullaniciId).orElse(null);
    }

    @Transactional
    public SurucuDogrulama basvur(String kullaniciId, SurucuDogrulamaTalebi talep) {
        SurucuDogrulama kayit = depo.findByKullaniciId(kullaniciId).orElseGet(SurucuDogrulama::new);
        kayit.setKullaniciId(kullaniciId);
        kayit.setEhliyetSinifi(zorunlu(talep.getEhliyetSinifi(), "Ehliyet sınıfı"));
        kayit.setEhliyetNo(talep.getEhliyetNo());
        // Ehliyet sahibi adı her zaman giriş yapan kullanıcının kendi ad-soyadıdır (elle girilmez).
        var o = kullaniciOzetIstemcisi.ozetler(java.util.List.of(kullaniciId)).get(kullaniciId);
        kayit.setEhliyetSahibiAdSoyad(o != null ? o.adSoyad() : null);
        kayit.setVerilisTarihi(talep.getVerilisTarihi());
        kayit.setGecerlilikTarihi(talep.getGecerlilikTarihi());
        // Ehliyet artık araçtan bağımsız; belge fotoğrafı zorunlu (yalnız metin yeterli değil).
        kayit.setBelgeUrl(zorunlu(talep.getBelgeUrl(), "Ehliyet belgesi fotoğrafı"));

        // Görseli sunucu tarafında (güvenilir) analiz et: belge gerçekten ehliyet mi ve
        // üzerindeki ad-soyad + TC, giriş yapan hesapla eşleşiyor mu? Eşleşirse Halit'in
        // manuel onayına gerek kalmadan otomatik ONAYLANDI; aksi halde BEKLEMEDE.
        var analiz = ehliyetAnalizServisi.analizEt(talep.getBelgeUrl());
        boolean otomatikOnay = analiz.isAnalizYapildi() && analiz.isEhliyet() && o != null
                && adEslesir(analiz.getAdSoyad(), o.adSoyad())
                && tcEslesir(analiz.getTcNo(), o.tcKimlikMaskeli());

        if (otomatikOnay) {
            kayit.setDurum(SurucuDogrulama.DogrulamaDurumu.ONAYLANDI);
            kayit.setAdminNotu("Kimlik bilgileri (ad-soyad ve TC) hesapla eşleştiği için otomatik onaylandı.");
            kayit.setInceleyenKullaniciId("SISTEM");
            kayit.setIncelenmeTarihi(LocalDateTime.now());
        } else {
            kayit.setDurum(SurucuDogrulama.DogrulamaDurumu.BEKLEMEDE);
            kayit.setAdminNotu(null);
            kayit.setInceleyenKullaniciId(null);
            kayit.setIncelenmeTarihi(null);
        }
        return depo.save(kayit);
    }

    /** Belgedeki ad-soyad, hesaptaki ad-soyadla eşleşiyor mu? (hesabın tüm sözcükleri belgede geçmeli) */
    private boolean adEslesir(String belgeAd, String hesapAd) {
        if (belgeAd == null || belgeAd.isBlank() || hesapAd == null || hesapAd.isBlank()) return false;
        String b = sadelestir(belgeAd);
        for (String parca : sadelestir(hesapAd).split(" ")) {
            if (!parca.isBlank() && !b.contains(parca)) return false;
        }
        return true;
    }

    /** Belgeden okunan tam TC'nin ilk 5 hanesi, hesaptaki maskeli TC (ilk5+******) ile eşleşiyor mu? */
    private boolean tcEslesir(String belgeTc, String maskeliTc) {
        if (belgeTc == null || maskeliTc == null) return false;
        String b = belgeTc.replaceAll("\\D", "");
        String m = maskeliTc.replaceAll("\\D", "");
        return b.length() >= 5 && m.length() >= 5 && b.startsWith(m.substring(0, 5));
    }

    private String sadelestir(String s) {
        return s.trim().toUpperCase(new java.util.Locale("tr", "TR")).replaceAll("\\s+", " ");
    }

    public List<SurucuDogrulama> bekleyenler() {
        return depo.findByDurumOrderByOlusturulmaTarihiAsc(SurucuDogrulama.DogrulamaDurumu.BEKLEMEDE);
    }

    @Transactional
    public SurucuDogrulama incele(String adminId, String id, AdminIncelemeTalebi talep) {
        SurucuDogrulama kayit = depo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doğrulama başvurusu bulunamadı."));
        SurucuDogrulama.DogrulamaDurumu durum;
        try {
            durum = SurucuDogrulama.DogrulamaDurumu.valueOf(talep.getDurum().trim().toUpperCase(java.util.Locale.ROOT));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz doğrulama durumu.");
        }
        kayit.setDurum(durum);
        kayit.setAdminNotu(talep.getNot());
        kayit.setInceleyenKullaniciId(adminId);
        kayit.setIncelenmeTarihi(LocalDateTime.now());
        return depo.save(kayit);
    }

    private String zorunlu(String deger, String alan) {
        if (deger == null || deger.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, alan + " zorunludur.");
        }
        return deger.trim();
    }
}
