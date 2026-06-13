package com.isik.kampusos.yemek.controller;

import com.isik.kampusos.yemek.dto.PersonelOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.PersonelYaniti;
import com.isik.kampusos.yemek.service.PersonelServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * İşletme sahibi (ROLE_VENDOR_ADMIN) personel yönetimi. Personel (ROLE_VENDOR_STAFF) bu uçlara
 * erişemez; yalnızca sipariş uçlarını kullanır.
 */
@RestController
@RequestMapping("/api/v1/satici/personel")
@RequiredArgsConstructor
public class PersonelDenetleyicisi {

    private final PersonelServisi personelServisi;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<List<PersonelYaniti>> personellerim(Authentication auth) {
        return ResponseEntity.ok(personelServisi.personellerim(auth.getName()));
    }

    /** Panel için: çağıranın işletmedeki rolü (SAHIP/PERSONEL/KURYE) — butonlar buna göre çizilir. */
    @GetMapping("/benim-rol")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR_ADMIN','ROLE_VENDOR_STAFF')")
    public ResponseEntity<Map<String, String>> benimRol(Authentication auth) {
        return ResponseEntity.ok(personelServisi.benimRol(auth.getName()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<PersonelYaniti> ekle(Authentication auth, @RequestBody PersonelOlusturmaTalebi talep) {
        return ResponseEntity.ok(personelServisi.personelEkle(auth.getName(), talep));
    }

    /** Askıya al / aktifleştir: {"durum":"PASIF"} veya {"durum":"AKTIF"}. */
    @PutMapping("/{kullaniciId}/durum")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<PersonelYaniti> durumDegistir(Authentication auth, @PathVariable String kullaniciId,
                                                        @RequestBody Map<String, String> govde) {
        return ResponseEntity.ok(personelServisi.durumDegistir(auth.getName(), kullaniciId, govde.get("durum")));
    }

    @DeleteMapping("/{kullaniciId}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Map<String, String>> cikar(Authentication auth, @PathVariable String kullaniciId) {
        personelServisi.personelCikar(auth.getName(), kullaniciId);
        return ResponseEntity.ok(Map.of("mesaj", "Personel işletmeden çıkarıldı."));
    }
}
