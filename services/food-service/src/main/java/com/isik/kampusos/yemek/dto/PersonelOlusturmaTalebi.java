package com.isik.kampusos.yemek.dto;

import lombok.Data;

/** İşletme sahibinin yeni personel eklerken gönderdiği bilgiler. */
@Data
public class PersonelOlusturmaTalebi {
    private String ad;
    private String soyad;
    private String eposta;
    private String tcKimlikNo;   // 11 hane; auth tarafında varsayılan şifre olur.
    private String rol;          // PERSONEL (varsayılan) | KURYE
}
