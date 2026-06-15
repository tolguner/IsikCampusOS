package com.isik.kampusos.yolculuk.controller;

import com.isik.kampusos.yolculuk.service.AracVeriServisi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Araç marka/model verisi (dış API proxy). Form doldururken kullanılır. */
@RestController
@RequestMapping("/api/v1/yolculuklar/arac-veri")
@RequiredArgsConstructor
public class AracVeriDenetleyicisi {

    private final AracVeriServisi aracVeriServisi;

    @GetMapping("/markalar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> markalar() {
        return ResponseEntity.ok(aracVeriServisi.markalar());
    }

    @GetMapping("/modeller")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> modeller(@RequestParam String marka) {
        return ResponseEntity.ok(aracVeriServisi.modeller(marka));
    }
}
