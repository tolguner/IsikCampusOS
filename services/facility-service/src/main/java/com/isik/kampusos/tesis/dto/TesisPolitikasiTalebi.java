package com.isik.kampusos.tesis.dto;

import lombok.Data;

@Data
public class TesisPolitikasiTalebi {
    private int rezervasyonPenceresiGun;
    private int minimumBildirimDakika;
    private int iptalLimitDakika;
    private boolean yoklamaZorunlu;
    private int otomatikGelmemeDakika;
    private int maksimumRezervasyonSureDakika;
}
