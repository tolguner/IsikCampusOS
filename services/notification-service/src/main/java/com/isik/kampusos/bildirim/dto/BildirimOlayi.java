package com.isik.kampusos.bildirim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * {@code bildirim.olustur} Kafka olayının payload modeli.
 * Üretici (club-service) bildirimin tüm içeriğini hazırlar; bu servis yalnızca persist eder.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
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
