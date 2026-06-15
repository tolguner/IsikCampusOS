package com.isik.kampusos.mesaj.messaging;

import lombok.Builder;
import lombok.Data;

/** {@code bildirim.olustur} Kafka olayının payload modeli (notification-service ile uyumlu). */
@Data
@Builder
public class BildirimOlayi {
    private String baslik;
    private String mesaj;
    private String tur;
    private String hedefKitle;
    private String aliciKullaniciId;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String olusturanAdi;
}
