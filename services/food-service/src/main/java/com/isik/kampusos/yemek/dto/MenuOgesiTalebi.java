package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MenuOgesiTalebi {
    private String ad;
    private String aciklama;
    private String kategori;
    private BigDecimal fiyat;
    private String gorselUrl;
    private Boolean mevcut;
}
