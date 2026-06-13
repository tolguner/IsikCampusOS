package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.model.RotaDuragi;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class YolculukRotaEslesmeTest {

    private RotaDuragi durak(String ad, int sira, int dakika) {
        return RotaDuragi.builder()
                .ad(ad)
                .sira(sira)
                .tahminiDakika(dakika)
                .enlem(41.0 + sira)
                .boylam(29.0 + sira)
                .build();
    }

    @Test
    void rotaIcindekiSiraliDuraklarEslesir() {
        List<RotaDuragi> rota = List.of(
                durak("Şile Kampüs", 0, 0),
                durak("Çekmeköy Metro", 1, 35),
                durak("Üsküdar", 2, 65),
                durak("Kadıköy", 3, 85)
        );

        assertThat(YolculukEslesmeServisi.rotaKapsiyorMu(rota, "Çekmeköy Metro", "Kadıköy")).isTrue();
    }

    @Test
    void rotaTersYondeyseEslesmez() {
        List<RotaDuragi> rota = List.of(
                durak("Şile Kampüs", 0, 0),
                durak("Üsküdar", 1, 60),
                durak("Kadıköy", 2, 80)
        );

        assertThat(YolculukEslesmeServisi.rotaKapsiyorMu(rota, "Kadıköy", "Üsküdar")).isFalse();
    }

    @Test
    void tahminiInisDakikasiBinistenSonraHesaplanir() {
        List<RotaDuragi> rota = List.of(
                durak("Şile Kampüs", 0, 0),
                durak("Üsküdar", 1, 60),
                durak("Kadıköy", 2, 80)
        );

        assertThat(YolculukEslesmeServisi.durakDakikasi(rota, "Kadıköy")).contains(80);
    }
}
