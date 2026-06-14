package com.isik.kampusos.tesis.dto;

import lombok.Data;

import java.time.LocalTime;
import java.util.List;

/**
 * Tesis oluşturma/güncellemenin tek-istek (atomik) gövdesi: tanım + politika + çalışma saatleri.
 * Politika alanları kullanıcıya saat cinsinden gösterildiği için süreler saat olarak alınır.
 */
@Data
public class TamTesisTalebi {
    // Tanım
    private String ad;
    private int kapasite;
    private String aciklama;
    private String konumMetni;
    private Double enlem;
    private Double boylam;
    private String durum; // opsiyonel

    // Politika
    private int rezervasyonPenceresiGun;
    private int maksimumRezervasyonSureSaat;
    private int iptalLimitSaat;
    private boolean onayGerekli;

    // Çalışma saatleri (yalnız açık günler gönderilir)
    private List<CalismaSaati> calismaSaatleri;

    @Data
    public static class CalismaSaati {
        private int haftaninGunu;       // 1-7 (Pzt-Paz)
        private LocalTime baslangicSaati;
        private LocalTime bitisSaati;
    }
}
