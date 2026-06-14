package com.isik.kampusos.yemek.dto;

import com.isik.kampusos.yemek.model.SaticiDegisiklikIstegi;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SaticiDegisiklikIstegiYaniti {
    private String id;
    private String saticiId;
    private String saticiAdi;
    private String grupId;
    private String alanAdi;
    private String mevcutDeger;
    private String talepEdilenDeger;
    private String durum;
    private String geriBildirim;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime incelemeTarihi;

    public static SaticiDegisiklikIstegiYaniti of(SaticiDegisiklikIstegi i, String saticiAdi) {
        return SaticiDegisiklikIstegiYaniti.builder()
                .id(i.getId())
                .saticiId(i.getSaticiId())
                .saticiAdi(saticiAdi)
                .grupId(i.getGrupId())
                .alanAdi(i.getAlanAdi())
                .mevcutDeger(i.getMevcutDeger())
                .talepEdilenDeger(i.getTalepEdilenDeger())
                .durum(i.getDurum().name())
                .geriBildirim(i.getGeriBildirim())
                .olusturulmaTarihi(i.getOlusturulmaTarihi())
                .incelemeTarihi(i.getIncelemeTarihi())
                .build();
    }
}
