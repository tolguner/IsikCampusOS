package com.isik.kampusos.yemek.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * İyimser kilit çakışmasını (iki personel aynı siparişi aynı anda işledi) 500 yerine
 * anlamlı bir 409'a çevirir — istemci listeyi yenileyip tekrar dener.
 */
@RestControllerAdvice
public class CakismaHataYakalayici {

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> cakisma(ObjectOptimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Sipariş bu sırada başka biri tarafından güncellendi. Listeyi yenileyip tekrar deneyin."));
    }
}
