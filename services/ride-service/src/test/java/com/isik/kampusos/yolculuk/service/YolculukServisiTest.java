package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.NoktaTalebi;
import com.isik.kampusos.yolculuk.dto.YolculukKatilimTalebi;
import com.isik.kampusos.yolculuk.messaging.BildirimYayinlayici;
import com.isik.kampusos.yolculuk.messaging.KonusmaIstemcisi;
import com.isik.kampusos.yolculuk.model.RotaDuragi;
import com.isik.kampusos.yolculuk.model.YolculukIlani;
import com.isik.kampusos.yolculuk.model.YolculukTalebi;
import com.isik.kampusos.yolculuk.repository.AracDeposu;
import com.isik.kampusos.yolculuk.repository.SurucuDogrulamaDeposu;
import com.isik.kampusos.yolculuk.repository.YolculukIlaniDeposu;
import com.isik.kampusos.yolculuk.repository.YolculukPuaniDeposu;
import com.isik.kampusos.yolculuk.repository.YolculukSikayetiDeposu;
import com.isik.kampusos.yolculuk.repository.YolculukTalebiDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YolculukServisiTest {

    @Mock
    private YolculukIlaniDeposu ilanDeposu;

    @Mock
    private YolculukTalebiDeposu talepDeposu;

    @Mock
    private SurucuDogrulamaDeposu dogrulamaDeposu;

    @Mock
    private YolculukPuaniDeposu puanDeposu;

    @Mock
    private YolculukSikayetiDeposu sikayetDeposu;

    @Mock
    private RotaIstemcisi rotaIstemcisi;

    @Mock
    private PopulerNoktaServisi populerNoktaServisi;

    @Mock
    private AracDeposu aracDeposu;

    @Mock
    private YolculukLogServisi logServisi;

    @Mock
    private BildirimYayinlayici bildirimYayinlayici;

    @Mock
    private KonusmaIstemcisi konusmaIstemcisi;

    @Mock
    private KullaniciOzetIstemcisi kullaniciOzetIstemcisi;

    @InjectMocks
    private YolculukServisi yolculukServisi;

    @Test
    void bosKoltuktanFazlaKoltukIstenenTalepOlusturulamaz() {
        YolculukIlani ilan = ilan(2, 1);
        YolculukKatilimTalebi talep = katilimTalebi(2);
        when(ilanDeposu.findById("ilan-1")).thenReturn(Optional.of(ilan));

        assertThatThrownBy(() -> yolculukServisi.katil("yolcu-1", "ilan-1", talep))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("yeterli boş koltuk yok");

        verify(talepDeposu, never()).save(any());
        verifyNoInteractions(bildirimYayinlayici, konusmaIstemcisi);
    }

    @Test
    void uygunTalepKaydedilirSurucuyeBildirilirVeKonusmaAcilir() {
        YolculukIlani ilan = ilan(3, 1);
        YolculukKatilimTalebi talep = katilimTalebi(2);
        when(ilanDeposu.findById("ilan-1")).thenReturn(Optional.of(ilan));
        when(talepDeposu.findByIlanIdAndYolcuKullaniciIdAndDurumIn(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(talepDeposu.save(any(YolculukTalebi.class))).thenAnswer(invocation -> {
            YolculukTalebi kayit = invocation.getArgument(0);
            kayit.setId("talep-1");
            return kayit;
        });

        YolculukTalebi sonuc = yolculukServisi.katil("yolcu-1", "ilan-1", talep);

        assertThat(sonuc.getKoltukSayisi()).isEqualTo(2);
        assertThat(sonuc.getDurum()).isEqualTo(YolculukTalebi.TalepDurumu.BEKLEMEDE);
        verify(bildirimYayinlayici).kullaniciyaBildir(
                "surucu-1",
                "Yeni yolcu talebi",
                "Şile Kampüs → Kadıköy ilanınıza yeni bir katılım isteği geldi.");
        verify(konusmaIstemcisi).konusmaAc(
                "RIDE",
                "talep-1",
                List.of("surucu-1", "yolcu-1"),
                "Şile Kampüs → Kadıköy");
    }

    private YolculukIlani ilan(int koltukSayisi, int kabulEdilenKoltukSayisi) {
        YolculukIlani ilan = YolculukIlani.builder()
                .id("ilan-1")
                .surucuKullaniciId("surucu-1")
                .baslangicBasligi("Şile Kampüs")
                .baslangicEnlem(41.1700)
                .baslangicBoylam(29.5600)
                .varisBasligi("Kadıköy")
                .varisEnlem(40.9900)
                .varisBoylam(29.0300)
                .kalkisZamani(LocalDateTime.of(2026, 6, 20, 9, 0))
                .koltukSayisi(koltukSayisi)
                .kabulEdilenKoltukSayisi(kabulEdilenKoltukSayisi)
                .durum(YolculukIlani.IlanDurumu.AKTIF)
                .araDurakKabulEdilir(false)
                .build();
        ilan.getDuraklar().add(RotaDuragi.builder()
                .ad("Şile Kampüs")
                .enlem(41.1700)
                .boylam(29.5600)
                .sira(0)
                .tahminiDakika(0)
                .build());
        ilan.getDuraklar().add(RotaDuragi.builder()
                .ad("Kadıköy")
                .enlem(40.9900)
                .boylam(29.0300)
                .sira(1)
                .tahminiDakika(75)
                .build());
        return ilan;
    }

    private YolculukKatilimTalebi katilimTalebi(int koltukSayisi) {
        YolculukKatilimTalebi talep = new YolculukKatilimTalebi();
        talep.setBinis(nokta("Şile Kampüs", 41.1700, 29.5600));
        talep.setInis(nokta("Kadıköy", 40.9900, 29.0300));
        talep.setKoltukSayisi(koltukSayisi);
        talep.setMesaj("Uygunsa katilmak istiyorum.");
        return talep;
    }

    private NoktaTalebi nokta(String ad, double enlem, double boylam) {
        NoktaTalebi nokta = new NoktaTalebi();
        nokta.setAd(ad);
        nokta.setEnlem(enlem);
        nokta.setBoylam(boylam);
        return nokta;
    }
}
