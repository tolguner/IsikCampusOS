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

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<PersonelYaniti> ekle(Authentication auth, @RequestBody PersonelOlusturmaTalebi talep) {
        return ResponseEntity.ok(personelServisi.personelEkle(auth.getName(), talep));
    }

    @DeleteMapping("/{kullaniciId}")
    @PreAuthorize("hasAuthority('ROLE_VENDOR_ADMIN')")
    public ResponseEntity<Map<String, String>> cikar(Authentication auth, @PathVariable String kullaniciId) {
        personelServisi.personelCikar(auth.getName(), kullaniciId);
        return ResponseEntity.ok(Map.of("mesaj", "Personel işletmeden çıkarıldı."));
    }
}
