package com.isik.kampusos.kimlik.dto;

import lombok.Data;

/**
 * İşletme sahibi tarafından eklenen personel (ROLE_VENDOR_STAFF) için hesap oluşturma talebi.
 * food-service köprüsü çağırır. Varsayılan şifre = TC.
 */
@Data
public class IsletmePersoneliOlusturmaTalebi {
    private String eposta;
    private String ad;
    private String soyad;
    private String tcKimlikNo;   // ZORUNLU: 11 hane.
}
