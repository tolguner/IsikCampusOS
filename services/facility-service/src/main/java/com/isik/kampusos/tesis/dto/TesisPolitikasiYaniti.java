package com.isik.kampusos.tesis.dto;

import com.isik.kampusos.tesis.model.TesisPolitikasi;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TesisPolitikasiYaniti {
    private String id;
    private String tesisId;
    private int rezervasyonPenceresiGun;
    private int iptalLimitDakika;
    private int maksimumRezervasyonSureDakika;
    private boolean onayGerekli;
    private String durum;

    public static TesisPolitikasiYaniti from(TesisPolitikasi politika) {
        if (politika == null) {
            return null;
        }
        return TesisPolitikasiYaniti.builder()
                .id(politika.getId())
                .tesisId(politika.getTesis().getId())
                .rezervasyonPenceresiGun(politika.getRezervasyonPenceresiGun())
                .iptalLimitDakika(politika.getIptalLimitDakika())
                .maksimumRezervasyonSureDakika(politika.getMaksimumRezervasyonSureDakika())
                .onayGerekli(politika.isOnayGerekli())
                .durum(politika.getDurum().name())
                .build();
    }
}
