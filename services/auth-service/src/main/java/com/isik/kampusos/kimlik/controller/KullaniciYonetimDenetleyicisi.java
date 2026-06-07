package com.isik.kampusos.kimlik.controller;

import com.isik.kampusos.kimlik.dto.KullaniciDenetimYaniti;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimGuncellemeTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.service.KullaniciYonetimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Sistem yöneticisi (ROLE_ADMIN) personel kullanıcı/rol yönetimi + kullanıcı denetim logları.
 * Yetki: /api/v1/yonetim/** -> ROLE_ADMIN (GuvenlikYapilandirmasi).
 */
@RestController
@RequestMapping("/api/v1/yonetim")
@RequiredArgsConstructor
public class KullaniciYonetimDenetleyicisi {

    private final KullaniciYonetimServisi kullaniciYonetimServisi;

    @GetMapping("/kullanicilar")
    public ResponseEntity<Page<KullaniciYonetimYaniti>> listele(
            @RequestParam(defaultValue = "0") int sayfa,
            @RequestParam(defaultValue = "20") int boyut,
            @RequestParam(required = false) String arama,
            @RequestParam(required = false) String durum,
            @RequestParam(required = false) String rol) {
        return ResponseEntity.ok(kullaniciYonetimServisi.listele(sayfa, boyut, arama, durum, rol));
    }

    @GetMapping("/kullanicilar/{id}")
    public ResponseEntity<KullaniciYonetimYaniti> getir(@PathVariable String id) {
        return ResponseEntity.ok(kullaniciYonetimServisi.getir(id));
    }

    @PostMapping("/kullanicilar")
    public ResponseEntity<KullaniciYonetimYaniti> olustur(@RequestBody KullaniciYonetimOlusturmaTalebi talep,
                                                          Authentication auth) {
        return ResponseEntity.ok(kullaniciYonetimServisi.olustur(talep, auth.getName()));
    }

    @PutMapping("/kullanicilar/{id}")
    public ResponseEntity<KullaniciYonetimYaniti> guncelle(@PathVariable String id,
                                                           @RequestBody KullaniciYonetimGuncellemeTalebi talep,
                                                           Authentication auth) {
        return ResponseEntity.ok(kullaniciYonetimServisi.guncelle(id, talep, auth.getName()));
    }

    @PostMapping("/kullanicilar/{id}/sifre-sifirla")
    public ResponseEntity<Map<String, String>> sifreSifirla(@PathVariable String id,
                                                            @RequestBody(required = false) Map<String, String> govde,
                                                            Authentication auth) {
        String tc = govde != null ? govde.get("tcKimlikNo") : null;
        if (tc == null || tc.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TC Kimlik No gereklidir.");
        }
        return ResponseEntity.ok(kullaniciYonetimServisi.sifreSifirla(id, tc, auth.getName()));
    }

    @DeleteMapping("/kullanicilar/{id}")
    public ResponseEntity<Map<String, String>> sil(@PathVariable String id, Authentication auth) {
        kullaniciYonetimServisi.sil(id, auth.getName());
        return ResponseEntity.ok(Map.of("mesaj", "Kullanıcı silindi."));
    }

    /** Kullanıcı işlemleri denetim logları (en yeni 500). */
    @GetMapping("/denetim-gunlukleri")
    public ResponseEntity<List<KullaniciDenetimYaniti>> denetimGunlukleri() {
        return ResponseEntity.ok(kullaniciYonetimServisi.denetimGunlukleriniGetir());
    }
}
