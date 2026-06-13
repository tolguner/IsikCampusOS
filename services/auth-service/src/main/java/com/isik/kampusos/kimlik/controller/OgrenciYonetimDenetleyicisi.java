package com.isik.kampusos.kimlik.controller;
 
import com.isik.kampusos.kimlik.dto.*;
import com.isik.kampusos.kimlik.service.OgrenciYonetimServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.Map;
 
@RestController
@RequestMapping("/api/v1/ogrenciler")
@RequiredArgsConstructor
public class OgrenciYonetimDenetleyicisi {
 
    private final OgrenciYonetimServisi ogrenciYonetimServisi;
 
    /**
     * Yeni öğrenci ekle — ROLE_REGISTRAR yetkisi gerekli.
     */
    @PostMapping
    public ResponseEntity<OgrenciYaniti> ogrenciOlustur(@RequestBody OgrenciOlusturmaIstegi request) {
        return ResponseEntity.ok(ogrenciYonetimServisi.ogrenciOlustur(request));
    }
 
    /**
     * Öğrenci listesi — sayfalı, filtrelenebilir.
     */
    @GetMapping
    public ResponseEntity<Page<OgrenciYaniti>> ogrencileriListele(
            @RequestParam(defaultValue = "0") int sayfa,
            @RequestParam(defaultValue = "20") int boyut,
            @RequestParam(required = false) String arama,
            @RequestParam(required = false) String durum,
            @RequestParam(required = false) String fakulte) {
        return ResponseEntity.ok(ogrenciYonetimServisi.ogrencileriListele(sayfa, boyut, arama, durum, fakulte));
    }
 
    /**
     * Tekil öğrenci detayı.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OgrenciYaniti> ogrenciGetir(@PathVariable String id) {
        return ResponseEntity.ok(ogrenciYonetimServisi.ogrenciGetir(id));
    }
 
    /**
     * Öğrenci bilgilerini güncelle.
     */
    @PutMapping("/{id}")
    public ResponseEntity<OgrenciYaniti> ogrenciGuncelle(
            @PathVariable String id,
            @RequestBody OgrenciGuncellemeIstegi request) {
        return ResponseEntity.ok(ogrenciYonetimServisi.ogrenciGuncelle(id, request));
    }
 
    /**
     * Öğrenci durumunu değiştir (AKTIF, PASIF, MEZUN, ILISIGI_KESILMIS).
     */
    @PatchMapping("/{id}/durum")
    public ResponseEntity<OgrenciYaniti> durumDegistir(
            @PathVariable String id,
            @RequestBody DurumDegistirmeIstegi request) {
        return ResponseEntity.ok(ogrenciYonetimServisi.durumDegistir(id, request));
    }
 
    /**
     * Öğrenci şifresini sıfırla (TC Kimlik No'ya geri döndür).
     */
    @PostMapping("/{id}/sifre-sifirla")
    public ResponseEntity<Map<String, String>> sifreSifirla(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        ogrenciYonetimServisi.sifreSifirla(id, body.get("tcKimlikNo"));
        return ResponseEntity.ok(Map.of("message", "Öğrenci şifresi başarıyla sıfırlandı."));
    }
 
    /**
     * Öğrenciyi sistemden sil — ROLE_REGISTRAR yetkisi gerekli.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> ogrenciSil(@PathVariable String id) {
        ogrenciYonetimServisi.ogrenciSil(id);
        return ResponseEntity.ok(Map.of("message", "Öğrenci başarıyla silindi."));
    }
}
