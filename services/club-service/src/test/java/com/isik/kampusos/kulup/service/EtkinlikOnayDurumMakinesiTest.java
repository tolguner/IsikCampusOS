package com.isik.kampusos.kulup.service;

import com.isik.kampusos.kulup.dto.EtkinlikGeriBildirimTalebi;
import com.isik.kampusos.kulup.model.Etkinlik;
import com.isik.kampusos.kulup.repository.EtkinlikDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Etkinlik onay/revizyon durum makinesinin guard kurallarını doğrular.
 * Geçersiz durum geçişleri reddedilmeli (ResponseStatusException).
 * Mockito birim testi — DB/Spring bağlamı yok; sadece guard mantığı sınanır.
 */
@ExtendWith(MockitoExtension.class)
class EtkinlikOnayDurumMakinesiTest {

    @Mock private EtkinlikDeposu etkinlikDeposu;
    @Mock private com.isik.kampusos.kulup.repository.EtkinlikDegisiklikIstegiDeposu etkinlikDegisiklikIstegiDeposu;
    @Mock private com.isik.kampusos.kulup.repository.KulupDeposu kulupDeposu;
    @Mock private com.isik.kampusos.kulup.repository.KulupUyesiDeposu kulupUyesiDeposu;
    @Mock private com.isik.kampusos.kulup.repository.EtkinlikKatilimiDeposu etkinlikKatilimiDeposu;
    @Mock private org.springframework.kafka.core.KafkaTemplate<String, String> kafkaTemplate;
    @Mock private com.isik.kampusos.kulup.bildirim.BildirimYayinlayici bildirimYayinlayici;
    @Mock private DenetimGunluguServisi denetimGunluguServisi;

    @InjectMocks private EtkinlikServisi etkinlikServisi;

    private Etkinlik etkinlikDurumda(Etkinlik.EtkinlikDurumu durum) {
        return Etkinlik.builder()
                .id("etk-1")
                .baslik("Test Etkinliği")
                .durum(durum)
                .baslangicTarihi(LocalDateTime.now().plusDays(3))
                .bitisTarihi(LocalDateTime.now().plusDays(3).plusHours(2))
                .build();
    }

    @Test
    void onayBeklemeyenEtkinlikOnaylanamaz() {
        when(etkinlikDeposu.findById("etk-1"))
                .thenReturn(Optional.of(etkinlikDurumda(Etkinlik.EtkinlikDurumu.YAYINLANDI)));

        assertThatThrownBy(() -> etkinlikServisi.etkinlikOnayla("admin-1", "etk-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("onay bekleyen durumda değil");
    }

    @Test
    void bulunamayanEtkinlikOnaylanamaz() {
        when(etkinlikDeposu.findById("yok")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> etkinlikServisi.etkinlikOnayla("admin-1", "yok"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("bulunamadı");
    }

    @Test
    void incelemeBeklemeyenEtkinlikIcinRevizyonIstenemez() {
        when(etkinlikDeposu.findById("etk-1"))
                .thenReturn(Optional.of(etkinlikDurumda(Etkinlik.EtkinlikDurumu.TASLAK)));

        EtkinlikGeriBildirimTalebi talep = new EtkinlikGeriBildirimTalebi();
        talep.setGeriBildirim("Lütfen düzeltin");

        assertThatThrownBy(() -> etkinlikServisi.revizyonTalepEt("admin-1", "etk-1", talep))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("incelemesi bekleyen durumda değil");
    }

    @Test
    void bosGeriBildirimleRevizyonIstenemez() {
        lenient().when(etkinlikDeposu.findById("etk-1"))
                .thenReturn(Optional.of(etkinlikDurumda(Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR)));

        EtkinlikGeriBildirimTalebi talep = new EtkinlikGeriBildirimTalebi();
        talep.setGeriBildirim("   ");

        assertThatThrownBy(() -> etkinlikServisi.revizyonTalepEt("admin-1", "etk-1", talep))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Geri bildirim gereklidir");
    }

    @Test
    void gecmisteKalanOnayBekleyenEtkinlikYayinlanamaz() {
        Etkinlik gecmis = Etkinlik.builder()
                .id("etk-1")
                .baslik("Geçmiş")
                .durum(Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR)
                .baslangicTarihi(LocalDateTime.now().minusDays(5))
                .bitisTarihi(LocalDateTime.now().minusDays(5).plusHours(2))
                .build();
        when(etkinlikDeposu.findById("etk-1")).thenReturn(Optional.of(gecmis));

        assertThatThrownBy(() -> etkinlikServisi.etkinlikOnayla("admin-1", "etk-1"))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(gecmis.getDurum()).isEqualTo(Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR);
    }
}
