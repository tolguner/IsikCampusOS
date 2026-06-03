package com.isik.kampusos.profil.messaging.consumer;
 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.profil.dto.KullaniciKayitOlayi;
import com.isik.kampusos.profil.model.Profil;
import com.isik.kampusos.profil.repository.ProfilDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
 
@Service
@RequiredArgsConstructor
@Slf4j
public class KullaniciOlayTuketicisi {
 
    private final ProfilDeposu profilDeposu;
    private final ObjectMapper objectMapper;
 
    @KafkaListener(topics = "kullanici.kaydedildi", groupId = "profil-servisi-grubu")
    public void consumeKullaniciKaydi(String mesaj) {
        log.info("kullanici.kaydedildi olayı alındı: {}", mesaj);
        try {
            KullaniciKayitOlayi olay = objectMapper.readValue(mesaj, KullaniciKayitOlayi.class);
 
            // Idempotency
            if (profilDeposu.findByKullaniciId(olay.getKullaniciId()).isEmpty()) {
                Profil profil = Profil.builder()
                        .kullaniciId(olay.getKullaniciId())
                        .eposta(olay.getEposta())
                        .ad(olay.getAd())
                        .soyad(olay.getSoyad())
                        .tcKimlikMaskeli(olay.getTcKimlikMaskeli())
                        .telefonNumarasi(olay.getTelefonNumarasi())
                        .ikametAdresi(olay.getIkametAdresi())
                        .kanGrubu(olay.getKanGrubu())
                        .build();
                profilDeposu.save(profil);
                log.info("Kullanıcı için profil oluşturuldu. Kullanıcı ID: {} ({} {})",
                        olay.getKullaniciId(), olay.getAd(), olay.getSoyad());
            } else {
                log.info("Kullanıcı için profil zaten mevcut: {}, atlanıyor.", olay.getKullaniciId());
            }
        } catch (Exception e) {
            log.error("kullanici.kaydedildi olayı işlenirken hata oluştu: {}", mesaj, e);
        }
    }
 
    @KafkaListener(topics = "kullanici.silindi", groupId = "profil-servisi-silme-grubu")
    public void consumeKullaniciSilme(String mesaj) {
        log.info("kullanici.silindi olayı alındı: {}", mesaj);
        try {
            java.util.Map<?, ?> olay = objectMapper.readValue(mesaj, java.util.Map.class);
            String kullaniciId = (String) olay.get("kullaniciId");
            if (kullaniciId != null && !kullaniciId.isBlank()) {
                profilDeposu.deleteByKullaniciId(kullaniciId);
                log.info("Kullanıcı profili silindi. Kullanıcı ID: {}", kullaniciId);
            }
        } catch (Exception e) {
            log.error("kullanici.silindi olayı işlenirken hata oluştu: {}", mesaj, e);
        }
    }
}
