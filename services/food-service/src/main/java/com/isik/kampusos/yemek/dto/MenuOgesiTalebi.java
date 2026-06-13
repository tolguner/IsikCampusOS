package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuOgesiTalebi {
    private String ad;
    private String aciklama;
    private String kategori;
    private BigDecimal fiyat;
    private String gorselUrl;
    private String etiketler;      // allerjen/içerik CSV (örn. "VEGAN,ACILI")
    private Boolean mevcut;
    private Boolean oneCikan;
    private List<SecenekGrubu> secenekGruplari;

    @Data
    public static class SecenekGrubu {
        private String ad;
        private String tur;            // TEK_SECIM | COKLU_SECIM
        private boolean zorunlu;
        private int siralama;
        private List<Secenek> secenekler;
    }

    @Data
    public static class Secenek {
        private String ad;
        private BigDecimal ekFiyat;
        private int siralama;
    }
}
