package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class KullanilabilirlikKuraliYaniti {
    private String id;
    private int haftaninGunu;
    private LocalTime baslangicSaati;
    private LocalTime bitisSaati;
    private LocalDate gecerlilikBaslangici;
    private LocalDate gecerlilikBitisi;
    private String durum;

    public static KullanilabilirlikKuraliYaniti from(TesisKullanilabilirlikKurali kural) {
        if (kural == null) return null;
        return KullanilabilirlikKuraliYaniti.builder()
                .id(kural.getId())
                .haftaninGunu(kural.getHaftaninGunu())
                .baslangicSaati(kural.getBaslangicSaati())
                .bitisSaati(kural.getBitisSaati())
                .gecerlilikBaslangici(kural.getGecerlilikBaslangici())
                .gecerlilikBitisi(kural.getGecerlilikBitisi())
                .durum(kural.getDurum().name())
                .build();
    }
}
