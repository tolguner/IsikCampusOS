package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class YolculukAramaTalebi {
    private LocalDate tarih;
    private String baslangic;
    private Double baslangicEnlem;
    private Double baslangicBoylam;
    private String varis;
    private Double varisEnlem;
    private Double varisBoylam;
    private Boolean sadeceUcretsiz;
    private BigDecimal maksimumUcret;
    private Boolean sadeceAraDurakKabulEdenler;
}
