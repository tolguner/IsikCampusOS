package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.messaging.AuthKimlikIstemcisi;
import com.isik.kampusos.yemek.messaging.BildirimYayinlayici;
import com.isik.kampusos.yemek.messaging.KonusmaIstemcisi;
import com.isik.kampusos.yemek.messaging.ProfilIstemcisi;
import com.isik.kampusos.yemek.model.IsletmePersoneli;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.repository.IsletmePersonelDeposu;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import com.isik.kampusos.yemek.repository.SiparisDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SiparisServisiTest {

    private static final String SATICI_ID = "satici-1";
    private static final String SAHIP_ID = "sahip-1";
    private static final String PERSONEL_ID = "personel-1";
    private static final String DIGER_PERSONEL_ID = "personel-2";
    private static final String MUSTERI_ID = "musteri-1";
    private static final String SIPARIS_ID = "siparis-123456";

    @Mock private SiparisDeposu siparisDeposu;
    @Mock private SaticiDeposu saticiDeposu;
    @Mock private MenuOgesiDeposu menuOgesiDeposu;
    @Mock private BildirimYayinlayici bildirimYayinlayici;
    @Mock private KonusmaIstemcisi konusmaIstemcisi;
    @Mock private SaticiServisi saticiServisi;
    @Mock private AuthKimlikIstemcisi authIstemci;
    @Mock private ProfilIstemcisi profilIstemci;
    @Mock private IsletmePersonelDeposu personelDeposu;

    @InjectMocks private SiparisServisi siparisServisi;

    @Test
    void kabulBekleyenSiparisiUstlenirVeMusteriyleKonusmaAcar() {
        Satici satici = satici();
        Siparis siparis = siparis(Siparis.SiparisDurumu.BEKLEMEDE);
        when(saticiServisi.saticiCozumle(SAHIP_ID)).thenReturn(satici);
        when(siparisDeposu.findById(SIPARIS_ID)).thenReturn(Optional.of(siparis));
        when(siparisDeposu.save(any(Siparis.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Siparis sonuc = siparisServisi.kabul(SAHIP_ID, SIPARIS_ID, 25);

        assertThat(sonuc.getDurum()).isEqualTo(Siparis.SiparisDurumu.KABUL_EDILDI);
        assertThat(sonuc.getIsleyenKullaniciId()).isEqualTo(SAHIP_ID);
        assertThat(sonuc.getTahminiHazirDakika()).isEqualTo(25);
        assertThat(sonuc.getKabulTarihi()).isNotNull();
        verify(konusmaIstemcisi).konusmaAc("FOOD", SIPARIS_ID,
                List.of(MUSTERI_ID, SAHIP_ID), "Sipariş #" + SIPARIS_ID.substring(0, 8));
        verify(bildirimYayinlayici).siparisDurumBildir(sonuc, satici.getAd(),
                "Siparişiniz onaylandı", "Siparişiniz onaylandı. Tahmini hazırlık süresi: ~25 dk.");
    }

    @Test
    void baskaPersonelinUstlendigiSiparisiPersonelSurduremez() {
        Satici satici = satici();
        Siparis siparis = siparis(Siparis.SiparisDurumu.KABUL_EDILDI);
        siparis.setIsleyenKullaniciId(DIGER_PERSONEL_ID);
        when(saticiServisi.saticiCozumle(PERSONEL_ID)).thenReturn(satici);
        when(siparisDeposu.findById(SIPARIS_ID)).thenReturn(Optional.of(siparis));
        when(personelDeposu.findByKullaniciId(PERSONEL_ID)).thenReturn(Optional.of(personel(PERSONEL_ID)));

        assertThatThrownBy(() -> siparisServisi.hazirla(PERSONEL_ID, SIPARIS_ID))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("başka bir personel üstlendi");

        verifyNoInteractions(bildirimYayinlayici, konusmaIstemcisi);
    }

    @Test
    void gelAlSiparisindeYoldaAsamasiEngellenir() {
        Satici satici = satici();
        Siparis siparis = siparis(Siparis.SiparisDurumu.HAZIR);
        siparis.setTeslimatTuru(Siparis.TeslimatTuru.GEL_AL);
        when(saticiServisi.saticiCozumle(SAHIP_ID)).thenReturn(satici);
        when(siparisDeposu.findById(SIPARIS_ID)).thenReturn(Optional.of(siparis));

        assertThatThrownBy(() -> siparisServisi.yolda(SAHIP_ID, SIPARIS_ID))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Gel-al siparişinde kurye aşaması yoktur");

        verifyNoInteractions(bildirimYayinlayici, konusmaIstemcisi);
    }

    @Test
    void teslimEdilenSiparisKonusmayiKapatirVeTahsilEdilenOdemeyiYazar() {
        Satici satici = satici();
        Siparis siparis = siparis(Siparis.SiparisDurumu.YOLDA);
        when(saticiServisi.saticiCozumle(SAHIP_ID)).thenReturn(satici);
        when(siparisDeposu.findById(SIPARIS_ID)).thenReturn(Optional.of(siparis));
        when(siparisDeposu.save(any(Siparis.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Siparis sonuc = siparisServisi.teslim(SAHIP_ID, SIPARIS_ID, "NAKIT");

        assertThat(sonuc.getDurum()).isEqualTo(Siparis.SiparisDurumu.TESLIM_EDILDI);
        assertThat(sonuc.getTahsilEdilenOdeme()).isEqualTo(Siparis.OdemeYontemi.NAKIT);
        assertThat(sonuc.getTeslimTarihi()).isNotNull();
        verify(konusmaIstemcisi).konusmaKapat("FOOD", SIPARIS_ID);
        verify(bildirimYayinlayici).siparisDurumBildir(sonuc, satici.getAd(),
                "Siparişiniz teslim edildi", "Siparişiniz teslim edildi. Afiyet olsun!");
    }

    private Satici satici() {
        return Satici.builder()
                .id(SATICI_ID)
                .ad("Kampüs Kafe")
                .yoneticiKullaniciId(SAHIP_ID)
                .build();
    }

    private Siparis siparis(Siparis.SiparisDurumu durum) {
        return Siparis.builder()
                .id(SIPARIS_ID)
                .saticiId(SATICI_ID)
                .musteriKullaniciId(MUSTERI_ID)
                .durum(durum)
                .toplamTutar(BigDecimal.valueOf(120))
                .teslimAdresi("Kampüs")
                .odemeYontemi(Siparis.OdemeYontemi.KREDI_KARTI)
                .teslimatTuru(Siparis.TeslimatTuru.ADRESE_TESLIMAT)
                .build();
    }

    private IsletmePersoneli personel(String kullaniciId) {
        return IsletmePersoneli.builder()
                .saticiId(SATICI_ID)
                .kullaniciId(kullaniciId)
                .durum(IsletmePersoneli.PersonelDurumu.AKTIF)
                .rol(IsletmePersoneli.PersonelRolu.PERSONEL)
                .build();
    }
}
