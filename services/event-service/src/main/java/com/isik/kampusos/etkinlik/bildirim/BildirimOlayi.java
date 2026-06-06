package com.isik.kampusos.etkinlik.bildirim;

import lombok.Builder;
import lombok.Data;

/**
 * {@code bildirim.olustur} Kafka olayının payload modeli (üretici tarafı).
 * Bildirimin tüm içeriği burada hazırlanır; notification-service yalnızca persist eder.
 */
@Data
@Builder
public class BildirimOlayi {
    private String baslik;
    private String mesaj;
    private String tur;
    private String hedefKitle;
    private String aliciKullaniciId;
    private String ilgiliEtkinlikId;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    private String olusturan;
    private String olusturanAdi;
}
