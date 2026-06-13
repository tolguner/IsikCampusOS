package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.service.SaticiServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
