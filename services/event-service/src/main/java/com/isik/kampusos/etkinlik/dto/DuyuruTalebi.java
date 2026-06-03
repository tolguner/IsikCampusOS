package com.isik.kampusos.etkinlik.dto;

import lombok.Data;

@Data
public class DuyuruTalebi {
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    private String olusturanAdi;
    private String hedefKitle;
}
