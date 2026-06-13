package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.service.SaticiServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Sistem yöneticisinin (ROLE_ADMIN) satıcıları oluşturması ve yönetmesi. */
@RestController
@RequestMapping("/api/v1/yonetim/saticilar")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class YonetimSaticiDenetleyicisi {

    private final SaticiServisi saticiServisi;

    @GetMapping
    public ResponseEntity<List<Satici>> tumSaticilar() {
        return ResponseEntity.ok(saticiServisi.tumSaticilar());
    }

    @PostMapping
    public ResponseEntity<Satici> olustur(@RequestBody SaticiOlusturmaTalebi talep) {
        return ResponseEntity.ok(saticiServisi.adminOlustur(talep));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Satici> guncelle(@PathVariable String id,
                                           @RequestBody SaticiOlusturmaTalebi talep) {
        return ResponseEntity.ok(saticiServisi.adminGuncelle(id, talep));
    }

    /** İşletmeyi ve bağlı kayıtları siler; sahibinin id'sini döner (frontend PASIF'e alır). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> sil(@PathVariable String id, Authentication auth) {
        Satici silinen = saticiServisi.adminSil(id, auth.getName());
        return ResponseEntity.ok(Map.of("yoneticiKullaniciId",
                silinen.getYoneticiKullaniciId() != null ? silinen.getYoneticiKullaniciId() : ""));
    }

    /** İşletme yöneticisini değiştirir; eski yöneticinin id'sini döner (frontend PASIF'e alır). */
    @PutMapping("/{id}/yonetici")
    public ResponseEntity<Map<String, String>> yoneticiDegistir(@PathVariable String id,
                                                                @RequestBody Map<String, String> govde) {
        String eski = saticiServisi.yoneticiDegistir(id, govde.get("yeniYoneticiId"));
        return ResponseEntity.ok(Map.of("eskiYoneticiId", eski != null ? eski : ""));
    }
}
