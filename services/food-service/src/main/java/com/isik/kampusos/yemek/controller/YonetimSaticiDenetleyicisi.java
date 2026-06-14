package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.service.SaticiServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Destek Hizmetleri Müdürlüğü'nün (ROLE_SUPPORT_SERVICES_ADMIN) işletmeleri oluşturup yönetmesi. */
@RestController
@RequestMapping("/api/v1/yonetim/saticilar")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_SUPPORT_SERVICES_ADMIN')")
public class YonetimSaticiDenetleyicisi {

    private final SaticiServisi saticiServisi;
    private final com.isik.kampusos.yemek.service.DenetimServisi denetimServisi;
    private final com.isik.kampusos.yemek.repository.IsletmePersonelDeposu personelDeposu;

    @GetMapping
    public ResponseEntity<List<Satici>> tumSaticilar() {
        return ResponseEntity.ok(saticiServisi.tumSaticilar());
    }

    @PostMapping
    public ResponseEntity<Satici> olustur(@RequestBody SaticiOlusturmaTalebi talep, Authentication auth) {
        return ResponseEntity.ok(saticiServisi.adminOlustur(talep, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Satici> guncelle(@PathVariable String id,
                                           @RequestBody SaticiOlusturmaTalebi talep) {
        return ResponseEntity.ok(saticiServisi.adminGuncelle(id, talep));
    }

    /** İşletmeyi ve bağlı kayıtları siler; sahibinin id'sini döner (frontend PASIF'e alır). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> sil(@PathVariable String id, Authentication auth) {
        Satici silinen = saticiServisi.adminSil(id, auth.getName());
        return ResponseEntity.ok(Map.of("yoneticiKullaniciId",
                silinen.getYoneticiKullaniciId() != null ? silinen.getYoneticiKullaniciId() : ""));
    }

    /** İşletme yöneticisini değiştirir; eski yöneticinin id'sini döner (frontend PASIF'e alır). */
    @PutMapping("/{id}/yonetici")
    public ResponseEntity<Map<String, String>> yoneticiDegistir(@PathVariable String id,
                                                                @RequestBody Map<String, String> govde,
                                                                Authentication auth) {
        String eski = saticiServisi.yoneticiDegistir(id, govde.get("yeniYoneticiId"), auth.getName());
        return ResponseEntity.ok(Map.of("eskiYoneticiId", eski != null ? eski : ""));
    }

    /** Tüm food denetim kayıtları (işletme/personel/sipariş/talep) — admin görüntüler. */
    @GetMapping("/denetim")
    public ResponseEntity<List<com.isik.kampusos.yemek.model.DenetimGunlugu>> denetim() {
        return ResponseEntity.ok(denetimServisi.sonKayitlar());
    }

    /** Bir işletmenin personel kayıtları (işletme > yönetici > personel hiyerarşisi için). */
    @GetMapping("/{id}/personel")
    public ResponseEntity<List<com.isik.kampusos.yemek.model.IsletmePersoneli>> personeller(@PathVariable String id) {
        return ResponseEntity.ok(personelDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(id));
    }

    // --- İşletme genel bilgi değişikliği talepleri (admin inceleme) ---

    @GetMapping("/talepler")
    public ResponseEntity<List<com.isik.kampusos.yemek.dto.SaticiDegisiklikIstegiYaniti>> bekleyenTalepler() {
        return ResponseEntity.ok(saticiServisi.bekleyenTalepler());
    }

    @PostMapping("/talepler/{id}/onayla")
    public ResponseEntity<Map<String, String>> talepOnayla(@PathVariable String id, Authentication auth) {
        saticiServisi.talepOnayla(id, auth.getName());
        return ResponseEntity.ok(Map.of("mesaj", "Değişiklik onaylandı ve uygulandı."));
    }

    @PostMapping("/talepler/{id}/revize")
    public ResponseEntity<Map<String, String>> talepRevize(@PathVariable String id, Authentication auth,
                                                           @RequestBody(required = false) Map<String, String> govde) {
        saticiServisi.talepRevize(id, auth.getName(), govde != null ? govde.get("geriBildirim") : null);
        return ResponseEntity.ok(Map.of("mesaj", "Revize talep edildi."));
    }
}
