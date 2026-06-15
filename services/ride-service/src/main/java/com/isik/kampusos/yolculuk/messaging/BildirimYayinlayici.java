package com.isik.kampusos.yolculuk.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * CampusRide olaylarında (ör. ilan iptali) ilgili kullanıcıya bildirim üretir
 * ({@code bildirim.olustur} Kafka olayı). notification-service olayı kalıcılaştırır ve SSE ile iletir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimYayinlayici {

    private static final String TOPIC = "bildirim.olustur";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    /** Tek bir kullanıcıya (yolcuya) anlık bildirim gönderir. */
    public void kullaniciyaBildir(String aliciKullaniciId, String baslik, String mesaj) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur("YOLCULUK")
                .hedefKitle("KULLANICI")
                .aliciKullaniciId(aliciKullaniciId)
                .baglantiUrl("/campusride")
                .baglantiEtiketi("CampusRide")
                .olusturanAdi("CampusRide")
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
