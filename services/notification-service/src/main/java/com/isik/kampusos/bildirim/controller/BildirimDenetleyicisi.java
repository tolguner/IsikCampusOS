package com.isik.kampusos.bildirim.controller;

import com.isik.kampusos.bildirim.dto.BildirimYaniti;
import com.isik.kampusos.bildirim.dto.DestekDuyuruTalebi;
import com.isik.kampusos.bildirim.dto.OgrenciDuyuruTalebi;
import com.isik.kampusos.bildirim.messaging.BildirimAkisYoneticisi;
import com.isik.kampusos.bildirim.model.Bildirim;
import com.isik.kampusos.bildirim.service.BildirimServisi;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
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
    private final BildirimAkisYoneticisi akisYoneticisi;

    /** Anlık bildirim akışı (SSE). İstemci açık tutar; yeni bildirimler anında iletilir. */
    @GetMapping(value = "/akis", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter akis(Authentication auth) {
        return akisYoneticisi.abone(auth.getName(), auth.getAuthorities().toString());
    }

    /** İdari rollerin (öğrenci hariç) tüm öğrencilere kurumsal duyuru göndermesi. */
    @PostMapping("/toplu-duyuru")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN','ROLE_ADMIN','ROLE_REGISTRAR','ROLE_FACILITY_ADMIN')")
    public ResponseEntity<Map<String, String>> topluDuyuruGonder(Authentication auth,
                                                                 @RequestBody OgrenciDuyuruTalebi talep) {
        String yetkiler = auth.getAuthorities().toString();
        // "Tüm kullanıcılar" hedef kitlesi yalnızca sistem yöneticisine açıktır; diğerleri tüm öğrencilere gönderir.
        Bildirim.HedefKitle kitle = Bildirim.HedefKitle.TUM_OGRENCILER;
        if ("TUM_KULLANICILAR".equalsIgnoreCase(talep.getHedefKitle())) {
            if (!yetkiler.contains("ROLE_ADMIN")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Tüm kullanıcılara duyuru yalnızca sistem yöneticisi tarafından gönderilebilir.");
            }
            kitle = Bildirim.HedefKitle.TUM_KULLANICILAR;
        }
        String gonderenAdi = kurumsalGonderenAdi(yetkiler);
        bildirimServisi.topluDuyuruOlustur(
                talep.getBaslik(), talep.getMesaj(), talep.getBaglantiUrl(),
                talep.getBaglantiEtiketi(), talep.getResimUrl(), kitle, auth.getName(), gonderenAdi);
        String hedef = kitle == Bildirim.HedefKitle.TUM_KULLANICILAR ? "tüm kullanıcılara" : "tüm öğrencilere";
        return ResponseEntity.ok(Map.of("mesaj", "Duyuru " + hedef + " gönderildi.", "gonderen", gonderenAdi));
    }

    /** Destek Hizmetleri Müdürlüğü: birden çok hedef kitleye (öğrenci / işletme yön. / işletme personeli) toplu duyuru. */
    @PostMapping("/destek-duyuru")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPPORT_SERVICES_ADMIN','ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> destekDuyuruGonder(Authentication auth,
                                                                  @RequestBody DestekDuyuruTalebi talep) {
        List<String> izinli = List.of("TUM_OGRENCILER", "ISLETME_YONETICILERI", "ISLETME_PERSONELLERI");
        List<Bildirim.HedefKitle> kitleler = (talep.getHedefKitleler() == null ? List.<String>of() : talep.getHedefKitleler()).stream()
                .filter(k -> k != null && izinli.contains(k.trim().toUpperCase()))
                .map(k -> Bildirim.HedefKitle.valueOf(k.trim().toUpperCase()))
                .distinct()
                .toList();
        if (kitleler.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "En az bir hedef kitle seçilmelidir.");
        }
        String gonderenAdi = "Destek Hizmetleri Müdürlüğü";
        kitleler.forEach(kitle -> bildirimServisi.topluDuyuruOlustur(
                talep.getBaslik(), talep.getMesaj(), talep.getBaglantiUrl(),
                talep.getBaglantiEtiketi(), talep.getResimUrl(), kitle, auth.getName(), gonderenAdi));
        return ResponseEntity.ok(Map.of("mesaj", "Duyuru " + kitleler.size() + " hedef kitleye gönderildi.", "gonderen", gonderenAdi));
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
