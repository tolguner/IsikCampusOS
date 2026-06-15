package com.isik.kampusos.yolculuk.controller;

import com.isik.kampusos.yolculuk.dto.EhliyetAnalizSonucu;
import com.isik.kampusos.yolculuk.service.EhliyetAnalizServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Yüklenen ehliyet görselini görüntü-AI ile analiz eder (alan çıkarımı + ehliyet doğrulaması). */
@RestController
@RequestMapping("/api/v1/yolculuklar/ehliyet-analiz")
@RequiredArgsConstructor
public class EhliyetAnalizDenetleyicisi {

    private final EhliyetAnalizServisi ehliyetAnalizServisi;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EhliyetAnalizSonucu> analiz(@RequestBody Map<String, String> govde) {
        return ResponseEntity.ok(ehliyetAnalizServisi.analizEt(govde.get("gorsel")));
    }
}
