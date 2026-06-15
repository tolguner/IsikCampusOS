package com.isik.kampusos.bildirim.dto;

import lombok.Data;

import java.util.List;

/**
 * Destek Hizmetleri Müdürlüğü toplu duyuru talebi — birden çok hedef kitle seçilebilir.
 * Geçerli kitleler: TUM_OGRENCILER, ISLETME_YONETICILERI, ISLETME_PERSONELLERI.
 */
@Data
public class DestekDuyuruTalebi {
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    private List<String> hedefKitleler;
}
