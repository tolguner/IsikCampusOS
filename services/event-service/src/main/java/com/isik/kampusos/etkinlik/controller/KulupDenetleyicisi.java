package com.isik.kampusos.etkinlik.controller;

import com.isik.kampusos.etkinlik.dto.*;
import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.service.KulupServisi;
import com.isik.kampusos.etkinlik.service.EtkinlikServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kulupler")
@RequiredArgsConstructor
public class KulupDenetleyicisi {

    private final KulupServisi kulupServisi;
    private final EtkinlikServisi etkinlikServisi;

    @GetMapping
    public ResponseEntity<List<KulupYaniti>> getClubs(Authentication auth) {
        return ResponseEntity.ok(kulupServisi.aktifKulupleriListele(auth.getName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<KulupYaniti>> getAllClubsForAdmin(Authentication auth) {
        return ResponseEntity.ok(kulupServisi.tumKulupleriListele(auth.getName()));
    }

    @GetMapping("/yonetilen")
    public ResponseEntity<List<KulupYaniti>> getManagedClubs(Authentication auth) {
        return ResponseEntity.ok(kulupServisi.yonetilenKulupleriListele(auth.getName()));
    }

    @GetMapping("/{kulupId}")
    public ResponseEntity<KulupYaniti> getClub(Authentication auth,
                                               @PathVariable String kulupId) {
        return ResponseEntity.ok(kulupServisi.yoneticiVeyaBaskanIcinKulupGetir(
                auth.getName(),
                auth.getAuthorities().toString(),
                kulupId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupYaniti> createClub(@RequestBody KulupOlusturmaTalebi talep) {
        return ResponseEntity.ok(kulupServisi.kulupOlustur(talep));
    }

    @PatchMapping("/{kulupId}/profil")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupYaniti> updateClubProfile(Authentication auth,
                                                         @PathVariable String kulupId,
                                                         @RequestBody KulupProfilGuncellemeTalebi talep) {
        return ResponseEntity.ok(kulupServisi.kulupProfiliniGuncelle(kulupId, talep, auth.getName()));
    }

    @PostMapping("/{kulupId}/profil-guncelleme-talepleri")
    public ResponseEntity<KulupProfilDegisiklikIstegiYaniti> requestProfileUpdate(Authentication auth,
                                                                                 @PathVariable String kulupId,
                                                                                 @RequestBody KulupProfilGuncellemeTalebi talep) {
        return ResponseEntity.ok(kulupServisi.profilGuncellemeTalepEt(auth.getName(), kulupId, talep));
    }

    @GetMapping("/profil-guncelleme-talepleri")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<KulupProfilDegisiklikIstegiYaniti>> getProfileChangeQueue(Authentication auth) {
        return ResponseEntity.ok(kulupServisi.profilDegisiklikKuyrugunuGetir(auth.getName()));
    }

    @PostMapping("/profil-guncelleme-talepleri/{requestId}/onayla")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupProfilDegisiklikIstegiYaniti> approveProfileChange(Authentication auth,
                                                                                 @PathVariable String requestId) {
        return ResponseEntity.ok(kulupServisi.profilDegisikliginiOnayla(requestId, auth.getName()));
    }

    @PostMapping("/profil-guncelleme-talepleri/{requestId}/revizyon-talebi")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupProfilDegisiklikIstegiYaniti> requestProfileChangeRevision(
            Authentication auth,
            @PathVariable String requestId,
            @RequestBody EtkinlikGeriBildirimTalebi talep) {
        return ResponseEntity.ok(kulupServisi.profilDegisikligiIcinRevizyonIste(requestId, auth.getName(), talep));
    }

    @PostMapping("/profil-guncelleme-talepleri/{requestId}/reddet")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupProfilDegisiklikIstegiYaniti> rejectProfileChange(
            Authentication auth,
            @PathVariable String requestId,
            @RequestBody EtkinlikGeriBildirimTalebi talep) {
        return ResponseEntity.ok(kulupServisi.profilDegisikliginiReddet(requestId, auth.getName(), talep));
    }

    @GetMapping("/{kulupId}/duyurular")
    public ResponseEntity<List<KulupDuyuruYaniti>> getClubAnnouncements(@PathVariable String kulupId) {
        return ResponseEntity.ok(kulupServisi.kulupDuyurulariniGetir(kulupId));
    }

    @PostMapping("/{kulupId}/duyurular")
    public ResponseEntity<Void> createClubAnnouncement(Authentication auth,
                                                       @PathVariable String kulupId,
                                                       @RequestBody KulupDuyuruTalebi talep) {
        kulupServisi.kulupDuyurusuOlustur(auth.getName(), kulupId, talep);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{kulupId}/durum")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupYaniti> changeClubStatus(Authentication auth,
                                                        @PathVariable String kulupId,
                                                        @RequestBody KulupDurumTalebi talep) {
        return ResponseEntity.ok(kulupServisi.kulupDurumunuDegistir(kulupId, talep, auth.getName()));
    }

    @PatchMapping("/{kulupId}/baskan")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<KulupYaniti> assignPresident(Authentication auth,
                                                       @PathVariable String kulupId,
                                                       @RequestBody KulupBaskaniAtamaTalebi talep) {
        return ResponseEntity.ok(kulupServisi.baskanAta(kulupId, talep, auth.getName()));
    }

    @DeleteMapping("/{kulupId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteClub(Authentication auth, @PathVariable String kulupId) {
        kulupServisi.kulupSil(kulupId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{kulupId}/etkinlikler")
    public ResponseEntity<List<Etkinlik>> getClubEvents(@PathVariable String kulupId) {
        return ResponseEntity.ok(etkinlikServisi.kulupEtkinlikleriniListele(kulupId));
    }

    @GetMapping("/{kulupId}/uyeler")
    public ResponseEntity<List<KulupUyeYaniti>> getClubMembers(Authentication auth, @PathVariable String kulupId) {
        return ResponseEntity.ok(kulupServisi.kulupUyeleriniGetir(auth.getName(), auth.getAuthorities().toString(), kulupId));
    }

    @PatchMapping("/{kulupId}/uyeler/{userId}/rol")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateMemberRole(Authentication auth,
                                                 @PathVariable String kulupId,
                                                 @PathVariable String userId,
                                                 @RequestBody KulupUyeRolGuncellemeTalebi talep) {
        kulupServisi.uyeRolunuGuncelle(auth.getName(), auth.getAuthorities().toString(), kulupId, userId, talep);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{kulupId}/uyeler/{userId}/durum")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateMemberStatus(Authentication auth,
                                                   @PathVariable String kulupId,
                                                   @PathVariable String userId,
                                                   @RequestBody KulupUyeDurumGuncellemeTalebi talep) {
        kulupServisi.uyeDurumunuGuncelle(auth.getName(), auth.getAuthorities().toString(), kulupId, userId, talep);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{kulupId}/uyeler/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> removeMember(Authentication auth,
                                             @PathVariable String kulupId,
                                             @PathVariable String userId) {
        kulupServisi.uyeyiCikar(auth.getName(), auth.getAuthorities().toString(), kulupId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{kulupId}/katil")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<KulupUyesi> joinClub(Authentication auth,
                                              @PathVariable String kulupId) {
        return ResponseEntity.ok(kulupServisi.kulupeKatil(auth.getName(), kulupId));
    }

    @DeleteMapping("/{kulupId}/uyelik")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Void> leaveClub(Authentication auth,
                                         @PathVariable String kulupId) {
        kulupServisi.kuluptenAyril(auth.getName(), kulupId);
        return ResponseEntity.noContent().build();
    }
}
