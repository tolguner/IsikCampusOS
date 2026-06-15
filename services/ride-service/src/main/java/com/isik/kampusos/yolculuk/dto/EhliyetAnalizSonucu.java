package com.isik.kampusos.yolculuk.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ehliyet görselinin görüntü-AI analiz sonucu. {@code analizYapildi=false} ise
 * (anahtar yok / API erişilemedi) alanlar boş döner ve istemci elle girişe düşer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhliyetAnalizSonucu {
    /** Görselin bir sürücü belgesi (ehliyet) olduğu tespit edildi mi? */
    private boolean ehliyet;
    private String sinif;
    private String ehliyetNo;
    private String verilisTarihi;     // ISO yyyy-MM-dd (model çıktısı)
    private String gecerlilikTarihi;  // ISO yyyy-MM-dd
    /** Analiz gerçekten çalıştı mı (anahtar var + yanıt alındı)? */
    private boolean analizYapildi;
    private String mesaj;

    public static EhliyetAnalizSonucu devreDisi(String mesaj) {
        return new EhliyetAnalizSonucu(false, null, null, null, null, false, mesaj);
    }
}
