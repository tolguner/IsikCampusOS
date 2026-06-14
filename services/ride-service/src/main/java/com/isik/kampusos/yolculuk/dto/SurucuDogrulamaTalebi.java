package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

/** Ehliyet doğrulaması — araçtan bağımsız. Ehliyet sınıfı + belge fotoğrafı (zorunlu). */
@Data
public class SurucuDogrulamaTalebi {
    private String ehliyetSinifi;
    /** Ehliyet belgesi fotoğrafı (base64 data-URL); zorunlu — yalnız metin yeterli değil. */
    private String belgeUrl;
}
