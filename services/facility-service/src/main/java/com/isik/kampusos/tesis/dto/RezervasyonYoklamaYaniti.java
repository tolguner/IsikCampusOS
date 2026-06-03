package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.RezervasyonYoklama;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RezervasyonYoklamaYaniti {
    private String id;
    private String rezervasyonId;
    private String kullaniciId;
    private OffsetDateTime yoklamaTarihi;
    private String yontem;
    private String kanitDosyaId;
    private String durum;

    public static RezervasyonYoklamaYaniti from(RezervasyonYoklama yoklama) {
        if (yoklama == null) return null;
        return RezervasyonYoklamaYaniti.builder()
                .id(yoklama.getId())
                .rezervasyonId(yoklama.getRezervasyon().getId())
                .kullaniciId(yoklama.getKullaniciId())
                .yoklamaTarihi(yoklama.getYoklamaTarihi())
                .yontem(yoklama.getYontem().name())
                .kanitDosyaId(yoklama.getKanitDosyaId())
                .durum(yoklama.getDurum().name())
                .build();
    }
}
