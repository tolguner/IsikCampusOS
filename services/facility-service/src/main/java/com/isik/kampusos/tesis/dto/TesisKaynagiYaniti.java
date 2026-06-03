package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TesisKaynagiYaniti {
    private String id;
    private String tesisId;
    private String kaynakKodu;
    private String ad;
    private String kaynakTuru;
    private int kapasite;
    private boolean rezervasyonYapilabilir;
    private String durum;
    private List<KullanilabilirlikKuraliYaniti> kullanimKurallari;

    public static TesisKaynagiYaniti from(TesisKaynagi kaynak, List<TesisKullanilabilirlikKurali> kurallar) {
        if (kaynak == null) return null;
        return TesisKaynagiYaniti.builder()
                .id(kaynak.getId())
                .tesisId(kaynak.getTesis().getId())
                .kaynakKodu(kaynak.getKaynakKodu())
                .ad(kaynak.getAd())
                .kaynakTuru(kaynak.getKaynakTuru().name())
                .kapasite(kaynak.getKapasite())
                .rezervasyonYapilabilir(kaynak.isRezervasyonYapilabilir())
                .durum(kaynak.getDurum().name())
                .kullanimKurallari(kurallar == null ? List.of() : kurallar.stream().map(KullanilabilirlikKuraliYaniti::from).toList())
                .build();
    }
}
