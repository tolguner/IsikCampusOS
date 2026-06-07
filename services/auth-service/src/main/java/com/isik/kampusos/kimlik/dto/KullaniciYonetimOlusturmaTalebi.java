package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/** Sistem yöneticisi: herhangi bir rolde yeni kullanıcı oluşturma talebi. */
@Data
public class KullaniciYonetimOlusturmaTalebi {
    private String eposta;
    private String roller;          // ROLE_SKS_ADMIN, ROLE_FACILITY_ADMIN, ROLE_REGISTRAR, ROLE_ADMIN (öğrenci hariç)
    private String ad;
    private String soyad;
    private String fakulte;
    private String bolum;
    private String tcKimlikNo;      // ZORUNLU: 11 hane. Varsayılan şifre = TC; şifre sıfırlama TC ile çalışır.
}
