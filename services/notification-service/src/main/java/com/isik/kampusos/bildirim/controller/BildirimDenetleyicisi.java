package com.isik.kampusos.bildirim.controller;

import com.isik.kampusos.bildirim.dto.BildirimYaniti;
import com.isik.kampusos.bildirim.dto.OgrenciDuyuruTalebi;
import com.isik.kampusos.bildirim.service.BildirimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bildirimler")
@RequiredArgsConstructor
public class BildirimDenetleyicisi {

    private final BildirimServisi bildirimServisi;

    /** İdari rollerin (öğrenci hariç) tüm öğrencilere kurumsal duyuru göndermesi. */
    @PostMapping("/toplu-duyuru")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN','ROLE_ADMIN','ROLE_REGISTRAR','ROLE_FACILITY_ADMIN')")
    public ResponseEntity<Map<String, String>> topluDuyuruGonder(Authentication auth,
                                                                 @RequestBody OgrenciDuyuruTalebi talep) {
        String gonderenAdi = kurumsalGonderenAdi(auth.getAuthorities().toString());
        bildirimServisi.topluOgrenciDuyurusuOlustur(
                talep.getBaslik(), talep.getMesaj(), talep.getBaglantiUrl(),
                talep.getBaglantiEtiketi(), talep.getResimUrl(), auth.getName(), gonderenAdi);
        return ResponseEntity.ok(Map.of("mesaj", "Duyuru tüm öğrencilere gönderildi.", "gonderen", gonderenAdi));
    }

    /** Gönderenin kurumsal kimliğini JWT rolünden çözer (öğrenciye gösterilir). */
    private String kurumsalGonderenAdi(String yetkiler) {
        if (yetkiler.contains("ROLE_REGISTRAR")) return "Öğrenci İşleri Daire Başkanlığı";
        if (yetkiler.contains("ROLE_FACILITY_ADMIN")) return "Spor Müdürlüğü";
        if (yetkiler.contains("ROLE_SKS_ADMIN")) return "Sağlık Kültür ve Spor Müdürlüğü";
        if (yetkiler.contains("ROLE_ADMIN")) return "Sistem Yönetimi";
        return "Kampüs Yönetimi";
    }

    @GetMapping
    public ResponseEntity<List<BildirimYaniti>> getNotifications(Authentication auth) {
        return ResponseEntity.ok(bildirimServisi.gorunurBildirimleriListele(
                auth.getName(),
                auth.getAuthorities().toString()
        ));
    }

    @PatchMapping("/{bildirimId}/oku")
    public ResponseEntity<BildirimYaniti> markAsRead(Authentication auth,
                                                     @PathVariable String bildirimId) {
        return ResponseEntity.ok(bildirimServisi.okunduOlarakIsaretle(
                auth.getName(),
                auth.getAuthorities().toString(),
                bildirimId
        ));
    }
}
