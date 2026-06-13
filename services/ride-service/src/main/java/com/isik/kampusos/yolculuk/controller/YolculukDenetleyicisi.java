package com.isik.kampusos.yolculuk.controller;

import com.isik.kampusos.yolculuk.dto.*;
import com.isik.kampusos.yolculuk.model.*;
import com.isik.kampusos.yolculuk.service.SurucuDogrulamaServisi;
import com.isik.kampusos.yolculuk.service.YolculukServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/yolculuklar")
@RequiredArgsConstructor
public class YolculukDenetleyicisi {

    private final YolculukServisi yolculukServisi;
    private final SurucuDogrulamaServisi dogrulamaServisi;

    @GetMapping("/ilanlar")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<YolculukIlani>> ilanAra(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tarih,
            @RequestParam(required = false) String baslangic,
            @RequestParam(required = false) Double baslangicEnlem,
            @RequestParam(required = false) Double baslangicBoylam,
            @RequestParam(required = false) String varis,
            @RequestParam(required = false) Double varisEnlem,
            @RequestParam(required = false) Double varisBoylam,
            @RequestParam(required = false) Boolean sadeceUcretsiz,
            @RequestParam(required = false) BigDecimal maksimumUcret,
            @RequestParam(required = false) Boolean sadeceAraDurakKabulEdenler) {
        YolculukAramaTalebi arama = new YolculukAramaTalebi();
        arama.setTarih(tarih);
        arama.setBaslangic(baslangic);
        arama.setBaslangicEnlem(baslangicEnlem);
        arama.setBaslangicBoylam(baslangicBoylam);
        arama.setVaris(varis);
        arama.setVarisEnlem(varisEnlem);
        arama.setVarisBoylam(varisBoylam);
        arama.setSadeceUcretsiz(sadeceUcretsiz);
        arama.setMaksimumUcret(maksimumUcret);
        arama.setSadeceAraDurakKabulEdenler(sadeceAraDurakKabulEdenler);
        return ResponseEntity.ok(yolculukServisi.ilanAra(arama));
    }

    @PostMapping("/ilanlar")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukIlani> ilanOlustur(Authentication auth, @RequestBody YolculukIlaniTalebi talep) {
        return ResponseEntity.ok(yolculukServisi.ilanOlustur(auth.getName(), talep));
    }

    @GetMapping("/ilanlar/benim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<YolculukIlani>> benimIlanlarim(Authentication auth) {
        return ResponseEntity.ok(yolculukServisi.benimIlanlarim(auth.getName()));
    }

    @PostMapping("/ilanlar/{id}/iptal")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukIlani> ilanIptal(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(yolculukServisi.ilanIptal(auth.getName(), id));
    }

    @PostMapping("/ilanlar/{id}/katil")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukTalebi> katil(Authentication auth, @PathVariable String id,
                                                @RequestBody YolculukKatilimTalebi talep) {
        return ResponseEntity.ok(yolculukServisi.katil(auth.getName(), id, talep));
    }

    @GetMapping("/talepler/benim")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<YolculukTalebi>> taleplerim(Authentication auth) {
        return ResponseEntity.ok(yolculukServisi.taleplerim(auth.getName()));
    }

    @GetMapping("/surucu/talepler")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<YolculukTalebi>> surucuTalepleri(Authentication auth) {
        return ResponseEntity.ok(yolculukServisi.surucuTalepleri(auth.getName()));
    }

    @PostMapping("/talepler/{id}/kabul")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukTalebi> talepKabul(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(yolculukServisi.talepKabul(auth.getName(), id));
    }

    @PostMapping("/talepler/{id}/red")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukTalebi> talepRed(Authentication auth, @PathVariable String id,
                                                   @RequestBody(required = false) AdminIncelemeTalebi talep) {
        return ResponseEntity.ok(yolculukServisi.talepReddet(auth.getName(), id, talep != null ? talep.getNot() : null));
    }

    @PostMapping("/talepler/{id}/iptal")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukTalebi> talepIptal(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(yolculukServisi.talepIptal(auth.getName(), id));
    }

    @PostMapping("/talepler/{id}/tamamla")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukTalebi> talepTamamla(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(yolculukServisi.talepTamamla(auth.getName(), id));
    }

    @PostMapping("/talepler/{id}/puanla")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukPuani> puanla(Authentication auth, @PathVariable String id,
                                                @RequestBody PuanlamaTalebi talep) {
        return ResponseEntity.ok(yolculukServisi.puanla(auth.getName(), id, talep));
    }

    @PostMapping("/talepler/{id}/sikayet")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<YolculukSikayeti> sikayetEt(Authentication auth, @PathVariable String id,
                                                      @RequestBody SikayetTalebi talep) {
        return ResponseEntity.ok(yolculukServisi.sikayetEt(auth.getName(), id, talep));
    }

    @GetMapping("/surucu-dogrulama")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<SurucuDogrulama> dogrulamaDurumum(Authentication auth) {
        SurucuDogrulama kayit = dogrulamaServisi.benim(auth.getName());
        return kayit == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(kayit);
    }

    @PostMapping("/surucu-dogrulama")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<SurucuDogrulama> dogrulamaBasvur(Authentication auth,
                                                           @RequestBody SurucuDogrulamaTalebi talep) {
        return ResponseEntity.ok(dogrulamaServisi.basvur(auth.getName(), talep));
    }
}
