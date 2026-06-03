package com.isik.kampusos.kimlik.controller;
 
import com.isik.kampusos.kimlik.dto.SertifikaDogrulamaYaniti;
import com.isik.kampusos.kimlik.service.SertifikaDogrulamaServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
@RestController
@RequestMapping("/api/v1/sertifikalar")
@RequiredArgsConstructor
public class SertifikaDenetleyicisi {
 
    private final SertifikaDogrulamaServisi sertifikaDogrulamaServisi;
 
    @GetMapping("/dogrula/{sertifikaKodu}")
    public ResponseEntity<SertifikaDogrulamaYaniti> dogrula(@PathVariable String sertifikaKodu) {
        return ResponseEntity.ok(sertifikaDogrulamaServisi.dogrula(sertifikaKodu));
    }
}
