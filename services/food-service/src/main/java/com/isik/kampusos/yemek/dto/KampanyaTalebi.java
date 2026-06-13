package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.math.BigDecimal;

/** İşletmecinin kampanya oluşturması/güncellemesi. */
@Data
public class KampanyaTalebi {
    private String ad;
    private String tur;              // YUZDE | TUTAR | UCRETSIZ_TESLIMAT
    private BigDecimal deger;
    private BigDecimal minSepetTutari;
    private Boolean aktif;
}
