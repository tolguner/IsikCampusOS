package com.isik.kampusos.bildirim.service;

import com.isik.kampusos.bildirim.dto.BildirimOlayi;
import com.isik.kampusos.bildirim.messaging.BildirimAkisYoneticisi;
import com.isik.kampusos.bildirim.model.Bildirim;
import com.isik.kampusos.bildirim.repository.BildirimDeposu;
import com.isik.kampusos.bildirim.repository.BildirimOkumaDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BildirimServisiTest {

    @Mock
    private BildirimDeposu bildirimDeposu;

    @Mock
    private BildirimOkumaDeposu bildirimOkumaDeposu;

    @Mock
    private BildirimAkisYoneticisi akisYoneticisi;

    @InjectMocks
    private BildirimServisi bildirimServisi;

    @Test
    void mesajOlayiMesajTuruyleKalicilastirilirVeYayinlanir() {
        BildirimOlayi olay = olay("Yeni mesaj", "Ayse Isik: Siparis hazir mi?", "MESAJ", "KULLANICI");
        olay.setAliciKullaniciId("kullanici-1");
        when(bildirimDeposu.save(any(Bildirim.class))).thenAnswer(invocation -> kaydedilmisBildirim(invocation.getArgument(0)));

        Bildirim sonuc = bildirimServisi.olaydanOlustur(olay);

        assertThat(sonuc.getTur().name()).isEqualTo("MESAJ");
        assertThat(sonuc.getHedefKitle()).isEqualTo(Bildirim.HedefKitle.KULLANICI);
        assertThat(sonuc.getAliciKullaniciId()).isEqualTo("kullanici-1");
        verify(akisYoneticisi).yayinla(sonuc);
    }

    @Test
    void yolculukOlayiYolculukTuruyleKalicilastirilir() {
        BildirimOlayi olay = olay("Yolculuk talebi", "Yeni yolcu talebi var.", "YOLCULUK", "KULLANICI");
        olay.setAliciKullaniciId("surucu-1");
        when(bildirimDeposu.save(any(Bildirim.class))).thenAnswer(invocation -> kaydedilmisBildirim(invocation.getArgument(0)));

        Bildirim sonuc = bildirimServisi.olaydanOlustur(olay);

        assertThat(sonuc.getTur().name()).isEqualTo("YOLCULUK");
        assertThat(sonuc.getAliciKullaniciId()).isEqualTo("surucu-1");
    }

    @Test
    void ogrenciVeIsletmePersoneliKendiKullaniciBildirimleriyleRolKitleleriniGorur() {
        when(bildirimDeposu.findByAliciKullaniciIdOrHedefKitleInOrderByOlusturulmaTarihiDesc(any(), any()))
                .thenReturn(List.of());

        bildirimServisi.gorunurBildirimleriListele("kullanici-1", "ROLE_STUDENT,ROLE_VENDOR_STAFF");

        verify(bildirimDeposu).findByAliciKullaniciIdOrHedefKitleInOrderByOlusturulmaTarihiDesc(
                org.mockito.ArgumentMatchers.eq("kullanici-1"),
                argThat(kitleler -> kitleler.containsAll(List.of(
                        Bildirim.HedefKitle.TUM_KULLANICILAR,
                        Bildirim.HedefKitle.TUM_OGRENCILER,
                        Bildirim.HedefKitle.ISLETME_PERSONELLERI
                )) && kitleler.size() == 3));
    }

    private BildirimOlayi olay(String baslik, String mesaj, String tur, String hedefKitle) {
        BildirimOlayi olay = new BildirimOlayi();
        olay.setBaslik(baslik);
        olay.setMesaj(mesaj);
        olay.setTur(tur);
        olay.setHedefKitle(hedefKitle);
        olay.setBaglantiUrl("/mesajlar");
        olay.setBaglantiEtiketi("Detay");
        olay.setOlusturanAdi("Sistem");
        return olay;
    }

    private Bildirim kaydedilmisBildirim(Bildirim bildirim) {
        bildirim.setId("bildirim-1");
        bildirim.setOlusturulmaTarihi(LocalDateTime.of(2026, 6, 16, 11, 0));
        return bildirim;
    }
}
