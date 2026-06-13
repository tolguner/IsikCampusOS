package com.isik.kampusos.kimlik.controller;

import com.isik.kampusos.kimlik.dto.IsletmePersoneliOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.service.KullaniciYonetimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * İşletme personeli (ROLE_VENDOR_STAFF) hesap oluşturma/silme.
 * food-service köprüsü tarafından çağrılır; çağıran kimlik (işletme sahibi) X-User-* başlıkları
 * veya Bearer token ile taşınır. Yetki: /api/v1/kimlik/isletme-personeli/** -> ROLE_VENDOR_ADMIN
 * (GuvenlikYapilandirmasi).
 */
@RestController
@RequestMapping("/api/v1/kimlik/isletme-personeli")
@RequiredArgsConstructor
public class IsletmePersoneliDenetleyicisi {

    private final KullaniciYonetimServisi kullaniciYonetimServisi;

    @PostMapping
    public ResponseEntity<KullaniciYonetimYaniti> olustur(@RequestBody IsletmePersoneliOlusturmaTalebi talep,
                                                          Authentication auth) {
        return ResponseEntity.ok(kullaniciYonetimServisi.isletmePersoneliOlustur(talep, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> sil(@PathVariable String id, Authentication auth) {
        kullaniciYonetimServisi.isletmePersoneliSil(id, auth.getName());
        return ResponseEntity.ok(Map.of("mesaj", "Personel hesabı silindi."));
    }
}
