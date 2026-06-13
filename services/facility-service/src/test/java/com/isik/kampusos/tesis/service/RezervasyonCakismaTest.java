package com.isik.kampusos.tesis.service;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Rezervasyon zaman çakışması mantığının doğruluğunu sınar.
 * Yarı-açık aralık: bir aralığın bitişi diğerinin başlangıcına eşitse çakışma YOKTUR
 * (10:00-11:00 ile 11:00-12:00 yan yana, çakışmaz).
 */
class RezervasyonCakismaTest {

    private OffsetDateTime saat(int s) {
        return OffsetDateTime.of(2026, 6, 7, s, 0, 0, 0, ZoneOffset.UTC);
    }

    @Test
    void tamiyleIciceAraliklarCakisir() {
        // mevcut 10-12, yeni 10:30-11:30 (mevcut içinde)
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(10).plusMinutes(30), saat(11).plusMinutes(30), saat(10), saat(12))).isTrue();
    }

    @Test
    void kismiCakismaBastanTespitEdilir() {
        // mevcut 10-12, yeni 11-13 (sonu mevcutun içinde başlar)
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(11), saat(13), saat(10), saat(12))).isTrue();
    }

    @Test
    void yeniAralikMevcuduKapsiyorsaCakisir() {
        // mevcut 10-11, yeni 09-12 (mevcudu tamamen kapsar)
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(9), saat(12), saat(10), saat(11))).isTrue();
    }

    @Test
    void bitisBaslangicaEsitseCakismaz_oncesi() {
        // yeni 09-10, mevcut 10-11 (yan yana, sınır)
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(9), saat(10), saat(10), saat(11))).isFalse();
    }

    @Test
    void bitisBaslangicaEsitseCakismaz_sonrasi() {
        // yeni 11-12, mevcut 10-11 (yan yana, sınır)
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(11), saat(12), saat(10), saat(11))).isFalse();
    }

    @Test
    void tamamenAyriAraliklarCakismaz() {
        // yeni 08-09, mevcut 14-15
        assertThat(TesisRezervasyonServisi.zamanlarCakisiyorMu(
                saat(8), saat(9), saat(14), saat(15))).isFalse();
    }
}
