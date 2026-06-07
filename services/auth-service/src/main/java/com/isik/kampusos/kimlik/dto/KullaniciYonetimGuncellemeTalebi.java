package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/** Sistem yöneticisi: kullanıcı bilgilerini ve rolünü güncelleme talebi. */
@Data
public class KullaniciYonetimGuncellemeTalebi {
    private String ad;
    private String soyad;
    private String roller;
    private String fakulte;
    private String bolum;
    private String durum;   // AKTIF, PASIF, MEZUN, ILISIGI_KESILMIS
}
