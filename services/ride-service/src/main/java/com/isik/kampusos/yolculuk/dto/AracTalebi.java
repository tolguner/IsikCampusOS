package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

@Data
public class AracTalebi {
    private String marka;
    private String model;
    private String aracTipi;     // Sedan, Hatchback, SUV, ...
    private Integer modelYili;
    /** Geriye uyum: gönderilirse kullanılır, yoksa marka+model'den türetilir. */
    private String markaModel;
    private String plaka;
    private String renk;
    private Integer koltukKapasitesi;
    /** Araç fotoğrafı (base64 data-URL); zorunlu. */
    private String gorselUrl;
}
