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
    private int minimumBildirimDakika;
    private int iptalLimitDakika;
    private boolean yoklamaZorunlu;
    private int otomatikGelmemeDakika;
    private int maksimumRezervasyonSureDakika;
    private String durum;

    public static TesisPolitikasiYaniti from(TesisPolitikasi politika) {
        if (politika == null) {
            return null;
        }
        return TesisPolitikasiYaniti.builder()
                .id(politika.getId())
                .tesisId(politika.getTesis().getId())
                .rezervasyonPenceresiGun(politika.getRezervasyonPenceresiGun())
                .minimumBildirimDakika(politika.getMinimumBildirimDakika())
                .iptalLimitDakika(politika.getIptalLimitDakika())
                .yoklamaZorunlu(politika.isYoklamaZorunlu())
                .otomatikGelmemeDakika(politika.getOtomatikGelmemeDakika())
                .maksimumRezervasyonSureDakika(politika.getMaksimumRezervasyonSureDakika())
                .durum(politika.getDurum().name())
                .build();
    }
}
