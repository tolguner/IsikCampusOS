package com.isik.kampusos.yemek.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.yemek.model.Siparis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Sipariş durum değişimlerinde müşteriye bildirim üretir ({@code bildirim.olustur} Kafka olayı).
 * notification-service olayı kalıcılaştırır ve SSE ile anlık iletir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimYayinlayici {

    private static final String TOPIC = "bildirim.olustur";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    /** Sipariş durum değişimini müşteriye anlık bildirir. */
    public void siparisDurumBildir(Siparis siparis, String saticiAdi, String baslik, String mesaj) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur("SIPARIS_DURUMU")
                .hedefKitle("KULLANICI")
                .aliciKullaniciId(siparis.getMusteriKullaniciId())
                .baglantiUrl("/yemek/siparislerim")
                .baglantiEtiketi("Siparişi görüntüle")
                .olusturanAdi(saticiAdi)
                .build());
    }

    /** İşletme tarafındaki bir kullanıcıya (sahip/personel) sipariş olayı bildirir. */
    public void isletmeyeBildir(String aliciKullaniciId, String baslik, String mesaj, String olusturanAdi) {
        yayinla(BildirimOlayi.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur("SIPARIS_DURUMU")
                .hedefKitle("KULLANICI")
                .aliciKullaniciId(aliciKullaniciId)
                .baglantiUrl("/")
                .baglantiEtiketi("İşletme paneli")
                .olusturanAdi(olusturanAdi)
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
