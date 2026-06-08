package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.CiroYaniti;
import com.isik.kampusos.yemek.dto.MenuOgesiTalebi;
import com.isik.kampusos.yemek.dto.SaticiGuncellemeTalebi;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.service.SaticiServisi;
import com.isik.kampusos.yemek.service.SiparisServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Herkese açık satıcı listeleme + işletme yöneticisinin (ROLE_VENDOR_ADMIN)
 * kendi satıcısını, menüsünü ve siparişlerini yönetmesi.
 */
@RestController
@RequiredArgsConstructor
public class SaticiDenetleyicisi {

    private final SaticiServisi saticiServisi;
    private final SiparisServisi siparisServisi;

    // --- Herkese açık (giriş yapmış her kullanıcı) ---

    @GetMapping("/api/v1/saticilar")
    public ResponseEntity<List<Satici>> aktifSaticilar() {
        return ResponseEntity.ok(saticiServisi.aktifSaticilar());
    }

    @GetMapping("/api/v1/saticilar/{saticiId}/menu")
    public ResponseEntity<List<MenuOgesi>> saticiMenusu(@PathVariable String saticiId) {
        return ResponseEntity.ok(saticiServisi.saticiMenusu(saticiId));
    }

    // --- İşletme yöneticisi: satıcı profili ---

    @GetMapping("/api/v1/satici")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Satici> benimSaticim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.benimSaticim(auth.getName()));
    }

    @PutMapping("/api/v1/satici")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Satici> saticiGuncelle(Authentication auth,
                                                 @RequestBody SaticiGuncellemeTalebi talep) {
        return ResponseEntity.ok(saticiServisi.saticiGuncelle(auth.getName(), talep));
    }

    // --- İşletme yöneticisi: menü yönetimi ---

    @GetMapping("/api/v1/satici/menu")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<MenuOgesi>> benimMenum(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.benimMenum(auth.getName()));
    }

    @PostMapping("/api/v1/satici/menu")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<MenuOgesi> menuEkle(Authentication auth,
                                              @RequestBody MenuOgesiTalebi talep) {
        return ResponseEntity.ok(saticiServisi.menuEkle(auth.getName(), talep));
    }

    @PutMapping("/api/v1/satici/menu/{ogeId}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<MenuOgesi> menuGuncelle(Authentication auth,
                                                  @PathVariable String ogeId,
                                                  @RequestBody MenuOgesiTalebi talep) {
        return ResponseEntity.ok(saticiServisi.menuGuncelle(auth.getName(), ogeId, talep));
    }

    @DeleteMapping("/api/v1/satici/menu/{ogeId}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Map<String, String>> menuSil(Authentication auth, @PathVariable String ogeId) {
        saticiServisi.menuSil(auth.getName(), ogeId);
        return ResponseEntity.ok(Map.of("mesaj", "Ürün menüden kaldırıldı."));
    }

    // --- İşletme yöneticisi: siparişler ---

    @GetMapping("/api/v1/satici/siparisler")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<Siparis>> saticiSiparisleri(Authentication auth) {
        return ResponseEntity.ok(siparisServisi.saticiSiparisleri(auth.getName()));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/kabul")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> kabul(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.kabul(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/reddet")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> reddet(Authentication auth, @PathVariable String id,
                                          @RequestBody(required = false) Map<String, String> govde) {
        String neden = govde != null ? govde.get("neden") : null;
        return ResponseEntity.ok(siparisServisi.reddet(auth.getName(), id, neden));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/hazirla")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> hazirla(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.hazirla(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/hazir")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> hazir(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.hazir(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/yolda")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> yolda(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.yolda(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/teslim")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Siparis> teslim(Authentication auth, @PathVariable String id,
                                          @RequestBody Map<String, String> govde) {
        return ResponseEntity.ok(siparisServisi.teslim(auth.getName(), id, govde.get("tahsilEdilenOdeme")));
    }

    // --- İşletme yöneticisi: ciro raporu ---

    @GetMapping("/api/v1/satici/ciro")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<CiroYaniti> ciro(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baslangic,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bitis) {
        return ResponseEntity.ok(siparisServisi.ciro(auth.getName(), baslangic, bitis));
    }
}
