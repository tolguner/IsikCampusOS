package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

/** Ehliyet doğrulaması — araçtan bağımsız. Ehliyet sınıfı + belge fotoğrafı (zorunlu). */
@Data
public class SurucuDogrulamaTalebi {
    private String ehliyetSinifi;
    private String ehliyetNo;
    private String ehliyetSahibiAdSoyad;
    private java.time.LocalDate verilisTarihi;
    private java.time.LocalDate gecerlilikTarihi;
    /** Ehliyet belgesi fotoğrafı (base64 data-URL); zorunlu — yalnız metin yeterli değil. */
    private String belgeUrl;
}
