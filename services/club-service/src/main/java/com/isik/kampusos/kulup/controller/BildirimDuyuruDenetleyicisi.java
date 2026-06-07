package com.isik.kampusos.kulup.controller;

import com.isik.kampusos.kulup.bildirim.BildirimYayinlayici;
import com.isik.kampusos.kulup.dto.DuyuruTalebi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * SKS toplu duyuru ucu. Bildirim kalıcılaştırma notification-service'tedir; bu uç yalnızca
 * hedef kitleyi (kulüp başkanları fan-out dahil) çözüp {@code bildirim.olustur} olayı yayınlar.
 * Okuma/işaretleme uçları (GET, PATCH) notification-service'e taşınmıştır.
 */
@RestController
@RequestMapping("/api/v1/bildirimler")
@RequiredArgsConstructor
public class BildirimDuyuruDenetleyicisi {

    private final BildirimYayinlayici bildirimYayinlayici;

    @PostMapping("/duyurular")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> createAnnouncement(Authentication auth,
                                                   @RequestBody DuyuruTalebi talep) {
        bildirimYayinlayici.duyuruYayinla(auth.getName(), talep);
        return ResponseEntity.accepted().build();
    }
}
