package com.isik.kampusos.etkinlik.dto;

import lombok.Data;

@Data
public class KulupProfilGuncellemeTalebi {
    private String ad;
    private String kisaAciklama;
    private String vizyon;
    private String aciklama;
    private String logoUrl;
    private String yoneticiKullaniciId;
    private String baskanAdSoyad;
    private String baskanEposta;
    private String danismanAkademikKadroId;
    private String danismanUnvani;
    private String danismanAdSoyad;
    private String danismanEposta;
    private String danismanBolumu;
    private boolean onayGerektirir;
}
