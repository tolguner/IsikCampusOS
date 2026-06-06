package com.isik.kampusos.bildirim.controller;

import com.isik.kampusos.bildirim.dto.BildirimYaniti;
import com.isik.kampusos.bildirim.service.BildirimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
