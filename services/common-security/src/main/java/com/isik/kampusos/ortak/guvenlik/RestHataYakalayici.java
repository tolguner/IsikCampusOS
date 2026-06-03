package com.isik.kampusos.ortak.guvenlik;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * {@link ResponseStatusException} ve programatik {@link AccessDeniedException} icin ortak
 * REST hata yaniti uretir. event ve facility servislerindeki birebir ayni kopyalarin yerini alir.
 *
 * <p>Not: Yalnizca bu iki istisna tipini ele alir; RuntimeException/Exception genel yakalamasi
 * yapan servisler (ornegin auth-service) kendi {@code @RestControllerAdvice} bilesenlerini korur —
 * farkli istisna tipleri oldugu icin birlikte sorunsuz calisirlar.
 */
@RestControllerAdvice
public class RestHataYakalayici {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(hataGovdesi(ex.getReason()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(403).body(hataGovdesi(ex.getMessage()));
    }

    private Map<String, Object> hataGovdesi(String mesaj) {
        return Map.of(
                "timestamp", LocalDateTime.now(),
                "message", mesaj == null || mesaj.isBlank() ? "Request failed" : mesaj);
    }
}
