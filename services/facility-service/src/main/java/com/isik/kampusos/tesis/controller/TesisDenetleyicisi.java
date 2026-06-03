package com.isik.kampusos.tesis.controller;

import com.isik.kampusos.tesis.dto.*;
import com.isik.kampusos.tesis.model.Tesis;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import com.isik.kampusos.tesis.model.TesisPolitikasi;
import com.isik.kampusos.tesis.service.TesisServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tesisler")
@RequiredArgsConstructor
public class TesisDenetleyicisi {

    private final TesisServisi tesisServisi;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TesisYaniti>> listFacilities() {
        return ResponseEntity.ok(tesisServisi.listFacilities());
    }

    @GetMapping("/{tesisId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TesisYaniti> getFacility(@PathVariable String tesisId) {
        return ResponseEntity.ok(tesisServisi.getFacility(tesisId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Tesis> createFacility(Authentication auth,
                                                 @RequestBody TesisTalebi talep) {
        return ResponseEntity.ok(tesisServisi.createFacility(auth.getName(), talep));
    }

    @PatchMapping("/{tesisId}")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Tesis> updateFacility(Authentication auth,
                                                 @PathVariable String tesisId,
                                                 @RequestBody TesisTalebi talep) {
        return ResponseEntity.ok(tesisServisi.updateFacility(auth.getName(), tesisId, talep));
    }

    @PostMapping("/{tesisId}/kaynaklar")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisKaynagi> createResource(Authentication auth,
                                                         @PathVariable String tesisId,
                                                         @RequestBody TesisKaynakTalebi talep) {
        return ResponseEntity.ok(tesisServisi.createResource(auth.getName(), tesisId, talep));
    }

    @PutMapping("/{tesisId}/politika")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisPolitikasi> upsertPolicy(Authentication auth,
                                                             @PathVariable String tesisId,
                                                             @RequestBody TesisPolitikasiTalebi talep) {
        return ResponseEntity.ok(tesisServisi.upsertPolicy(auth.getName(), tesisId, talep));
    }

    @DeleteMapping("/{tesisId}")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteFacility(Authentication auth,
                                               @PathVariable String tesisId) {
        tesisServisi.deleteFacility(auth.getName(), tesisId);
        return ResponseEntity.noContent().build();
    }
}
