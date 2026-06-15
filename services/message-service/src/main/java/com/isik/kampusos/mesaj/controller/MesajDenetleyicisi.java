package com.isik.kampusos.mesaj.controller;

import com.isik.kampusos.mesaj.dto.KonusmaTalepleri.MesajGonderTalebi;
import com.isik.kampusos.mesaj.model.Konusma;
import com.isik.kampusos.mesaj.model.Mesaj;
import com.isik.kampusos.mesaj.messaging.MesajAkisYoneticisi;
import com.isik.kampusos.mesaj.service.MesajServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mesajlar")
@RequiredArgsConstructor
public class MesajDenetleyicisi {

    private final MesajServisi mesajServisi;
    private final MesajAkisYoneticisi akisYoneticisi;

    @GetMapping("/konusmalar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Konusma>> konusmalarim(Authentication auth) {
        return ResponseEntity.ok(mesajServisi.konusmalarim(auth.getName()));
    }

    @GetMapping("/konusmalar/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Mesaj>> mesajlar(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(mesajServisi.mesajlar(auth.getName(), id));
    }

    @PostMapping("/konusmalar/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Mesaj> gonder(Authentication auth, @PathVariable String id, @RequestBody MesajGonderTalebi talep) {
        return ResponseEntity.ok(mesajServisi.mesajGonder(auth.getName(), id, talep.icerik()));
    }

    @PostMapping("/konusmalar/{id}/okundu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> okundu(Authentication auth, @PathVariable String id) {
        mesajServisi.okunduIsaretle(auth.getName(), id);
        return ResponseEntity.ok(Map.of("mesaj", "Okundu olarak işaretlendi."));
    }

    @GetMapping("/baglam/{modul}/{baglamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Konusma> baglamdan(Authentication auth, @PathVariable String modul, @PathVariable String baglamId) {
        return ResponseEntity.ok(mesajServisi.konusmaBaglamdan(auth.getName(), modul, baglamId));
    }

    @GetMapping("/okunmamis-sayisi")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> okunmamis(Authentication auth) {
        return ResponseEntity.ok(Map.of("sayi", mesajServisi.okunmamisToplam(auth.getName())));
    }

    @GetMapping(value = "/akis", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter akis(Authentication auth) {
        return akisYoneticisi.abone(auth.getName());
    }
}
