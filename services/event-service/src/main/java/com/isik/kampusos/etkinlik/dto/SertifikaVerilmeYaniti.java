package com.isik.kampusos.etkinlik.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SertifikaVerilmeYaniti {
    private String etkinlikId;
    private int uygunKatilimciSayisi;
    private int verilenSertifikaSayisi;
}
