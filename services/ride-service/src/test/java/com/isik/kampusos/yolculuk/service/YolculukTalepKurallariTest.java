package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.model.YolculukIlani;
import com.isik.kampusos.yolculuk.model.YolculukTalebi;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class YolculukTalepKurallariTest {

    @Test
    void bosKoltukYokkenTalepKabulEdilemez() {
        YolculukIlani ilan = YolculukIlani.builder()
                .koltukSayisi(2)
                .kabulEdilenKoltukSayisi(2)
                .build();

        assertThat(YolculukEslesmeServisi.kabulEdilebilirMi(ilan)).isFalse();
    }

    @Test
    void bekleyenTalepKabulEdilinceKoltukSayisiArtar() {
        YolculukIlani ilan = YolculukIlani.builder()
                .koltukSayisi(3)
                .kabulEdilenKoltukSayisi(1)
                .build();
        YolculukTalebi talep = YolculukTalebi.builder()
                .durum(YolculukTalebi.TalepDurumu.BEKLEMEDE)
                .build();

        YolculukEslesmeServisi.talebiKabulEt(ilan, talep);

        assertThat(ilan.getKabulEdilenKoltukSayisi()).isEqualTo(2);
        assertThat(talep.getDurum()).isEqualTo(YolculukTalebi.TalepDurumu.KABUL_EDILDI);
    }
}
