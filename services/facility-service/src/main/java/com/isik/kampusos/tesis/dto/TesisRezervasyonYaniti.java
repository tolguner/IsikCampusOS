package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.TesisRezervasyon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TesisRezervasyonYaniti {
    private String id;
    private String kaynakId;
    private String kaynakAd;
    private String tesisId;
    private String tesisAd;
    private String rezervasyonYapanKullaniciId;
    private OffsetDateTime baslangicTarihi;
    private OffsetDateTime bitisTarihi;
    private String amac;
    private int katilimciSayisi;
    private String durum;
    private OffsetDateTime iptalEdilmeTarihi;
    private String iptalNedeni;
    private OffsetDateTime gelmemeTarihi;
    private RezervasyonYoklamaYaniti yoklama;

    public static TesisRezervasyonYaniti from(TesisRezervasyon rezervasyon, RezervasyonYoklamaYaniti yoklamaYaniti) {
        if (rezervasyon == null) return null;
        return TesisRezervasyonYaniti.builder()
                .id(rezervasyon.getId())
                .kaynakId(rezervasyon.getKaynak().getId())
                .kaynakAd(rezervasyon.getKaynak().getAd())
                .tesisId(rezervasyon.getKaynak().getTesis().getId())
                .tesisAd(rezervasyon.getKaynak().getTesis().getAd())
                .rezervasyonYapanKullaniciId(rezervasyon.getRezervasyonYapanKullaniciId())
                .baslangicTarihi(rezervasyon.getBaslangicTarihi())
                .bitisTarihi(rezervasyon.getBitisTarihi())
                .amac(rezervasyon.getAmac())
                .katilimciSayisi(rezervasyon.getKatilimciSayisi())
                .durum(rezervasyon.getDurum().name())
                .iptalEdilmeTarihi(rezervasyon.getIptalEdilmeTarihi())
                .iptalNedeni(rezervasyon.getIptalNedeni())
                .gelmemeTarihi(rezervasyon.getGelmemeTarihi())
                .yoklama(yoklamaYaniti)
                .build();
    }
}
