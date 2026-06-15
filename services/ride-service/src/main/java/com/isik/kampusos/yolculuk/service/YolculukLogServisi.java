package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.model.YolculukSistemLogu;
import com.isik.kampusos.yolculuk.repository.YolculukSistemLoguDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class YolculukLogServisi {
    
    private final YolculukSistemLoguDeposu logDeposu;

    public void logEkle(String islemYapanId, String islemTipi, String hedefId, String mesaj) {
        logDeposu.save(YolculukSistemLogu.builder()
                .islemYapanId(islemYapanId)
                .islemTipi(islemTipi)
                .hedefId(hedefId)
                .mesaj(mesaj)
                .build());
    }

    public List<YolculukSistemLogu> tumLoglar() {
        return logDeposu.findAllByOrderByOlusturulmaTarihiDesc();
    }
}
