package com.isik.kampusos.yemek.dto;

import com.isik.kampusos.yemek.model.IsletmePersoneli;
import lombok.Builder;
import lombok.Data;

/** İşletme sahibine dönen personel görünümü. */
@Data
@Builder
public class PersonelYaniti {
    private String kullaniciId;
    private String ad;
    private String eposta;
    private String durum;

    public static PersonelYaniti of(IsletmePersoneli p) {
        return PersonelYaniti.builder()
                .kullaniciId(p.getKullaniciId())
                .ad(p.getAd())
                .eposta(p.getEposta())
                .durum(p.getDurum() != null ? p.getDurum().name() : null)
                .build();
    }
}
