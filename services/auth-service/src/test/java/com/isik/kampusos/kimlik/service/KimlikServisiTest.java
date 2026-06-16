package com.isik.kampusos.kimlik.service;

import com.isik.kampusos.kimlik.dto.GirisIstegi;
import com.isik.kampusos.kimlik.dto.KimlikYaniti;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.DogrulamaKoduDeposu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import com.isik.kampusos.kimlik.util.JwtSaglayici;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KimlikServisiTest {

    @Mock
    private KullaniciDeposu kullaniciDeposu;

    @Mock
    private DogrulamaKoduDeposu dogrulamaKoduDeposu;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtSaglayici jwtSaglayici;

    @Mock
    private EpostaServisi epostaServisi;

    @InjectMocks
    private KimlikServisi kimlikServisi;

    @Test
    void girisEpostayiTrimleyipKucukHarfeCevirerekArar() {
        Kullanici kullanici = Kullanici.builder()
                .id("kullanici-1")
                .eposta("ogrenci@isik.edu.tr")
                .sifre("encoded")
                .roller("ROLE_STUDENT")
                .ad("Ayse")
                .soyad("Isik")
                .durum(KullaniciDurumu.AKTIF)
                .epostaDogrulandi(true)
                .sifreDegistirmeli(false)
                .build();
        when(kullaniciDeposu.findByEposta("ogrenci@isik.edu.tr")).thenReturn(Optional.of(kullanici));
        when(passwordEncoder.matches("sifre123", "encoded")).thenReturn(true);
        when(jwtSaglayici.tokenUret(kullanici)).thenReturn("jwt-token");

        KimlikYaniti yanit = kimlikServisi.girisYap(new GirisIstegi("  OGRENCI@ISIK.EDU.TR  ", "sifre123"));

        assertThat(yanit.getToken()).isEqualTo("jwt-token");
        assertThat(yanit.getEposta()).isEqualTo("ogrenci@isik.edu.tr");
        verify(kullaniciDeposu).findByEposta("ogrenci@isik.edu.tr");
        verify(kullaniciDeposu).save(kullanici);
    }
}
