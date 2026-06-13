package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/**
 * Sistem yöneticisi: kullanıcı bilgilerini güncelleme talebi.
 * TC ve ROL değiştirilemez (rol oluşturma yetkisi rol-sahibi panellere aittir).
 */
@Data
public class KullaniciYonetimGuncellemeTalebi {
    private String ad;
    private String soyad;
    private String eposta;
    private String birim;
    private String telefon;
    private String ikametAdresi;
    private String kanGrubu;
    private String durum;   // AKTIF, PASIF (personel); MEZUN/ILISIGI_KESILMIS öğrenciye özgü
}
