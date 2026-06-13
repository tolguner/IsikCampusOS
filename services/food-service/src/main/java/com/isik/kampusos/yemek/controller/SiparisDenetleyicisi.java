package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.SiparisOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.SiparisOnizlemeYaniti;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.service.SiparisServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Öğrencinin sipariş vermesi, kendi siparişlerini görmesi ve iptal etmesi. */
@RestController
@RequestMapping("/api/v1/siparisler")
@RequiredArgsConstructor
public class SiparisDenetleyicisi {

    private final SiparisServisi siparisServisi;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Siparis> siparisVer(Authentication auth,
                                              @RequestBody SiparisOlusturmaTalebi talep) {
        return ResponseEntity.ok(siparisServisi.siparisVer(auth.getName(), talep));
    }

    /** Sipariş öncesi gerçek tutar dökümü (kampanya indirimi dahil) — kayıt oluşturmaz. */
    @PostMapping("/onizleme")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<SiparisOnizlemeYaniti> onizleme(@RequestBody SiparisOlusturmaTalebi talep) {
        return ResponseEntity.ok(siparisServisi.onizleme(talep));
    }

    @GetMapping("/benim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<Siparis>> benimSiparislerim(Authentication auth,
                                                           @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(siparisServisi.benimSiparislerim(auth.getName(), limit));
    }

    @PostMapping("/{id}/iptal")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Siparis> iptal(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.musteriIptal(auth.getName(), id));
    }
}
