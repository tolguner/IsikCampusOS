package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.model.DenetimGunlugu;
import com.isik.kampusos.yemek.repository.DenetimGunluguDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/** Tüm food işlemlerinin denetim günlüğünü tutar. Hata loglamayı engellemez (best-effort). */
@Service
@RequiredArgsConstructor
@Slf4j
public class DenetimServisi {

    private final DenetimGunluguDeposu deposu;

    public void kaydet(String varlikTuru, String varlikId, String islem, String yapanId, String yapanRol, String mesaj) {
        try {
            deposu.save(DenetimGunlugu.builder()
                    .varlikTuru(varlikTuru)
                    .varlikId(varlikId)
                    .islem(islem)
                    .yapanId(yapanId)
                    .yapanRol(yapanRol)
                    .mesaj(mesaj)
                    .build());
        } catch (Exception e) {
            log.warn("Denetim kaydı yazılamadı ({}/{}): {}", varlikTuru, islem, e.getMessage());
        }
    }

    public java.util.List<DenetimGunlugu> sonKayitlar() {
        return deposu.findTop500ByOrderByOlusturulmaTarihiDesc();
    }
}
