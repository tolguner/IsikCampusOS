package com.isik.kampusos.kulup.dto;

import lombok.Data;

@Data
public class KulupDuyuruTalebi {
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
}
