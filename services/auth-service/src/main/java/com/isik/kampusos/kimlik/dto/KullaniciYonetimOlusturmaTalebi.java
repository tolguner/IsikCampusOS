package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/** Sistem yöneticisi: herhangi bir rolde yeni kullanıcı oluşturma talebi. */
@Data
public class KullaniciYonetimOlusturmaTalebi {
    private String eposta;
    private String roller;          // örn. ROLE_SKS_ADMIN, ROLE_FACILITY_ADMIN, ROLE_REGISTRAR, ROLE_ADMIN, ROLE_STUDENT
    private String ad;
    private String soyad;
    private String fakulte;
    private String bolum;
    private String geciciSifre;     // opsiyonel; boşsa sistem bir geçici şifre üretir ve yanıtta döndürür
}
