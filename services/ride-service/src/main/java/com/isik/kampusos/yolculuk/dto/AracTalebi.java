package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

@Data
public class AracTalebi {
    private String markaModel;
    private String plaka;
    private String renk;
    private Integer koltukKapasitesi;
    /** Araç fotoğrafı (base64 data-URL); zorunlu. */
    private String gorselUrl;
}
