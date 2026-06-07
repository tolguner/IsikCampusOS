package com.isik.kampusos.bildirim.dto;

import lombok.Data;

/** İdari rollerin gönderdiği toplu duyuru talebi. */
@Data
public class OgrenciDuyuruTalebi {
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    /** TUM_OGRENCILER (varsayılan) veya TUM_KULLANICILAR (yalnızca sistem yöneticisi). */
    private String hedefKitle;
}
