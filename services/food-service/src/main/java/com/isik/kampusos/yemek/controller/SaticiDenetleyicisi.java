package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.CalismaSaatiTalebi;
import com.isik.kampusos.yemek.dto.CiroYaniti;
import com.isik.kampusos.yemek.dto.KampanyaTalebi;
import com.isik.kampusos.yemek.dto.MenuOgesiTalebi;
import com.isik.kampusos.yemek.dto.SaticiGuncellemeTalebi;
import com.isik.kampusos.yemek.dto.SaticiYaniti;
import com.isik.kampusos.yemek.model.CalismaSaati;
import com.isik.kampusos.yemek.model.Kampanya;
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
    public ResponseEntity<List<SaticiYaniti>> aktifSaticilar(
            @RequestParam(required = false) String ara,
            @RequestParam(required = false) String mutfak,
            @RequestParam(required = false) String sirala) {
        return ResponseEntity.ok(saticiServisi.aktifSaticilar(ara, mutfak, sirala));
    }

    /** Filtrelerde kullanılacak mevcut mutfak türleri (boş olmayan, benzersiz). */
    @GetMapping("/api/v1/saticilar/mutfak-turleri")
    public ResponseEntity<List<String>> mutfakTurleri() {
        return ResponseEntity.ok(saticiServisi.mevcutMutfakTurleri());
    }

    @GetMapping("/api/v1/saticilar/{saticiId}")
    public ResponseEntity<SaticiYaniti> saticiDetay(@PathVariable String saticiId) {
        return ResponseEntity.ok(saticiServisi.saticiDetay(saticiId));
    }

    @GetMapping("/api/v1/saticilar/{saticiId}/menu")
    public ResponseEntity<List<MenuOgesi>> saticiMenusu(@PathVariable String saticiId) {
        return ResponseEntity.ok(saticiServisi.saticiMenusu(saticiId));
    }

    // --- İşletme yöneticisi: satıcı profili ---

    @GetMapping("/api/v1/satici")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Satici> benimSaticim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.benimSaticim(auth.getName()));
    }

    @PutMapping("/api/v1/satici")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Satici> saticiGuncelle(Authentication auth,
                                                 @RequestBody SaticiGuncellemeTalebi talep) {
        return ResponseEntity.ok(saticiServisi.saticiGuncelle(auth.getName(), talep));
    }

    // --- İşletme genel bilgi değişikliği talebi (admin onayına gider) ---

    @PostMapping("/api/v1/satici/degisiklik-talebi")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yemek.dto.SaticiDegisiklikIstegiYaniti> talepOlustur(
            Authentication auth, @RequestBody com.isik.kampusos.yemek.dto.SaticiDegisiklikTalebi talep) {
        return ResponseEntity.ok(saticiServisi.talepOlustur(auth.getName(), talep));
    }

    @GetMapping("/api/v1/satici/degisiklik-taleplerim")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<com.isik.kampusos.yemek.dto.SaticiDegisiklikIstegiYaniti>> taleplerim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.taleplerim(auth.getName()));
    }

    // --- İşletme yöneticisi: çalışma saatleri ---

    @GetMapping("/api/v1/satici/calisma-saatleri")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<CalismaSaati>> benimCalismaSaatlerim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.benimCalismaSaatlerim(auth.getName()));
    }

    @PutMapping("/api/v1/satici/calisma-saatleri")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<CalismaSaati>> calismaSaatleriKaydet(Authentication auth,
                                                                    @RequestBody CalismaSaatiTalebi talep) {
        return ResponseEntity.ok(saticiServisi.calismaSaatleriKaydet(auth.getName(), talep));
    }

    // --- İşletme yöneticisi: kampanyalar ---

    @GetMapping("/api/v1/satici/kampanyalar")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<Kampanya>> kampanyalarim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.kampanyalarim(auth.getName()));
    }

    @PostMapping("/api/v1/satici/kampanyalar")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Kampanya> kampanyaEkle(Authentication auth, @RequestBody KampanyaTalebi talep) {
        return ResponseEntity.ok(saticiServisi.kampanyaEkle(auth.getName(), talep));
    }

    @PutMapping("/api/v1/satici/kampanyalar/{id}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Kampanya> kampanyaGuncelle(Authentication auth, @PathVariable String id,
                                                     @RequestBody KampanyaTalebi talep) {
        return ResponseEntity.ok(saticiServisi.kampanyaGuncelle(auth.getName(), id, talep));
    }

    @DeleteMapping("/api/v1/satici/kampanyalar/{id}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Map<String, String>> kampanyaSil(Authentication auth, @PathVariable String id) {
        saticiServisi.kampanyaSil(auth.getName(), id);
        return ResponseEntity.ok(Map.of("mesaj", "Kampanya silindi."));
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

    // --- İşletme yöneticisi: menü kategorileri ---

    @GetMapping("/api/v1/satici/kategoriler")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<com.isik.kampusos.yemek.model.MenuKategorisi>> kategorilerim(Authentication auth) {
        return ResponseEntity.ok(saticiServisi.benimKategorilerim(auth.getName()));
    }

    @PostMapping("/api/v1/satici/kategoriler")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yemek.model.MenuKategorisi> kategoriEkle(
            Authentication auth, @RequestBody com.isik.kampusos.yemek.dto.KategoriTalebi talep) {
        return ResponseEntity.ok(saticiServisi.kategoriEkle(auth.getName(), talep.getAd()));
    }

    @PutMapping("/api/v1/satici/kategoriler/{id}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yemek.model.MenuKategorisi> kategoriYenidenAdlandir(
            Authentication auth, @PathVariable String id, @RequestBody com.isik.kampusos.yemek.dto.KategoriTalebi talep) {
        return ResponseEntity.ok(saticiServisi.kategoriYenidenAdlandir(auth.getName(), id, talep.getAd()));
    }

    @DeleteMapping("/api/v1/satici/kategoriler/{id}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Map<String, String>> kategoriSil(Authentication auth, @PathVariable String id) {
        saticiServisi.kategoriSil(auth.getName(), id);
        return ResponseEntity.ok(Map.of("mesaj", "Kategori silindi."));
    }

    // --- İşletme yöneticisi: siparişler ---

    @GetMapping("/api/v1/satici/siparisler")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<List<Siparis>> saticiSiparisleri(Authentication auth,
                                                           @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(siparisServisi.saticiSiparisleri(auth.getName(), limit));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/kabul")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Siparis> kabul(Authentication auth, @PathVariable String id,
                                         @RequestBody(required = false) Map<String, Object> govde) {
        Integer tahminiDakika = null;
        if (govde != null && govde.get("tahminiHazirDakika") != null) {
            try {
                tahminiDakika = Integer.valueOf(govde.get("tahminiHazirDakika").toString());
            } catch (NumberFormatException ignored) { /* geçersiz değer = süre belirtilmedi */ }
        }
        return ResponseEntity.ok(siparisServisi.kabul(auth.getName(), id, tahminiDakika));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/reddet")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Siparis> reddet(Authentication auth, @PathVariable String id,
                                          @RequestBody(required = false) Map<String, String> govde) {
        String neden = govde != null ? govde.get("neden") : null;
        return ResponseEntity.ok(siparisServisi.reddet(auth.getName(), id, neden));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/hazirla")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Siparis> hazirla(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.hazirla(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/hazir")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Siparis> hazir(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.hazir(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/yolda")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Siparis> yolda(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(siparisServisi.yolda(auth.getName(), id));
    }

    @PostMapping("/api/v1/satici/siparisler/{id}/teslim")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
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
