package com.isik.kampusos.tesis.dto;

import lombok.Data;

@Data
public class TesisPolitikasiTalebi {
    private int rezervasyonPenceresiGun;
    private int iptalLimitDakika;
    private int maksimumRezervasyonSureDakika;
    private boolean onayGerekli;
}
