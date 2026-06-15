package com.isik.kampusos.yolculuk.controller;

import com.isik.kampusos.yolculuk.dto.AdminIncelemeTalebi;
import com.isik.kampusos.yolculuk.model.SurucuDogrulama;
import com.isik.kampusos.yolculuk.model.YolculukSikayeti;
import com.isik.kampusos.yolculuk.service.SurucuDogrulamaServisi;
import com.isik.kampusos.yolculuk.service.YolculukAdminServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/yolculuk-yonetim")
@RequiredArgsConstructor
public class YolculukYonetimDenetleyicisi {

    private final SurucuDogrulamaServisi dogrulamaServisi;
    private final YolculukAdminServisi adminServisi;
    private final com.isik.kampusos.yolculuk.service.PopulerNoktaServisi populerNoktaServisi;
    private final com.isik.kampusos.yolculuk.service.AracServisi aracServisi;
    private final com.isik.kampusos.yolculuk.service.KullaniciOzetIstemcisi kullaniciOzetIstemcisi;

    // --- Araç onayları (admin) ---

    @GetMapping("/araclar/bekleyen")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<com.isik.kampusos.yolculuk.model.Arac>> bekleyenAraclar() {
        var liste = aracServisi.bekleyenler();
        var ozetler = kullaniciOzetIstemcisi.ozetler(liste.stream().map(com.isik.kampusos.yolculuk.model.Arac::getKullaniciId).toList());
        liste.forEach(a -> {
            var o = ozetler.get(a.getKullaniciId());
            if (o != null) {
                a.setBasvuranAdSoyad(o.adSoyad());
                a.setBasvuranOgrenciNo(o.ogrenciNumarasi());
                a.setBasvuranTelefon(o.telefon());
                a.setBasvuranEposta(o.eposta());
            }
        });
        return ResponseEntity.ok(liste);
    }

    @PostMapping("/araclar/{id}/incele")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yolculuk.model.Arac> aracIncele(
            Authentication auth, @PathVariable String id, @RequestBody AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(aracServisi.incele(auth.getName(), id, talep));
    }

    // --- Popüler nokta yönetimi (admin) ---

    @GetMapping("/populer-noktalar")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<com.isik.kampusos.yolculuk.model.PopulerNokta>> populerListe() {
        return ResponseEntity.ok(populerNoktaServisi.populerler());
    }

    @PostMapping("/populer-noktalar")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yolculuk.model.PopulerNokta> populerEkle(@RequestBody java.util.Map<String, Object> g) {
        return ResponseEntity.ok(populerNoktaServisi.ekle(
                (String) g.get("ad"), ((Number) g.get("enlem")).doubleValue(), ((Number) g.get("boylam")).doubleValue()));
    }

    @PutMapping("/populer-noktalar/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<com.isik.kampusos.yolculuk.model.PopulerNokta> populerGuncelle(
            @PathVariable String id, @RequestBody java.util.Map<String, Object> g) {
        return ResponseEntity.ok(populerNoktaServisi.guncelle(id,
                (String) g.get("ad"),
                g.get("enlem") != null ? ((Number) g.get("enlem")).doubleValue() : null,
                g.get("boylam") != null ? ((Number) g.get("boylam")).doubleValue() : null,
                g.get("aktif") != null ? (Boolean) g.get("aktif") : null));
    }

    @DeleteMapping("/populer-noktalar/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> populerSil(@PathVariable String id) {
        populerNoktaServisi.sil(id);
        return ResponseEntity.ok(java.util.Map.of("mesaj", "Nokta silindi."));
    }

    @GetMapping("/surucu-dogrulamalari/bekleyen")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<SurucuDogrulama>> bekleyenDogrulamalar() {
        var liste = dogrulamaServisi.bekleyenler();
        var ozetler = kullaniciOzetIstemcisi.ozetler(liste.stream().map(SurucuDogrulama::getKullaniciId).toList());
        liste.forEach(d -> {
            var o = ozetler.get(d.getKullaniciId());
            if (o != null) {
                d.setBasvuranAdSoyad(o.adSoyad());
                d.setBasvuranOgrenciNo(o.ogrenciNumarasi());
                d.setBasvuranTelefon(o.telefon());
                d.setBasvuranEposta(o.eposta());
            }
        });
        return ResponseEntity.ok(liste);
    }

    @PostMapping("/surucu-dogrulamalari/{id}/incele")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SurucuDogrulama> dogrulamaIncele(Authentication auth, @PathVariable String id,
                                                           @RequestBody AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(dogrulamaServisi.incele(auth.getName(), id, talep));
    }

    @GetMapping("/sikayetler")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<YolculukSikayeti>> sikayetler() {
        var liste = adminServisi.sikayetler();
        var idler = new java.util.ArrayList<String>();
        liste.forEach(s -> { idler.add(s.getSikayetciKullaniciId()); idler.add(s.getHedefKullaniciId()); });
        var ozetler = kullaniciOzetIstemcisi.ozetler(idler);
        liste.forEach(s -> {
            var sk = ozetler.get(s.getSikayetciKullaniciId());
            var hd = ozetler.get(s.getHedefKullaniciId());
            if (sk != null) { s.setSikayetciAdSoyad(sk.adSoyad()); s.setSikayetciOgrenciNo(sk.ogrenciNumarasi()); }
            if (hd != null) { s.setHedefAdSoyad(hd.adSoyad()); }
        });
        return ResponseEntity.ok(liste);
    }

    @PostMapping("/sikayetler/{id}/incele")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<YolculukSikayeti> sikayetIncele(Authentication auth, @PathVariable String id,
                                                          @RequestBody AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(adminServisi.sikayetIncele(auth.getName(), id, talep));
    }

    @GetMapping("/loglar")
    @PreAuthorize("hasAnyAuthority('ROLE_RIDE_ADMIN', 'ROLE_BUILDING_SUPPORT_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<com.isik.kampusos.yolculuk.model.YolculukSistemLogu>> loglariGetir() {
        var liste = adminServisi.loglariGetir();
        var ozetler = kullaniciOzetIstemcisi.ozetler(liste.stream().map(com.isik.kampusos.yolculuk.model.YolculukSistemLogu::getIslemYapanId).toList());
        liste.forEach(log -> {
            var o = ozetler.get(log.getIslemYapanId());
            if (o != null) {
                log.setIslemYapanAdSoyad(o.adSoyad());
            }
        });
        return ResponseEntity.ok(liste);
    }
}
