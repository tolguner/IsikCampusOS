package com.isik.kampusos.profil.controller;
 
import com.isik.kampusos.profil.dto.ProfilDegisiklikTalebi;
import com.isik.kampusos.profil.dto.ProfilDegisiklikIncelemesi;
import com.isik.kampusos.profil.dto.ProfilDetayi;
import com.isik.kampusos.profil.model.Profil;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegi;
import com.isik.kampusos.profil.service.ProfilServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/v1/profiller")
@RequiredArgsConstructor
public class ProfilDenetleyicisi {
 
    private final ProfilServisi profilServisi;
 
    @GetMapping("/benim")
    public ResponseEntity<Profil> getMyProfile(@RequestHeader("X-User-Id") String kullaniciId) {
        return ResponseEntity.ok(profilServisi.kullaniciIdIleProfilGetir(kullaniciId));
    }
 
    @PatchMapping("/benim")
    public ResponseEntity<Profil> updateMyProfile(@RequestHeader("X-User-Id") String kullaniciId, 
                                                   @RequestBody ProfilDetayi profilDto) {
        return ResponseEntity.ok(profilServisi.profilGuncelle(kullaniciId, profilDto));
    }
 
    @GetMapping("/benim/degisiklik-talepleri")
    public ResponseEntity<List<ProfilDegisiklikIstegi>> getMyChangeRequests(@RequestHeader("X-User-Id") String kullaniciId) {
        return ResponseEntity.ok(profilServisi.degisiklikIsteklerimiGetir(kullaniciId));
    }
 
    @PostMapping("/benim/degisiklik-talepleri")
    public ResponseEntity<ProfilDegisiklikIstegi> requestProfileChange(
            @RequestHeader("X-User-Id") String kullaniciId,
            @RequestBody ProfilDegisiklikTalebi requestDto) {
        return ResponseEntity.ok(profilServisi.profilDegisiklikIstegiOlustur(kullaniciId, requestDto));
    }
 
    @GetMapping("/degisiklik-talepleri/bekleyen")
    public ResponseEntity<List<ProfilDegisiklikIstegi>> getPendingChangeRequests(
            @RequestHeader("X-User-Roles") String roller) {
        return ResponseEntity.ok(profilServisi.bekleyenDegisiklikIstekleriniGetir(roller));
    }
 
    @PostMapping("/degisiklik-talepleri/{istekId}/onayla")
    public ResponseEntity<ProfilDegisiklikIstegi> approveChangeRequest(
            @RequestHeader("X-User-Id") String kullaniciId,
            @RequestHeader("X-User-Roles") String roller,
            @PathVariable String istekId) {
        return ResponseEntity.ok(profilServisi.degisiklikIsteginiOnayla(istekId, kullaniciId, roller));
    }
 
    @PostMapping("/degisiklik-talepleri/{istekId}/reddet")
    public ResponseEntity<ProfilDegisiklikIstegi> rejectChangeRequest(
            @RequestHeader("X-User-Id") String kullaniciId,
            @RequestHeader("X-User-Roles") String roller,
            @PathVariable String istekId,
            @RequestBody(required = false) ProfilDegisiklikIncelemesi reviewDto) {
        return ResponseEntity.ok(profilServisi.degisiklikIsteginiReddet(istekId, kullaniciId, roller, reviewDto));
    }
 
    @GetMapping("/{kullaniciId}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String kullaniciId) {
        Profil profil = profilServisi.kullaniciIdIleProfilGetir(kullaniciId);
        if (profil == null || profil.getProfilResmiBaytlari() == null) {
            return ResponseEntity.notFound().build();
        }
        
        String contentType = profil.getProfilResmiIcerikTuru();
        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = "image/png"; // fallback
        }
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=86400") // cache for 1 day
                .body(profil.getProfilResmiBaytlari());
    }
}
