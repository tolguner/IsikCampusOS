package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.service.FavoriServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Öğrencinin favori satıcılarını yönetmesi. */
@RestController
@RequestMapping("/api/v1/favoriler")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_STUDENT')")
public class FavoriDenetleyicisi {

    private final FavoriServisi favoriServisi;

    @GetMapping
    public ResponseEntity<List<String>> favorilerim(Authentication auth) {
        return ResponseEntity.ok(favoriServisi.favoriSaticiIdleri(auth.getName()));
    }

    @PostMapping("/{saticiId}")
    public ResponseEntity<Map<String, String>> favoriEkle(Authentication auth, @PathVariable String saticiId) {
        favoriServisi.favoriEkle(auth.getName(), saticiId);
        return ResponseEntity.ok(Map.of("mesaj", "Favorilere eklendi."));
    }

    @DeleteMapping("/{saticiId}")
    public ResponseEntity<Map<String, String>> favoriCikar(Authentication auth, @PathVariable String saticiId) {
        favoriServisi.favoriCikar(auth.getName(), saticiId);
        return ResponseEntity.ok(Map.of("mesaj", "Favorilerden çıkarıldı."));
    }
}
