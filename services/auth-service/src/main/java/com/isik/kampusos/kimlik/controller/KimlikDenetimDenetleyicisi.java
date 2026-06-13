package com.isik.kampusos.kimlik.controller;
 
import com.isik.kampusos.kimlik.dto.*;
import com.isik.kampusos.kimlik.service.KimlikServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
 
import java.util.Map;
 
@RestController
@RequestMapping("/api/v1/kimlik")
@RequiredArgsConstructor
public class KimlikDenetimDenetleyicisi {
 
    private final KimlikServisi kimlikServisi;
 
    @PostMapping("/giris")
    public ResponseEntity<KimlikYaniti> girisYap(@RequestBody GirisIstegi request) {
        return ResponseEntity.ok(kimlikServisi.girisYap(request));
    }
 
    @PostMapping("/sifre-degistir")
    public ResponseEntity<Map<String, String>> sifreDegistir(
            Authentication authentication,
            @RequestBody SifreDegistirmeIstegi request) {
        kimlikServisi.sifreDegistir(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Şifreniz başarıyla değiştirildi."));
    }
 
    @PostMapping("/sifremi-unuttum")
    public ResponseEntity<Map<String, String>> sifremiUnuttum(@RequestBody SifremiUnuttumIstegi request) {
        kimlikServisi.sifremiUnuttum(request);
        return ResponseEntity.ok(Map.of("message", "Şifre sıfırlama kodu e-posta adresinize gönderildi."));
    }
 
    @PostMapping("/sifre-sifirla")
    public ResponseEntity<Map<String, String>> sifreSifirla(@RequestBody SifreSifirlamaIstegi request) {
        kimlikServisi.sifreSifirla(request);
        return ResponseEntity.ok(Map.of("message", "Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz."));
    }
 
    @PostMapping("/eposta-dogrula")
    public ResponseEntity<Map<String, String>> epostaDogrula(@RequestBody EpostaDogrulamaIstegi request) {
        kimlikServisi.epostaDogrula(request);
        return ResponseEntity.ok(Map.of("message", "E-posta adresiniz başarıyla doğrulandı."));
    }
 
    @PostMapping("/dogrulama-kodu-gonder")
    public ResponseEntity<Map<String, String>> dogrulamaKoduGonder(Authentication authentication) {
        kimlikServisi.dogrulamaKoduGonder(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Doğrulama kodu tekrar gönderildi."));
    }
}
