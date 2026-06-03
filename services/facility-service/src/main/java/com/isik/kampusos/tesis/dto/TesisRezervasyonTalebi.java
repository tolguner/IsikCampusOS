package com.isik.kampusos.tesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TesisRezervasyonTalebi {
    private String kaynakId;
    private OffsetDateTime baslangicTarihi;
    private OffsetDateTime bitisTarihi;
    private String amac;
    private int katilimciSayisi;
}
