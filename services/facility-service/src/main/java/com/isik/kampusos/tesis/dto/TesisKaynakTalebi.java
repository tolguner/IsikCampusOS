package com.isik.kampusos.tesis.dto;

import lombok.Data;

@Data
public class TesisKaynakTalebi {
    private String kaynakKodu;
    private String ad;
    private String kaynakTuru;
    private int kapasite;
    private boolean rezervasyonYapilabilir;
    private String durum;
}
