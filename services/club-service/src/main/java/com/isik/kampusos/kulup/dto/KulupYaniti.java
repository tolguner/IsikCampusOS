package com.isik.kampusos.kulup.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KulupYaniti {
    private String id;
    private String ad;
    private String kisaAciklama;
    private String vizyon;
    private String aciklama;
    private String yoneticiKullaniciId;
    private String baskanAdSoyad;
    private String baskanEposta;
    private String logoUrl;
    private String danismanAkademikKadroId;
    private String danismanUnvani;
    private String danismanAdSoyad;
    private String danismanEposta;
    private String danismanBolumu;
    private boolean aktif;
    private boolean onayGerektirir;
    private long uyeSayisi;
    private long etkinlikSayisi;
    private boolean mevcutKullaniciUyeMi;
    private String mevcutKullaniciRol;
    private String mevcutKullaniciDurum;
}
