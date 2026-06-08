package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.model.FavoriSatici;
import com.isik.kampusos.yemek.repository.FavoriSaticiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriServisi {

    private final FavoriSaticiDeposu favoriDeposu;

    /** Öğrencinin favori satıcı id'leri. */
    public List<String> favoriSaticiIdleri(String kullaniciId) {
        return favoriDeposu.findByKullaniciId(kullaniciId).stream()
                .map(FavoriSatici::getSaticiId).toList();
    }

    @Transactional
    public void favoriEkle(String kullaniciId, String saticiId) {
        if (!favoriDeposu.existsByKullaniciIdAndSaticiId(kullaniciId, saticiId)) {
            favoriDeposu.save(FavoriSatici.builder()
                    .kullaniciId(kullaniciId)
                    .saticiId(saticiId)
                    .build());
        }
    }

    @Transactional
    public void favoriCikar(String kullaniciId, String saticiId) {
        favoriDeposu.findByKullaniciIdAndSaticiId(kullaniciId, saticiId)
                .ifPresent(favoriDeposu::delete);
    }
}
