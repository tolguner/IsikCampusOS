package com.isik.kampusos.tesis.controller;

import com.isik.kampusos.tesis.dto.*;
import com.isik.kampusos.tesis.service.TesisRezervasyonServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tesisler/rezervasyonlar")
@RequiredArgsConstructor
public class TesisRezervasyonDenetleyicisi {

    private final TesisRezervasyonServisi rezervasyonServisi;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<TesisRezervasyonYaniti> createBooking(Authentication auth,
                                                                 @RequestBody TesisRezervasyonTalebi talep) {
        return ResponseEntity.ok(rezervasyonServisi.createBooking(auth.getName(), talep));
    }

    @GetMapping("/benim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<TesisRezervasyonYaniti>> listMyBookings(Authentication auth) {
        return ResponseEntity.ok(rezervasyonServisi.listMyBookings(auth.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<TesisRezervasyonYaniti>> listAllBookings() {
        return ResponseEntity.ok(rezervasyonServisi.listAllBookings());
    }

    @PostMapping("/{rezervasyonId}/iptal")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisRezervasyonYaniti> cancelBooking(Authentication auth,
                                                                 @PathVariable String rezervasyonId,
                                                                 @RequestParam(required = false) String neden) {
        String roller = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return ResponseEntity.ok(rezervasyonServisi.cancelBooking(auth.getName(), roller, rezervasyonId, neden));
    }

    @PostMapping("/{rezervasyonId}/yoklama")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<RezervasyonYoklamaYaniti> checkin(Authentication auth,
                                                           @PathVariable String rezervasyonId,
                                                           @RequestBody RezervasyonYoklamaTalebi talep) {
        String roller = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return ResponseEntity.ok(rezervasyonServisi.checkin(auth.getName(), roller, rezervasyonId, talep));
    }

    @PatchMapping("/{rezervasyonId}/durum")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisRezervasyonYaniti> updateBookingStatus(Authentication auth,
                                                                       @PathVariable String rezervasyonId,
                                                                       @RequestParam String durum) {
        return ResponseEntity.ok(rezervasyonServisi.updateBookingStatus(auth.getName(), rezervasyonId, durum));
    }

    @PostMapping("/bloke")
    @PreAuthorize("hasAnyAuthority('ROLE_FACILITY_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TesisRezervasyonYaniti> createBlockedSlot(Authentication auth,
                                                                     @RequestBody TesisRezervasyonTalebi talep) {
        return ResponseEntity.ok(rezervasyonServisi.createBlockedSlot(auth.getName(), talep));
    }

    @GetMapping("/takvim")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TesisRezervasyonYaniti>> listCalendarBookings(
            @RequestParam String kaynakId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime baslangic,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime bitis) {
        return ResponseEntity.ok(rezervasyonServisi.listCalendarBookings(kaynakId, baslangic, bitis));
    }
}
