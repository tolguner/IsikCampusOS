package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.KulupSaglikIslemTalebi;
import com.isik.kampusos.etkinlik.dto.KulupSaglikYaniti;
import com.isik.kampusos.etkinlik.service.KulupSaglikServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/yonetim/kulupler")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
public class YonetimKulupSaglikDenetleyicisi {

    private final KulupSaglikServisi kulupSaglikServisi;

    @GetMapping("/saglik")
    public ResponseEntity<List<KulupSaglikYaniti>> kulupSagliklariniListele() {
        return ResponseEntity.ok(kulupSaglikServisi.saglikListele());
    }

    @PostMapping("/{kulupId}/saglik-notlari")
    public ResponseEntity<KulupSaglikYaniti> saglikNotuEkle(Authentication auth,
                                                            @PathVariable String kulupId,
                                                            @RequestBody KulupSaglikIslemTalebi talep) {
        return ResponseEntity.ok(kulupSaglikServisi.notEkle(kulupId, auth.getName(), talep));
    }

    @PostMapping("/{kulupId}/takip-listesi")
    public ResponseEntity<KulupSaglikYaniti> takipListesineAl(Authentication auth,
                                                         @PathVariable String kulupId,
                                                         @RequestBody(required = false) KulupSaglikIslemTalebi talep) {
        return ResponseEntity.ok(kulupSaglikServisi.gozlemListesineAl(kulupId, auth.getName(), talep));
    }

    @PostMapping("/{kulupId}/aksiyon-talebi")
    public ResponseEntity<KulupSaglikYaniti> aksiyonTalepEt(Authentication auth,
                                                             @PathVariable String kulupId,
                                                             @RequestBody KulupSaglikIslemTalebi talep) {
        return ResponseEntity.ok(kulupSaglikServisi.aksiyonTalepEt(kulupId, auth.getName(), talep));
    }
}
