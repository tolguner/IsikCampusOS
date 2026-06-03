package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.DenetimGunluguYaniti;
import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import com.isik.kampusos.etkinlik.service.DenetimGunluguServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class DenetimGunluguDenetleyicisi {

    private final DenetimGunluguServisi denetimGunluguServisi;
    private final EtkinlikDeposu etkinlikDeposu;

    @GetMapping("/api/v1/etkinlikler/{etkinlikId}/denetim-gunlukleri")
    public ResponseEntity<List<DenetimGunluguYaniti>> etkinlikGunlukleriniGetir(Authentication auth,
                                                                @PathVariable String etkinlikId,
                                                                @RequestParam(required = false) String islem,
                                                                @RequestParam(required = false) String yapanId,
                                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baslangic,
                                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bitis,
                                                                @RequestParam(required = false) String arama) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));
        boolean kulupYoneticisiMi = etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(auth.getName().trim());
        boolean sistemYoneticisiMi = auth.getAuthorities().toString().contains("ROLE_SKS_ADMIN")
                || auth.getAuthorities().toString().contains("ROLE_ADMIN");
        if (!kulupYoneticisiMi && !sistemYoneticisiMi) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi veya SKS yöneticisi denetim günlüklerini görüntüleyebilir");
        }
        return ResponseEntity.ok(denetimGunluguServisi.listele(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, islem, yapanId, baslangic, bitis, arama));
    }

    @GetMapping("/api/v1/kulupler/{kulupId}/denetim-gunlukleri")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<DenetimGunluguYaniti>> kulupGunlukleriniGetir(@PathVariable String kulupId,
                                                              @RequestParam(required = false) String islem,
                                                              @RequestParam(required = false) String yapanId,
                                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baslangic,
                                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bitis,
                                                              @RequestParam(required = false) String arama) {
        return ResponseEntity.ok(denetimGunluguServisi.listele(DenetimGunlugu.VarlikTuru.KULUP, kulupId, islem, yapanId, baslangic, bitis, arama));
    }
}
