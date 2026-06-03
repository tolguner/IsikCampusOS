package com.isik.kampusos.tesis.dto;

import lombok.Data;

@Data
public class TesisTalebi {
    private String ad;
    private String tesisTuru;
    private String aciklama;
    private String konumMetni;
    private int kapasite;
    private String durum;
}
