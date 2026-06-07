package com.isik.kampusos.bildirim.dto;

import lombok.Data;

/** İdari rollerin tüm öğrencilere gönderdiği toplu duyuru talebi. */
@Data
public class OgrenciDuyuruTalebi {
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
}
