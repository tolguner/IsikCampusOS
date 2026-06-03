package com.isik.kampusos.tesis.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class KullanilabilirlikKuraliTalebi {
    private int haftaninGunu;
    private LocalTime baslangicSaati;
    private LocalTime bitisSaati;
    private LocalDate gecerlilikBaslangici;
    private LocalDate gecerlilikBitisi;
    private String durum;
}
