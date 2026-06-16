package com.isik.kampusos.kulup.service;

import com.isik.kampusos.kulup.bildirim.BildirimYayinlayici;
import com.isik.kampusos.kulup.model.Etkinlik;
import com.isik.kampusos.kulup.model.EtkinlikKatilimi;
import com.isik.kampusos.kulup.repository.EtkinlikDeposu;
import com.isik.kampusos.kulup.repository.EtkinlikKatilimiDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EtkinlikKatilimServisiTest {

    @Mock private EtkinlikDeposu etkinlikDeposu;
    @Mock private EtkinlikKatilimiDeposu etkinlikKatilimiDeposu;
    @Mock private KafkaTemplate<String, String> kafkaTemplate;
    @Mock private BildirimYayinlayici bildirimYayinlayici;
    @Mock private DenetimGunluguServisi denetimGunluguServisi;

    @InjectMocks private EtkinlikKatilimServisi etkinlikKatilimServisi;

    @Test
    void kontenjanDoluAmaYedekListedeYerVarsaKatilimYedekteOlusturulur() {
        Etkinlik etkinlik = yayinlanmisEtkinlik()
                .kontenjanSiniriVar(true)
                .kontenjan(2)
                .mevcutRsvpSayisi(2)
                .yedekListesiSiniriVar(true)
                .yedekListesiKontenjani(3)
                .mevcutYedekSayisi(1)
                .build();
        when(etkinlikDeposu.findById("etk-1")).thenReturn(Optional.of(etkinlik));
        when(etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId("etk-1", "ogrenci-1"))
                .thenReturn(Optional.empty());
        when(etkinlikKatilimiDeposu.save(any(EtkinlikKatilimi.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EtkinlikKatilimi kayit = etkinlikKatilimServisi.katilimOlustur("ogrenci-1", "etk-1");

        assertThat(kayit.getDurum()).isEqualTo(EtkinlikKatilimi.KatilimDurumu.YEDEKTE);
        assertThat(etkinlik.getMevcutRsvpSayisi()).isEqualTo(2);
        assertThat(etkinlik.getMevcutYedekSayisi()).isEqualTo(2);
        verify(etkinlikDeposu).save(etkinlik);
    }

    @Test
    void kontenjanVeYedekListeDoluysaKatilimReddedilir() {
        Etkinlik etkinlik = yayinlanmisEtkinlik()
                .kontenjanSiniriVar(true)
                .kontenjan(2)
                .mevcutRsvpSayisi(2)
                .yedekListesiSiniriVar(true)
                .yedekListesiKontenjani(1)
                .mevcutYedekSayisi(1)
                .build();
        when(etkinlikDeposu.findById("etk-1")).thenReturn(Optional.of(etkinlik));
        when(etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId("etk-1", "ogrenci-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> etkinlikKatilimServisi.katilimOlustur("ogrenci-1", "etk-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("kontenjan");

        verify(etkinlikDeposu, never()).save(any());
        verify(etkinlikKatilimiDeposu, never()).save(any());
    }

    @Test
    void ucretliEtkinlikteIlkKatilimOdemeBekliyorOlur() {
        Etkinlik etkinlik = yayinlanmisEtkinlik()
                .kontenjanSiniriVar(true)
                .kontenjan(2)
                .mevcutRsvpSayisi(1)
                .ucretli(true)
                .build();
        when(etkinlikDeposu.findById("etk-1")).thenReturn(Optional.of(etkinlik));
        when(etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId("etk-1", "ogrenci-1"))
                .thenReturn(Optional.empty());
        when(etkinlikKatilimiDeposu.save(any(EtkinlikKatilimi.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EtkinlikKatilimi kayit = etkinlikKatilimServisi.katilimOlustur("ogrenci-1", "etk-1");

        assertThat(kayit.getDurum()).isEqualTo(EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR);
        assertThat(kayit.getYoklamaBelirteci()).isNull();
        assertThat(etkinlik.getMevcutRsvpSayisi()).isEqualTo(2);
    }

    @Test
    void anaListedenIptaldeIlkYedekKatilimAnaListeyeYukseltilir() {
        Etkinlik etkinlik = yayinlanmisEtkinlik()
                .kontenjanSiniriVar(true)
                .kontenjan(2)
                .mevcutRsvpSayisi(2)
                .mevcutYedekSayisi(1)
                .build();
        EtkinlikKatilimi iptalEdilen = EtkinlikKatilimi.builder()
                .etkinlikId("etk-1")
                .kullaniciId("ogrenci-1")
                .durum(EtkinlikKatilimi.KatilimDurumu.ONAYLANDI)
                .build();
        EtkinlikKatilimi yedek = EtkinlikKatilimi.builder()
                .etkinlikId("etk-1")
                .kullaniciId("ogrenci-2")
                .durum(EtkinlikKatilimi.KatilimDurumu.YEDEKTE)
                .build();
        when(etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId("etk-1", "ogrenci-1"))
                .thenReturn(Optional.of(iptalEdilen));
        when(etkinlikDeposu.findById("etk-1")).thenReturn(Optional.of(etkinlik));
        when(etkinlikKatilimiDeposu.findByEtkinlikIdAndDurumOrderByOlusturulmaTarihiAsc(
                "etk-1",
                EtkinlikKatilimi.KatilimDurumu.YEDEKTE
        )).thenReturn(List.of(yedek));
        when(etkinlikKatilimiDeposu.save(any(EtkinlikKatilimi.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EtkinlikKatilimi kayit = etkinlikKatilimServisi.katilimiIptalEt("ogrenci-1", "etk-1");

        assertThat(kayit.getDurum()).isEqualTo(EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI);
        assertThat(yedek.getDurum()).isEqualTo(EtkinlikKatilimi.KatilimDurumu.ONAYLANDI);
        assertThat(yedek.getYoklamaBelirteci()).isNotBlank();
        assertThat(etkinlik.getMevcutRsvpSayisi()).isEqualTo(2);
        assertThat(etkinlik.getMevcutYedekSayisi()).isZero();
        verify(etkinlikKatilimiDeposu).save(yedek);
    }

    private Etkinlik.EtkinlikBuilder yayinlanmisEtkinlik() {
        return Etkinlik.builder()
                .id("etk-1")
                .baslik("Kampus etkinligi")
                .durum(Etkinlik.EtkinlikDurumu.YAYINLANDI);
    }
}
