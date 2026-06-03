package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.*;
import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.model.EtkinlikDegisiklikIstegi;
import com.isik.kampusos.etkinlik.model.EtkinlikKatilimi;
import com.isik.kampusos.etkinlik.service.EtkinlikServisi;
import com.isik.kampusos.etkinlik.service.EtkinlikKatilimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/etkinlikler")
@RequiredArgsConstructor
public class EtkinlikDenetleyicisi {

    private final EtkinlikServisi etkinlikServisi;
    private final EtkinlikKatilimServisi etkinlikKatilimServisi;

    /** Yayınlanmış etkinlikleri listele — tüm authenticated kullanıcılar */
    @GetMapping
    public ResponseEntity<List<Etkinlik>> getPublishedEvents() {
        return ResponseEntity.ok(etkinlikServisi.yayinlananEtkinlikleriListele());
    }

    /** Kulüp admininin yönettiği etkinlikleri listele */
    @GetMapping("/yonetilen")
    public ResponseEntity<List<Etkinlik>> getManagedEvents(Authentication auth) {
        return ResponseEntity.ok(etkinlikServisi.yonetilenEtkinlikleriListele(auth.getName()));
    }

    @GetMapping("/onay-bekleyenler")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<Etkinlik>> getReviewQueue() {
        return ResponseEntity.ok(etkinlikServisi.onayBekleyenleriListele());
    }

    @GetMapping("/degisiklik-talepleri")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<EtkinlikDegisiklikIstegi>> getChangeRequests() {
        return ResponseEntity.ok(etkinlikServisi.degisiklikTalepleriniListele());
    }

    /** Etkinlik taslağı oluştur — kulüp admin kontrolü servis katmanında */
    @PostMapping("/taslak")
    public ResponseEntity<Etkinlik> createDraft(Authentication auth,
                                                @RequestBody EtkinlikOlusturmaTalebi talep) {
        return ResponseEntity.ok(etkinlikServisi.etkinlikTaslagiOlustur(auth.getName(), talep));
    }

    /** Etkinliği onaya gönder — kulüp admin kontrolü servis katmanında */
    @PostMapping("/{etkinlikId}/onaya-sun")
    public ResponseEntity<Etkinlik> submitEvent(Authentication auth,
                                                @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikServisi.onayaSun(auth.getName(), etkinlikId));
    }

    @PutMapping("/{etkinlikId}")
    public ResponseEntity<Etkinlik> updateEvent(Authentication auth,
                                                @PathVariable String etkinlikId,
                                                @RequestBody EtkinlikGuncellemeTalebi talep) {
        return ResponseEntity.ok(etkinlikServisi.etkinlikGuncelle(auth.getName(), etkinlikId, talep));
    }

    /**
     * Etkinliği onayla ve yayınla.
     */
    @PostMapping("/{etkinlikId}/onayla")
    public ResponseEntity<Etkinlik> approveEvent(Authentication auth,
                                                 @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikServisi.etkinlikOnayla(auth.getName(), etkinlikId));
    }

    @PostMapping("/{etkinlikId}/revizyon-talebi")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Etkinlik> requestRevision(Authentication auth,
                                                    @PathVariable String etkinlikId,
                                                    @RequestBody EtkinlikGeriBildirimTalebi talep) {
        return ResponseEntity.ok(etkinlikServisi.revizyonTalepEt(auth.getName(), etkinlikId, talep));
    }

    @PostMapping("/{etkinlikId}/iptal")
    public ResponseEntity<Etkinlik> cancelEvent(Authentication auth,
                                                @PathVariable String etkinlikId,
                                                @RequestBody EtkinlikIptalTalebi talep) {
        return ResponseEntity.ok(etkinlikServisi.etkinlikIptalEt(auth.getName(), auth.getAuthorities().toString(), etkinlikId, talep));
    }

    @PostMapping("/degisiklik-talepleri/{changeRequestId}/onayla")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Etkinlik> approveChangeRequest(Authentication auth,
                                                         @PathVariable String changeRequestId) {
        return ResponseEntity.ok(etkinlikServisi.degisiklikTalebiniOnayla(auth.getName(), changeRequestId));
    }

    @PostMapping("/degisiklik-talepleri/{changeRequestId}/revizyon-talebi")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<EtkinlikDegisiklikIstegi> requestChangeRevision(Authentication auth,
                                                                          @PathVariable String changeRequestId,
                                                                          @RequestBody EtkinlikGeriBildirimTalebi talep) {
        return ResponseEntity.ok(etkinlikServisi.degisiklikTalebiIcinRevizyonIste(auth.getName(), changeRequestId, talep));
    }

    /** RSVP oluştur — yalnızca öğrenciler */
    @PostMapping("/{etkinlikId}/katilim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<EtkinlikKatilimi> createRsvp(Authentication auth,
                                                       @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.katilimOlustur(auth.getName(), etkinlikId));
    }

    /** RSVP iptal et */
    @PostMapping("/{etkinlikId}/katilim/iptal")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<EtkinlikKatilimi> cancelRsvp(Authentication auth,
                                                       @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.katilimiIptalEt(auth.getName(), etkinlikId));
    }

    @GetMapping("/katilimlarim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<EtkinlikKatilimi>> getMyRsvps(Authentication auth) {
        return ResponseEntity.ok(etkinlikKatilimServisi.katilimlarimiListele(auth.getName()));
    }

    /** Kullanıcı check-in — kulüp admin veya sistem admin (servis katmanında kontrol) */
    @PostMapping("/{etkinlikId}/yoklama/{targetUserId}")
    public ResponseEntity<EtkinlikKatilimi> checkInUser(Authentication auth,
                                                        @PathVariable String etkinlikId,
                                                        @PathVariable String targetUserId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.kullaniciYoklamasiAl(auth.getName(), auth.getAuthorities().toString(), etkinlikId, targetUserId));
    }

    /** Kulüp admini/SKS etkinlik katılımcılarını ve katılım durumlarını görür */
    @GetMapping("/{etkinlikId}/katilimcilar")
    public ResponseEntity<List<EtkinlikKatilimciYaniti>> getParticipants(Authentication auth,
                                                                         @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.katilimcilariListele(auth.getName(), auth.getAuthorities().toString(), etkinlikId));
    }

    @PostMapping("/{etkinlikId}/yoklamalar/{rsvpId}/odeme/onayla")
    public ResponseEntity<EtkinlikKatilimi> approvePayment(Authentication auth,
                                                           @PathVariable String etkinlikId,
                                                           @PathVariable String rsvpId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.odemeyiOnayla(auth.getName(), auth.getAuthorities().toString(), etkinlikId, rsvpId));
    }

    @PostMapping("/{etkinlikId}/yoklamalar/{rsvpId}/odeme/reddet")
    public ResponseEntity<EtkinlikKatilimi> rejectPayment(Authentication auth,
                                                          @PathVariable String etkinlikId,
                                                          @PathVariable String rsvpId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.odemeyiReddet(auth.getName(), auth.getAuthorities().toString(), etkinlikId, rsvpId));
    }

    /** QR koddan gelen token ile katılım doğrulama */
    @PostMapping("/{etkinlikId}/yoklama/karekod")
    public ResponseEntity<EtkinlikKatilimi> checkInWithQr(Authentication auth,
                                                          @PathVariable String etkinlikId,
                                                          @RequestBody YoklamaKarekodTalebi talep) {
        return ResponseEntity.ok(etkinlikKatilimServisi.qrKoduIleYoklamaAl(
                auth.getName(),
                auth.getAuthorities().toString(),
                etkinlikId,
                talep.getBelirtec()
        ));
    }

    /** Sertifikalı etkinliklerde katılanlara sertifika gönderimini tetikle */
    @PostMapping("/{etkinlikId}/sertifikalar/dagit")
    public ResponseEntity<SertifikaVerilmeYaniti> issueCertificates(Authentication auth,
                                                                    @PathVariable String etkinlikId) {
        return ResponseEntity.ok(etkinlikKatilimServisi.sertifikalariOlustur(auth.getName(), auth.getAuthorities().toString(), etkinlikId));
    }
}
