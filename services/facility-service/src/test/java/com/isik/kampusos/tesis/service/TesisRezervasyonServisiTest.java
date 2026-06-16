package com.isik.kampusos.tesis.service;

import com.isik.kampusos.tesis.dto.TesisRezervasyonTalebi;
import com.isik.kampusos.tesis.messaging.BildirimYayinlayici;
import com.isik.kampusos.tesis.model.Tesis;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import com.isik.kampusos.tesis.model.TesisPolitikasi;
import com.isik.kampusos.tesis.model.TesisRezervasyon;
import com.isik.kampusos.tesis.repository.TesisKaynagiDeposu;
import com.isik.kampusos.tesis.repository.TesisKullanilabilirlikKuraliDeposu;
import com.isik.kampusos.tesis.repository.TesisPolitikasiDeposu;
import com.isik.kampusos.tesis.repository.TesisRezervasyonDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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
class TesisRezervasyonServisiTest {

    @Mock
    private TesisRezervasyonDeposu tesisRezervasyonDeposu;

    @Mock
    private TesisKaynagiDeposu tesisKaynagiDeposu;

    @Mock
    private TesisPolitikasiDeposu tesisPolitikasiDeposu;

    @Mock
    private TesisKullanilabilirlikKuraliDeposu tesisKullanilabilirlikKuraliDeposu;

    @Mock
    private BildirimYayinlayici bildirimYayinlayici;

    @InjectMocks
    private TesisRezervasyonServisi rezervasyonServisi;

    @Test
    void kapasiteyiAsanKatilimciSayisiylaRezervasyonOlusturulamaz() {
        TesisKaynagi kaynak = kaynak(5);
        TesisPolitikasi politika = politika(false);
        TesisRezervasyonTalebi talep = talep(6);
        when(tesisKaynagiDeposu.findByIdAndSilinmeTarihiIsNull("kaynak-1")).thenReturn(Optional.of(kaynak));
        when(tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull("tesis-1")).thenReturn(Optional.of(politika));

        assertThatThrownBy(() -> rezervasyonServisi.createBooking("ogrenci-1", talep))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("kapasite");

        verify(tesisRezervasyonDeposu, never()).save(any());
        verifyNoInteractions(bildirimYayinlayici);
    }

    @Test
    void onayGerektirenRezervasyonBeklemedeKaydedilirVeYoneticiyeBildirilir() {
        TesisKaynagi kaynak = kaynak(10);
        TesisPolitikasi politika = politika(true);
        TesisRezervasyonTalebi talep = talep(4);
        when(tesisKaynagiDeposu.findByIdAndSilinmeTarihiIsNull("kaynak-1")).thenReturn(Optional.of(kaynak));
        when(tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull("tesis-1")).thenReturn(Optional.of(politika));
        when(tesisKullanilabilirlikKuraliDeposu.findByKaynakIdOrderByHaftaninGunuAscBaslangicSaatiAsc("kaynak-1"))
                .thenReturn(List.of(kural(talep.getBaslangicTarihi().getDayOfWeek().getValue())));
        when(tesisRezervasyonDeposu.findByKaynakIdAndDurumIn(any(), any())).thenReturn(List.of());
        when(tesisRezervasyonDeposu.findByRezervasyonYapanKullaniciIdOrderByBaslangicTarihiDesc("ogrenci-1"))
                .thenReturn(List.of());
        when(tesisRezervasyonDeposu.save(any(TesisRezervasyon.class))).thenAnswer(invocation -> {
            TesisRezervasyon rezervasyon = invocation.getArgument(0);
            rezervasyon.setId("rezervasyon-1");
            return rezervasyon;
        });

        var sonuc = rezervasyonServisi.createBooking("ogrenci-1", talep);

        assertThat(sonuc.getDurum()).isEqualTo("BEKLEMEDE");
        verify(bildirimYayinlayici).yeniTalepBildir("Spor Salonu", "20.06.2026 10:00");
    }

    @Test
    void ogrenciBaskasininRezervasyonunuIptalEdemez() {
        TesisRezervasyon rezervasyon = rezervasyon(TesisRezervasyon.RezervasyonDurumu.ONAYLANDI, "ogrenci-2");
        when(tesisRezervasyonDeposu.findById("rezervasyon-1")).thenReturn(Optional.of(rezervasyon));

        assertThatThrownBy(() -> rezervasyonServisi.cancelBooking("ogrenci-1", "ROLE_STUDENT", "rezervasyon-1", "Plan degisti"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("yetkiniz yok");

        verify(tesisRezervasyonDeposu, never()).save(any());
    }

    @Test
    void adminIptalLimitiniAsanRezervasyonuIptalEdebilir() {
        TesisRezervasyon rezervasyon = rezervasyon(TesisRezervasyon.RezervasyonDurumu.ONAYLANDI, "ogrenci-1");
        rezervasyon.setBaslangicTarihi(OffsetDateTime.now().plusMinutes(5));
        rezervasyon.setBitisTarihi(OffsetDateTime.now().plusMinutes(65));
        when(tesisRezervasyonDeposu.findById("rezervasyon-1")).thenReturn(Optional.of(rezervasyon));
        when(tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull("tesis-1")).thenReturn(Optional.of(politika(false)));
        when(tesisRezervasyonDeposu.save(rezervasyon)).thenReturn(rezervasyon);

        var sonuc = rezervasyonServisi.cancelBooking("admin-1", "ROLE_FACILITY_ADMIN", "rezervasyon-1", "Bakim");

        assertThat(sonuc.getDurum()).isEqualTo("IPTAL_EDILDI");
        assertThat(sonuc.getIptalNedeni()).isEqualTo("Bakim");
        assertThat(rezervasyon.getIptalEdilmeTarihi()).isNotNull();
    }

    @Test
    void rezervasyonOnaylanincaOgrenciyeSonucBildirimiGonderilir() {
        TesisRezervasyon rezervasyon = rezervasyon(TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE, "ogrenci-1");
        when(tesisRezervasyonDeposu.findById("rezervasyon-1")).thenReturn(Optional.of(rezervasyon));
        when(tesisRezervasyonDeposu.save(rezervasyon)).thenReturn(rezervasyon);

        var sonuc = rezervasyonServisi.updateBookingStatus("tesis-admin-1", "rezervasyon-1", "ONAYLANDI");

        assertThat(sonuc.getDurum()).isEqualTo("ONAYLANDI");
        verify(bildirimYayinlayici).ogrenciyeSonucBildir(
                "ogrenci-1",
                "Rezervasyonunuz onaylandı",
                "Spor Salonu rezervasyon talebiniz Spor Müdürlüğü tarafından onaylandı.");
    }

    private Tesis tesis() {
        return Tesis.builder()
                .id("tesis-1")
                .ad("Spor Salonu")
                .kapasite(50)
                .durum(Tesis.TesisDurumu.AKTIF)
                .build();
    }

    private TesisKaynagi kaynak(int kapasite) {
        return TesisKaynagi.builder()
                .id("kaynak-1")
                .tesis(tesis())
                .ad("Basketbol Sahasi")
                .kaynakKodu("BS-1")
                .kapasite(kapasite)
                .rezervasyonYapilabilir(true)
                .durum(TesisKaynagi.KaynakDurumu.AKTIF)
                .build();
    }

    private TesisPolitikasi politika(boolean onayGerekli) {
        return TesisPolitikasi.builder()
                .tesis(tesis())
                .rezervasyonPenceresiGun(14)
                .minimumBildirimDakika(0)
                .iptalLimitDakika(30)
                .maksimumRezervasyonSureDakika(120)
                .onayGerekli(onayGerekli)
                .durum(TesisPolitikasi.PolitikaDurumu.AKTIF)
                .build();
    }

    private TesisKullanilabilirlikKurali kural(int gun) {
        return TesisKullanilabilirlikKurali.builder()
                .kaynak(kaynak(10))
                .haftaninGunu(gun)
                .baslangicSaati(LocalTime.of(9, 0))
                .bitisSaati(LocalTime.of(18, 0))
                .durum(TesisKullanilabilirlikKurali.KuralDurumu.AKTIF)
                .build();
    }

    private TesisRezervasyonTalebi talep(int katilimciSayisi) {
        OffsetDateTime baslangic = OffsetDateTime.of(2026, 6, 20, 10, 0, 0, 0, ZoneOffset.UTC);
        return TesisRezervasyonTalebi.builder()
                .kaynakId("kaynak-1")
                .baslangicTarihi(baslangic)
                .bitisTarihi(baslangic.plusHours(1))
                .amac("Antrenman")
                .katilimciSayisi(katilimciSayisi)
                .build();
    }

    private TesisRezervasyon rezervasyon(TesisRezervasyon.RezervasyonDurumu durum, String kullaniciId) {
        OffsetDateTime baslangic = OffsetDateTime.of(2026, 6, 20, 10, 0, 0, 0, ZoneOffset.UTC);
        return TesisRezervasyon.builder()
                .id("rezervasyon-1")
                .kaynak(kaynak(10))
                .rezervasyonYapanKullaniciId(kullaniciId)
                .baslangicTarihi(baslangic)
                .bitisTarihi(baslangic.plusHours(1))
                .amac("Antrenman")
                .katilimciSayisi(4)
                .durum(durum)
                .build();
    }
}
