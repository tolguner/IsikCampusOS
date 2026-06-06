package com.isik.kampusos.bildirim.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.bildirim.dto.BildirimOlayi;
import com.isik.kampusos.bildirim.service.BildirimServisi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * {@code bildirim.olustur} olaylarını tüketip bildirim olarak kalıcılaştırır.
 * Üretici: event-service (etkinlik/kulüp iş akışları + SKS duyuruları).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BildirimOlayTuketicisi {

    private final ObjectMapper objectMapper;
    private final BildirimServisi bildirimServisi;

    @KafkaListener(topics = "bildirim.olustur", groupId = "bildirim-servisi-grubu")
    public void consumeBildirimOlustur(String mesaj) {
        try {
            BildirimOlayi olay = objectMapper.readValue(mesaj, BildirimOlayi.class);
            if (olay.getBaslik() == null || olay.getMesaj() == null) {
                log.warn("Geçersiz bildirim olayı (baslik/mesaj boş), atlanıyor: {}", mesaj);
                return;
            }
            bildirimServisi.olaydanOlustur(olay);
        } catch (Exception e) {
            log.error("bildirim.olustur olayı işlenirken hata oluştu: {}", mesaj, e);
        }
    }
}
