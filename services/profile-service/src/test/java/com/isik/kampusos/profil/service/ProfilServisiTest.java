package com.isik.kampusos.profil.service;

import com.isik.kampusos.profil.dto.ProfilDegisiklikIncelemesi;
import com.isik.kampusos.profil.dto.ProfilDegisiklikTalebi;
import com.isik.kampusos.profil.dto.ProfilDetayi;
import com.isik.kampusos.profil.model.Profil;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegi;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegiDurumu;
import com.isik.kampusos.profil.repository.ProfilDegisiklikIstegiDeposu;
import com.isik.kampusos.profil.repository.ProfilDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfilServisiTest {

    @Mock
    private ProfilDeposu profilDeposu;

    @Mock
    private ProfilDegisiklikIstegiDeposu profilDegisiklikIstegiDeposu;

    @InjectMocks
    private ProfilServisi profilServisi;

    @Test
    void dogrudanProfilGuncellemeKimlikAlanlariniDegistiremezAmaSelfServisAlanlariniGunceller() {
        Profil profil = profil();
        ProfilDetayi talep = new ProfilDetayi();
        talep.setAd("Yeni Ad");
        talep.setSoyad("Yeni Soyad");
        talep.setBolum("Yeni Bolum");
        talep.setHakkinda("Kampüs topluluklarında aktifim.");
        talep.setYetenekler("Java,React");
        talep.setIletisimPaylasimIzni(true);
        when(profilDeposu.findByKullaniciId("kullanici-1")).thenReturn(Optional.of(profil));
        when(profilDeposu.save(profil)).thenReturn(profil);

        Profil sonuc = profilServisi.profilGuncelle("kullanici-1", talep);

        assertThat(sonuc.getAd()).isEqualTo("Ayse");
        assertThat(sonuc.getSoyad()).isEqualTo("Isik");
        assertThat(sonuc.getBolum()).isEqualTo("Bilgisayar Muhendisligi");
        assertThat(sonuc.getHakkinda()).isEqualTo("Kampüs topluluklarında aktifim.");
        assertThat(sonuc.getYetenekler()).isEqualTo("Java,React");
        assertThat(sonuc.isIletisimPaylasimIzni()).isTrue();
    }

    @Test
    void degisiklikTalebiYalnizIzinliAlanlarIcinOlusturulur() {
        Profil profil = profil();
        ProfilDegisiklikTalebi talep = new ProfilDegisiklikTalebi();
        talep.setAlanAdi("telefonNumarasi");
        talep.setTalepEdilenDeger(" 05551234567 ");
        when(profilDeposu.findByKullaniciId("kullanici-1")).thenReturn(Optional.of(profil));
        when(profilDegisiklikIstegiDeposu.save(any(ProfilDegisiklikIstegi.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfilDegisiklikIstegi sonuc = profilServisi.profilDegisiklikIstegiOlustur("kullanici-1", talep);

        assertThat(sonuc.getAlanAdi()).isEqualTo("telefonNumarasi");
        assertThat(sonuc.getMevcutDeger()).isEqualTo("05550000000");
        assertThat(sonuc.getTalepEdilenDeger()).isEqualTo("05551234567");
        assertThat(sonuc.getDurum()).isEqualTo(ProfilDegisiklikIstegiDurumu.BEKLEMEDE);
    }

    @Test
    void yetkisizKullaniciDegisiklikTalebiniInceleyemez() {
        assertThatThrownBy(() -> profilServisi.bekleyenDegisiklikIstekleriniGetir("ROLE_STUDENT"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("yetkiniz yok");

        verify(profilDegisiklikIstegiDeposu, never()).findByDurumOrderByOlusturulmaTarihiDesc(any());
    }

    @Test
    void onaylananDegisiklikProfilAlaninaUygulanir() {
        Profil profil = profil();
        ProfilDegisiklikIstegi istek = ProfilDegisiklikIstegi.builder()
                .id("istek-1")
                .kullaniciId("kullanici-1")
                .alanAdi("kanGrubu")
                .mevcutDeger("A+")
                .talepEdilenDeger("0+")
                .durum(ProfilDegisiklikIstegiDurumu.BEKLEMEDE)
                .build();
        when(profilDegisiklikIstegiDeposu.findById("istek-1")).thenReturn(Optional.of(istek));
        when(profilDeposu.findByKullaniciId("kullanici-1")).thenReturn(Optional.of(profil));
        when(profilDegisiklikIstegiDeposu.save(istek)).thenReturn(istek);

        ProfilDegisiklikIstegi sonuc = profilServisi.degisiklikIsteginiOnayla(
                "istek-1", "registrar-1", "ROLE_REGISTRAR");

        assertThat(profil.getKanGrubu()).isEqualTo("0+");
        assertThat(sonuc.getDurum()).isEqualTo(ProfilDegisiklikIstegiDurumu.ONAYLANDI);
        assertThat(sonuc.getInceleyen()).isEqualTo("registrar-1");
        assertThat(sonuc.getIncelemeTarihi()).isNotNull();
        verify(profilDeposu).save(profil);
    }

    @Test
    void reddedilenDegisiklikProfilAlaniniDegistirmez() {
        Profil profil = profil();
        ProfilDegisiklikIstegi istek = ProfilDegisiklikIstegi.builder()
                .id("istek-1")
                .kullaniciId("kullanici-1")
                .alanAdi("ikametAdresi")
                .mevcutDeger("Kampüs Yurdu")
                .talepEdilenDeger("Yeni Adres")
                .durum(ProfilDegisiklikIstegiDurumu.BEKLEMEDE)
                .build();
        ProfilDegisiklikIncelemesi inceleme = new ProfilDegisiklikIncelemesi();
        inceleme.setGeriBildirim("Belge gerekli.");
        when(profilDegisiklikIstegiDeposu.findById("istek-1")).thenReturn(Optional.of(istek));
        when(profilDegisiklikIstegiDeposu.save(istek)).thenReturn(istek);

        ProfilDegisiklikIstegi sonuc = profilServisi.degisiklikIsteginiReddet(
                "istek-1", "registrar-1", "ROLE_ADMIN", inceleme);

        assertThat(profil.getIkametAdresi()).isEqualTo("Kampüs Yurdu");
        assertThat(sonuc.getDurum()).isEqualTo(ProfilDegisiklikIstegiDurumu.REDDEDILDI);
        assertThat(sonuc.getGeriBildirim()).isEqualTo("Belge gerekli.");
        verify(profilDeposu, never()).save(any());
    }

    private Profil profil() {
        return Profil.builder()
                .id("profil-1")
                .kullaniciId("kullanici-1")
                .eposta("ayse@isik.edu.tr")
                .ad("Ayse")
                .soyad("Isik")
                .bolum("Bilgisayar Muhendisligi")
                .telefonNumarasi("05550000000")
                .ikametAdresi("Kampüs Yurdu")
                .kanGrubu("A+")
                .build();
    }
}
