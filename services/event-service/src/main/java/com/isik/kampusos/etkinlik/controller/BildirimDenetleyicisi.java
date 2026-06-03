package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.DuyuruTalebi;
import com.isik.kampusos.etkinlik.dto.BildirimYaniti;
import com.isik.kampusos.etkinlik.service.BildirimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bildirimler")
@RequiredArgsConstructor
public class BildirimDenetleyicisi {

    private final BildirimServisi bildirimServisi;

    @GetMapping
    public ResponseEntity<List<BildirimYaniti>> getNotifications(Authentication auth) {
        return ResponseEntity.ok(bildirimServisi.gorunurBildirimleriListele(
                auth.getName(),
                auth.getAuthorities().toString()
        ));
    }

    @PostMapping("/duyurular")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<BildirimYaniti> createAnnouncement(Authentication auth,
                                                             @RequestBody DuyuruTalebi talep) {
        return ResponseEntity.ok(bildirimServisi.duyuruOlustur(auth.getName(), talep));
    }

    @PatchMapping("/{bildirimId}/oku")
    public ResponseEntity<BildirimYaniti> markAsRead(Authentication auth,
                                                     @PathVariable String bildirimId) {
        return ResponseEntity.ok(bildirimServisi.okunduOlarakIsaretle(
                auth.getName(),
                auth.getAuthorities().toString(),
                bildirimId
        ));
    }
}
