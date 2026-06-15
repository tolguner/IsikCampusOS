package com.isik.kampusos.kimlik.controller;

import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Servisler-arası (cluster-içi) kullanıcı özeti. Gateway'e açılmaz; yalnız diğer servisler
 * (ör. ride-service) başvuran kimliğini ad/öğrenci no/iletişim olarak çözmek için kullanır.
 */
@RestController
@RequestMapping("/api/v1/internal/kullanicilar")
@RequiredArgsConstructor
public class IcKullaniciDenetleyicisi {

    private final KullaniciDeposu kullaniciDeposu;

    @PostMapping("/ozet")
    public List<KullaniciOzeti> ozet(@RequestBody OzetIstegi istek) {
        if (istek == null || istek.getIds() == null || istek.getIds().isEmpty()) return List.of();
        return kullaniciDeposu.findAllById(istek.getIds()).stream()
                .map(IcKullaniciDenetleyicisi::ozetle)
                .toList();
    }

    private static KullaniciOzeti ozetle(Kullanici k) {
        KullaniciOzeti o = new KullaniciOzeti();
        o.setId(k.getId());
        o.setAd(k.getAd());
        o.setSoyad(k.getSoyad());
        o.setOgrenciNumarasi(k.getOgrenciNumarasi());
        o.setTelefon(k.getTelefon());
        o.setEposta(k.getEposta());
        return o;
    }

    @Data
    public static class OzetIstegi {
        private List<String> ids;
    }

    @Data
    public static class KullaniciOzeti {
        private String id;
        private String ad;
        private String soyad;
        private String ogrenciNumarasi;
        private String telefon;
        private String eposta;
    }
}
