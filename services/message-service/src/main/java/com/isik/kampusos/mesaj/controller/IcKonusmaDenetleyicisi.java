package com.isik.kampusos.mesaj.controller;

import com.isik.kampusos.mesaj.dto.KonusmaTalepleri.KapatTalebi;
import com.isik.kampusos.mesaj.dto.KonusmaTalepleri.KonusmaAcTalebi;
import com.isik.kampusos.mesaj.model.Konusma;
import com.isik.kampusos.mesaj.service.MesajServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Servisler-arası (cluster-içi) konuşma yönetimi. Gateway'e açılmaz; modüller (ride/food)
 * yaşam döngüsü olaylarında konuşma açar/kapatır.
 */
@RestController
@RequestMapping("/api/v1/internal/konusmalar")
@RequiredArgsConstructor
public class IcKonusmaDenetleyicisi {

    private final MesajServisi mesajServisi;

    @PostMapping("/ac")
    public ResponseEntity<Konusma> ac(@RequestBody KonusmaAcTalebi talep) {
        return ResponseEntity.ok(mesajServisi.konusmaAcVeyaGuncelle(
                talep.modul(), talep.baglamId(), talep.katilimcilar(), talep.baslik()));
    }

    @PostMapping("/kapat")
    public ResponseEntity<Map<String, String>> kapat(@RequestBody KapatTalebi talep) {
        mesajServisi.konusmaKapat(talep.modul(), talep.baglamId());
        return ResponseEntity.ok(Map.of("mesaj", "Konuşma kapatıldı."));
    }
}
