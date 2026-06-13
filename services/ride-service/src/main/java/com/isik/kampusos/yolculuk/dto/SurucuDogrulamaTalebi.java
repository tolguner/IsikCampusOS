package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

@Data
public class SurucuDogrulamaTalebi {
    private String ehliyetSinifi;
    private String aracMarkaModel;
    private String plaka;
    private String aracRengi;
    private Integer koltukKapasitesi;
    private String belgeUrl;
}
