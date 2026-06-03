package com.isik.kampusos.tesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RezervasyonYoklamaTalebi {
    private String yontem;
    private String kanitDosyaId;
}
