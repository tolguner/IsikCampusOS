package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.AkademikKadroDanismanYaniti;
import com.isik.kampusos.etkinlik.dto.AkademikKadroSenkronizasyonYaniti;
import com.isik.kampusos.etkinlik.service.AkademikKadroServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/akademik-kadro")
@RequiredArgsConstructor
public class AkademikKadroDenetleyicisi {
    private final AkademikKadroServisi akademikKadroServisi;

    @GetMapping("/danismanlar")
    public ResponseEntity<List<AkademikKadroDanismanYaniti>> danismanlariAra(
            @RequestParam(required = false, defaultValue = "") String sorgu,
            @RequestParam(required = false, defaultValue = "12") int limit) {
        return ResponseEntity.ok(akademikKadroServisi.danismanlariAra(sorgu, limit));
    }

    @PostMapping("/senkronizasyon")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<AkademikKadroSenkronizasyonYaniti> akademikKadroyuSenkronizeEt() {
        return ResponseEntity.ok(akademikKadroServisi.resmiSitedenGuncelle());
    }
}
