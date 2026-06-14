package com.isik.kampusos.yemek.dto;

import lombok.Data;

/** Sistem yöneticisinin satıcı oluşturması/güncellemesi. */
@Data
public class SaticiOlusturmaTalebi {
    private String ad;
    private String yoneticiKullaniciId;   // ROLE_VENDOR_ADMIN kullanıcısı
    private String konumMetni;
    private Double enlem;                  // harita konumu (opsiyonel)
    private Double boylam;
    private String aciklama;
    private String logoUrl;
    private String durum;                 // AKTIF | PASIF (güncellemede)
}
