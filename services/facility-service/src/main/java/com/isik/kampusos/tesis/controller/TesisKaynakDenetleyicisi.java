package com.isik.kampusos.tesis.controller;

import com.isik.kampusos.tesis.dto.KullanilabilirlikKuraliTalebi;
import com.isik.kampusos.tesis.dto.TesisKaynakTalebi;
import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import com.isik.kampusos.tesis.service.TesisServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tesis-kaynaklari")
@RequiredArgsConstructor
public class TesisKaynakDenetleyicisi {

    private final TesisServisi tesisServisi;

    @PatchMapping("/{resourceId}")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisKaynagi> updateResource(Authentication auth,
                                                         @PathVariable String resourceId,
                                                         @RequestBody TesisKaynakTalebi talep) {
        return ResponseEntity.ok(tesisServisi.updateResource(auth.getName(), resourceId, talep));
    }

    @PutMapping("/{resourceId}/kullanilabilirlik-kurallari")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<TesisKullanilabilirlikKurali>> replaceAvailabilityRules(Authentication auth,
                                                                                           @PathVariable String resourceId,
                                                                                           @RequestBody List<KullanilabilirlikKuraliTalebi> talep) {
        return ResponseEntity.ok(tesisServisi.replaceAvailabilityRules(auth.getName(), resourceId, talep));
    }
}
