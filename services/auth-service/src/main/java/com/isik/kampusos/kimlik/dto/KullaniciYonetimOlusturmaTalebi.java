package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/** Sistem yöneticisi: idari personel kullanıcısı oluşturma talebi (öğrenci/işletme personeli hariç). */
@Data
public class KullaniciYonetimOlusturmaTalebi {
    private String eposta;
    private String roller;          // ROLE_SKS_ADMIN, ROLE_FACILITY_ADMIN, ROLE_REGISTRAR, ROLE_ADMIN, ROLE_VENDOR_ADMIN, ROLE_RIDE_ADMIN
    private String ad;
    private String soyad;
    private String birim;           // Çalıştığı birim (fakülte/bölüm yerine)
    private String telefon;
    private String ikametAdresi;
    private String kanGrubu;
    private String tcKimlikNo;      // ZORUNLU: 11 hane. Varsayılan şifre = TC.
}
