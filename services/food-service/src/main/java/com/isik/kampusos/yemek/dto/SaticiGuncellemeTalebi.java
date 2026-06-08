package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.math.BigDecimal;

/** İşletme yöneticisinin kendi satıcısını güncellemesi. */
@Data
public class SaticiGuncellemeTalebi {
    private String ad;
    private String aciklama;
    private String konumMetni;
    private String logoUrl;
    private Boolean acik;

    // Zengin profil (UberEats benzeri)
    private String mutfakTuru;
    private String kapakGorselUrl;
    private BigDecimal teslimatUcreti;
    private BigDecimal minimumSepetTutari;
    private Integer tahminiTeslimatDakika;
}
