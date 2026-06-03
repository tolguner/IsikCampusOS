package com.isik.kampusos.kimlik.controller;
 
import com.isik.kampusos.kimlik.dto.KullaniciOzetiYaniti;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
 
/**
 * Internal API — Diğer mikroservisler tarafından toplu kullanıcı bilgisi almak
 * için kullanılır.
 */
@RestController
@RequestMapping("/api/v1/kullanicilar")
@RequiredArgsConstructor
public class KullaniciSorguDenetleyicisi {
 
    private final KullaniciDeposu kullaniciDeposu;
 
    /**
     * Toplu kullanıcı bilgisi döner.
     * Body: { "kullaniciIdleri": ["id1", "id2", ...] }
     */
    @PostMapping("/toplu")
    public ResponseEntity<List<KullaniciOzetiYaniti>> kullanicilariGetir(@RequestBody Map<String, List<String>> body) {
        List<String> kullaniciIdleri = body.getOrDefault("kullaniciIdleri", List.of());
        if (kullaniciIdleri.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
 
        List<KullaniciOzetiYaniti> sonuclar = kullaniciDeposu.findAllById(kullaniciIdleri).stream()
                .map(this::ozetOlustur)
                .collect(Collectors.toList());
 
        return ResponseEntity.ok(sonuclar);
    }
 
    private KullaniciOzetiYaniti ozetOlustur(Kullanici kullanici) {
        return KullaniciOzetiYaniti.builder()
                .id(kullanici.getId())
                .tamAd(kullanici.getTamAd())
                .ogrenciNumarasi(kullanici.getOgrenciNumarasi())
                .bolum(kullanici.getBolum())
                .fakulte(kullanici.getFakulte())
                .eposta(kullanici.getEposta())
                .build();
    }
}
