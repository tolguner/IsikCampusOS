package com.isik.kampusos.tesis.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Tesis rezervasyon onay akışında bildirim üretir ({@code bildirim.olustur} Kafka olayı).
 * notification-service olayı kalıcılaştırır ve SSE ile anlık iletir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimYayinlayici {

    private static final String TOPIC = "bildirim.olustur";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    /** Onay gerektiren yeni rezervasyon talebini Spor Müdürlüğü'ne (tesis yöneticileri) bildirir. */
    public void yeniTalepBildir(String tesisAd, String tarihMetni) {
        yayinla(BildirimOlayi.builder()
                .baslik("Yeni rezervasyon talebi")
                .mesaj(tesisAd + " için onay bekleyen yeni bir rezervasyon talebi var" + (tarihMetni != null ? " (" + tarihMetni + ")." : "."))
                .tur("REZERVASYON_TALEBI")
                .hedefKitle("TESIS_YONETICILERI")
                .baglantiUrl("/tesis-yonetim")
                .baglantiEtiketi("Talepleri görüntüle")
                .olusturanAdi("Spor Tesisleri")
                .build());
    }

    /** Rezervasyon onay/red sonucunu rezervasyonu yapan öğrenciye bildirir. */
    public void ogrenciyeSonucBildir(String aliciKullaniciId, String baslik, String mesaj) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur("REZERVASYON_DURUMU")
                .hedefKitle("KULLANICI")
                .aliciKullaniciId(aliciKullaniciId)
                .baglantiUrl("/rezervasyonlarim")
                .baglantiEtiketi("Rezervasyonlarım")
                .olusturanAdi("Spor Müdürlüğü")
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
