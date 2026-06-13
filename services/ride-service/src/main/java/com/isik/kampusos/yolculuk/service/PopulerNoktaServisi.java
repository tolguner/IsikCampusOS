package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.NoktaTalebi;
import com.isik.kampusos.yolculuk.model.PopulerNokta;
import com.isik.kampusos.yolculuk.repository.PopulerNoktaDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Popüler "kısa yol" noktaları: haritada hızlı seçim önerisi. Sabit/zorunlu değildir; kullanıcı
 * haritadan herhangi bir noktayı seçebilir. Bir yolculukta kullanılan nokta, en yakın popüler
 * noktanın (≤0.5 km) sayacını artırır; böylece liste "en çok tercih edilen" sıraya göre güncellenir.
 * Yeni popüler nokta ekleme yetkisi admindedir (rastgele noktalar listeyi kirletmez).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PopulerNoktaServisi {

    private static final double ESLESME_KM = 0.5;

    private final PopulerNoktaDeposu deposu;

    public List<PopulerNokta> populerler() {
        return deposu.findByAktifTrueOrderByKullanimSayisiDesc();
    }

    /** Kullanılan noktaya en yakın aktif popüler noktanın sayacını artırır (varsa). */
    @Transactional
    public void kullanimArttir(NoktaTalebi nokta) {
        if (nokta == null) return;
        try {
            deposu.findByAktifTrueOrderByKullanimSayisiDesc().stream()
                    .min(Comparator.comparingDouble(p -> RotaIstemcisi.haversineKm(
                            new double[]{nokta.getEnlem(), nokta.getBoylam()},
                            new double[]{p.getEnlem(), p.getBoylam()})))
                    .filter(p -> RotaIstemcisi.haversineKm(
                            new double[]{nokta.getEnlem(), nokta.getBoylam()},
                            new double[]{p.getEnlem(), p.getBoylam()}) <= ESLESME_KM)
                    .ifPresent(p -> {
                        p.setKullanimSayisi(p.getKullanimSayisi() + 1);
                        deposu.save(p);
                    });
        } catch (Exception e) {
            log.warn("Popüler nokta sayacı güncellenemedi: {}", e.getMessage());
        }
    }

    // --- Admin ---

    @Transactional
    public PopulerNokta ekle(String ad, double enlem, double boylam) {
        if (ad == null || ad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nokta adı zorunludur.");
        }
        return deposu.save(PopulerNokta.builder().ad(ad.trim()).enlem(enlem).boylam(boylam).build());
    }

    @Transactional
    public PopulerNokta guncelle(String id, String ad, Double enlem, Double boylam, Boolean aktif) {
        PopulerNokta p = deposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nokta bulunamadı."));
        if (ad != null && !ad.isBlank()) p.setAd(ad.trim());
        if (enlem != null) p.setEnlem(enlem);
        if (boylam != null) p.setBoylam(boylam);
        if (aktif != null) p.setAktif(aktif);
        return deposu.save(p);
    }

    @Transactional
    public void sil(String id) {
        deposu.deleteById(id);
    }
}
