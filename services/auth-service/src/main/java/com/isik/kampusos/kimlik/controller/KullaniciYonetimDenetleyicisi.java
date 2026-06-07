package com.isik.kampusos.kimlik.controller;

import com.isik.kampusos.kimlik.dto.KullaniciYonetimGuncellemeTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.service.KullaniciYonetimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Sistem yöneticisi (ROLE_ADMIN) kullanıcı/rol yönetimi uçları.
 * Yetkilendirme GuvenlikYapilandirmasi içinde /api/v1/yonetim/** -> ROLE_ADMIN ile yapılır.
 */
@RestController
@RequestMapping("/api/v1/yonetim/kullanicilar")
@RequiredArgsConstructor
public class KullaniciYonetimDenetleyicisi {

    private final KullaniciYonetimServisi kullaniciYonetimServisi;

    @GetMapping
    public ResponseEntity<Page<KullaniciYonetimYaniti>> listele(
            @RequestParam(defaultValue = "0") int sayfa,
            @RequestParam(defaultValue = "20") int boyut,
            @RequestParam(required = false) String arama,
            @RequestParam(required = false) String durum,
            @RequestParam(required = false) String rol) {
        return ResponseEntity.ok(kullaniciYonetimServisi.listele(sayfa, boyut, arama, durum, rol));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KullaniciYonetimYaniti> getir(@PathVariable String id) {
        return ResponseEntity.ok(kullaniciYonetimServisi.getir(id));
    }

    @PostMapping
    public ResponseEntity<KullaniciYonetimYaniti> olustur(@RequestBody KullaniciYonetimOlusturmaTalebi talep) {
        return ResponseEntity.ok(kullaniciYonetimServisi.olustur(talep));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KullaniciYonetimYaniti> guncelle(
            @PathVariable String id,
            @RequestBody KullaniciYonetimGuncellemeTalebi talep) {
        return ResponseEntity.ok(kullaniciYonetimServisi.guncelle(id, talep));
    }

    @PostMapping("/{id}/sifre-sifirla")
    public ResponseEntity<Map<String, String>> sifreSifirla(@PathVariable String id) {
        return ResponseEntity.ok(kullaniciYonetimServisi.sifreSifirla(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> sil(@PathVariable String id) {
        kullaniciYonetimServisi.sil(id);
        return ResponseEntity.ok(Map.of("mesaj", "Kullanıcı silindi."));
    }
}
