package com.isik.kampusos.yolculuk.controller;

import com.isik.kampusos.yolculuk.dto.AdminIncelemeTalebi;
import com.isik.kampusos.yolculuk.model.SurucuDogrulama;
import com.isik.kampusos.yolculuk.model.YolculukSikayeti;
import com.isik.kampusos.yolculuk.service.SurucuDogrulamaServisi;
import com.isik.kampusos.yolculuk.service.YolculukAdminServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/yolculuk-yonetim")
@RequiredArgsConstructor
public class YolculukYonetimDenetleyicisi {

    private final SurucuDogrulamaServisi dogrulamaServisi;
    private final YolculukAdminServisi adminServisi;

    @GetMapping("/surucu-dogrulamalari/bekleyen")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<SurucuDogrulama>> bekleyenDogrulamalar() {
        return ResponseEntity.ok(dogrulamaServisi.bekleyenler());
    }

    @PostMapping("/surucu-dogrulamalari/{id}/incele")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SurucuDogrulama> dogrulamaIncele(Authentication auth, @PathVariable String id,
                                                           @RequestBody AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(dogrulamaServisi.incele(auth.getName(), id, talep));
    }

    @GetMapping("/sikayetler")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<YolculukSikayeti>> sikayetler() {
        return ResponseEntity.ok(adminServisi.sikayetler());
    }

    @PostMapping("/sikayetler/{id}/incele")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<YolculukSikayeti> sikayetIncele(Authentication auth, @PathVariable String id,
                                                          @RequestBody AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(adminServisi.sikayetIncele(auth.getName(), id, talep));
    }
}
