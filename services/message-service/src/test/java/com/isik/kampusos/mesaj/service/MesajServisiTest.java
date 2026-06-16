package com.isik.kampusos.mesaj.service;

import com.isik.kampusos.mesaj.messaging.BildirimYayinlayici;
import com.isik.kampusos.mesaj.messaging.MesajAkisYoneticisi;
import com.isik.kampusos.mesaj.model.Konusma;
import com.isik.kampusos.mesaj.model.Mesaj;
import com.isik.kampusos.mesaj.repository.KonusmaDeposu;
import com.isik.kampusos.mesaj.repository.MesajDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MesajServisiTest {

    @Mock
    private KonusmaDeposu konusmaDeposu;

    @Mock
    private MesajDeposu mesajDeposu;

    @Mock
    private KullaniciOzetIstemcisi kullaniciOzetIstemcisi;

    @Mock
    private MesajAkisYoneticisi akisYoneticisi;

    @Mock
    private BildirimYayinlayici bildirimYayinlayici;

    @InjectMocks
    private MesajServisi mesajServisi;

    @Test
    void katilimciOlmayanKullaniciBaglamKonusmasinaErisemez() {
        Konusma konusma = konusma("konusma-1", "FOOD", "siparis-1", Konusma.Durum.ACIK, "musteri-1", "satici-1");
        when(konusmaDeposu.findByModulAndBaglamId("FOOD", "siparis-1")).thenReturn(Optional.of(konusma));

        assertThatThrownBy(() -> mesajServisi.konusmaBaglamdan("yabanci-1", "FOOD", "siparis-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("katılımcısı değilsiniz");

        verifyNoInteractions(kullaniciOzetIstemcisi);
        verify(mesajDeposu, never()).countByKonusmaIdAndGondericiKullaniciIdNot(any(), any());
    }

    @Test
    void kapaliKonusmayaMesajGonderilemez() {
        Konusma konusma = konusma("konusma-1", "RIDE", "yolculuk-1", Konusma.Durum.KAPALI, "surucu-1", "yolcu-1");
        when(konusmaDeposu.findById("konusma-1")).thenReturn(Optional.of(konusma));

        assertThatThrownBy(() -> mesajServisi.mesajGonder("surucu-1", "konusma-1", "Geliyorum"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("konuşma kapalı");

        verify(mesajDeposu, never()).save(any());
        verifyNoInteractions(akisYoneticisi, bildirimYayinlayici);
    }

    @Test
    void mesajGonderirAlicilaraAkisVeBildirimYayinlar() {
        LocalDateTime mesajTarihi = LocalDateTime.of(2026, 6, 16, 10, 30);
        Konusma konusma = konusma("konusma-1", "FOOD", "siparis-1", Konusma.Durum.ACIK,
                "musteri-1", "satici-1", "personel-1");
        when(konusmaDeposu.findById("konusma-1")).thenReturn(Optional.of(konusma));
        when(mesajDeposu.save(any(Mesaj.class))).thenAnswer(invocation -> {
            Mesaj mesaj = invocation.getArgument(0);
            mesaj.setId("mesaj-1");
            mesaj.setOlusturulmaTarihi(mesajTarihi);
            return mesaj;
        });
        when(kullaniciOzetIstemcisi.ozetler(List.of("musteri-1"))).thenReturn(Map.of(
                "musteri-1", new KullaniciOzetIstemcisi.KullaniciOzeti(
                        "musteri-1", "Ayse", "Isik", null, null, null)
        ));

        Mesaj sonuc = mesajServisi.mesajGonder("musteri-1", "konusma-1", "  Siparis ne zaman hazir?  ");

        assertThat(sonuc.getIcerik()).isEqualTo("Siparis ne zaman hazir?");
        assertThat(sonuc.getGondericiAdSoyad()).isEqualTo("Ayse Isik");
        assertThat(konusma.getSonMesajTarihi()).isEqualTo(mesajTarihi);
        assertThat(konusma.getSonOkumalar()).containsEntry("musteri-1", mesajTarihi);
        verify(konusmaDeposu).save(konusma);
        verify(akisYoneticisi).yayinla(Set.of("satici-1", "personel-1"), sonuc);
        verify(bildirimYayinlayici).mesajBildir("satici-1", "Ayse Isik", "Siparis ne zaman hazir?");
        verify(bildirimYayinlayici).mesajBildir("personel-1", "Ayse Isik", "Siparis ne zaman hazir?");
    }

    @Test
    void mesajlariOkurkenSonOkumaGuncellenir() {
        Konusma konusma = konusma("konusma-1", "RIDE", "yolculuk-1", Konusma.Durum.ACIK, "surucu-1", "yolcu-1");
        Mesaj mesaj = Mesaj.builder()
                .id("mesaj-1")
                .konusmaId("konusma-1")
                .gondericiKullaniciId("surucu-1")
                .icerik("Kapidayim")
                .olusturulmaTarihi(LocalDateTime.of(2026, 6, 16, 9, 0))
                .build();
        when(konusmaDeposu.findById("konusma-1")).thenReturn(Optional.of(konusma));
        when(mesajDeposu.findByKonusmaIdOrderByOlusturulmaTarihiAsc("konusma-1")).thenReturn(List.of(mesaj));
        when(kullaniciOzetIstemcisi.ozetler(konusma.getKatilimcilar())).thenReturn(Map.of(
                "surucu-1", new KullaniciOzetIstemcisi.KullaniciOzeti(
                        "surucu-1", "Mehmet", "Kaya", null, null, null)
        ));

        List<Mesaj> sonuc = mesajServisi.mesajlar("yolcu-1", "konusma-1");

        assertThat(sonuc).containsExactly(mesaj);
        assertThat(mesaj.getGondericiAdSoyad()).isEqualTo("Mehmet Kaya");
        ArgumentCaptor<Konusma> konusmaCaptor = ArgumentCaptor.forClass(Konusma.class);
        verify(konusmaDeposu).save(konusmaCaptor.capture());
        assertThat(konusmaCaptor.getValue().getSonOkumalar()).containsKey("yolcu-1");
    }

    @Test
    void bosMesajGonderilemez() {
        assertThatThrownBy(() -> mesajServisi.mesajGonder("musteri-1", "konusma-1", "  "))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Mesaj boş olamaz");

        verifyNoInteractions(konusmaDeposu, mesajDeposu, akisYoneticisi, bildirimYayinlayici);
    }

    private Konusma konusma(String id, String modul, String baglamId, Konusma.Durum durum, String... katilimcilar) {
        Konusma konusma = Konusma.builder()
                .id(id)
                .modul(modul)
                .baglamId(baglamId)
                .durum(durum)
                .build();
        konusma.getKatilimcilar().addAll(List.of(katilimcilar));
        return konusma;
    }
}
