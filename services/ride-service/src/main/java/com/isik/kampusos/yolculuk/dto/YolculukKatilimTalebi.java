package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

@Data
public class YolculukKatilimTalebi {
    private NoktaTalebi binis;
    private NoktaTalebi inis;
    private int koltukSayisi = 1;
    private String mesaj;
}
