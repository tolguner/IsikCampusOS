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

    public SurucuDogrulama benim(String kullaniciId) {
        return depo.findByKullaniciId(kullaniciId).orElse(null);
    }

    @Transactional
    public SurucuDogrulama basvur(String kullaniciId, SurucuDogrulamaTalebi talep) {
        SurucuDogrulama kayit = depo.findByKullaniciId(kullaniciId).orElseGet(SurucuDogrulama::new);
        kayit.setKullaniciId(kullaniciId);
        kayit.setEhliyetSinifi(zorunlu(talep.getEhliyetSinifi(), "Ehliyet sınıfı"));
        kayit.setEhliyetNo(talep.getEhliyetNo());
        kayit.setEhliyetSahibiAdSoyad(talep.getEhliyetSahibiAdSoyad());
        kayit.setVerilisTarihi(talep.getVerilisTarihi());
        kayit.setGecerlilikTarihi(talep.getGecerlilikTarihi());
        // Ehliyet artık araçtan bağımsız; belge fotoğrafı zorunlu (yalnız metin yeterli değil).
        kayit.setBelgeUrl(zorunlu(talep.getBelgeUrl(), "Ehliyet belgesi fotoğrafı"));
        kayit.setDurum(SurucuDogrulama.DogrulamaDurumu.BEKLEMEDE);
        kayit.setAdminNotu(null);
        kayit.setInceleyenKullaniciId(null);
        kayit.setIncelenmeTarihi(null);
        return depo.save(kayit);
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
