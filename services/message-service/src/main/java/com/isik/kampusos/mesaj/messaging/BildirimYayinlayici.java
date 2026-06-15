package com.isik.kampusos.mesaj.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Yeni mesajda alıcıya bildirim üretir ({@code bildirim.olustur} Kafka olayı) — kullanıcı o ekranda
 * değilse zil/rozet için. notification-service olayı kalıcılaştırır ve SSE ile iletir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimYayinlayici {

    private static final String TOPIC = "bildirim.olustur";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void mesajBildir(String aliciKullaniciId, String gonderenAdi, String ozet) {
        yayinla(BildirimOlayi.builder()
                .baslik("Yeni mesaj")
                .mesaj((gonderenAdi == null || gonderenAdi.isBlank() ? "Bir kullanıcı" : gonderenAdi) + ": " + ozet)
                .tur("MESAJ")
                .hedefKitle("KULLANICI")
                .aliciKullaniciId(aliciKullaniciId)
                .baglantiUrl("/mesajlar")
                .baglantiEtiketi("Mesajlar")
                .olusturanAdi(gonderenAdi)
                .build());
    }

    private void yayinla(BildirimOlayi olay) {
        try {
            kafkaTemplate.send(TOPIC, objectMapper.writeValueAsString(olay));
        } catch (Exception e) {
            log.warn("bildirim.olustur olayı gönderilemedi: {}", e.getMessage());
        }
    }
}
