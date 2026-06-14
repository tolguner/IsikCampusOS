package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.Tesis;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TesisYaniti {
    private String id;
    private String ad;
    private String tesisTuru;
    private String aciklama;
    private String konumMetni;
    private Double enlem;
    private Double boylam;
    private int kapasite;
    private String durum;
    private TesisPolitikasiYaniti politika;
    private List<TesisKaynagiYaniti> kaynaklar;

    public static TesisYaniti from(Tesis tesis,
                                   TesisPolitikasiYaniti politikaYaniti,
                                   List<TesisKaynagiYaniti> kaynakYanitlari) {
        if (tesis == null) return null;
        return TesisYaniti.builder()
                .id(tesis.getId())
                .ad(tesis.getAd())
                .tesisTuru(tesis.getTesisTuru() != null ? tesis.getTesisTuru().name() : null)
                .aciklama(tesis.getAciklama())
                .konumMetni(tesis.getKonumMetni())
                .enlem(tesis.getEnlem())
                .boylam(tesis.getBoylam())
                .kapasite(tesis.getKapasite())
                .durum(tesis.getDurum().name())
                .politika(politikaYaniti)
                .kaynaklar(kaynakYanitlari)
                .build();
    }
}
