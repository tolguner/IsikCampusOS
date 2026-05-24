package com.isik.campusos.auth.controller;

import com.isik.campusos.auth.dto.CertificateVerificationResponse;
import com.isik.campusos.auth.service.CertificateVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateVerificationService certificateVerificationService;

    @GetMapping("/verify/{certificateCode}")
    public ResponseEntity<CertificateVerificationResponse> verify(@PathVariable String certificateCode) {
        return ResponseEntity.ok(certificateVerificationService.verify(certificateCode));
    }
}
