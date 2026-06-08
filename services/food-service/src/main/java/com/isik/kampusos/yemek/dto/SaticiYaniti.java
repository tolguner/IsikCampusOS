package com.isik.kampusos.yemek.dto;

import com.isik.kampusos.yemek.model.CalismaSaati;
import com.isik.kampusos.yemek.model.Satici;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Öğrenciye/genel listeye dönen zenginleştirilmiş satıcı yanıtı:
 * profil alanları + hesaplanmış anlık açık/kapalı durumu + çalışma saatleri.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaticiYaniti {
    private String id;
    private String ad;
    private String aciklama;
    private String konumMetni;
    private String logoUrl;
    private String mutfakTuru;
    private String kapakGorselUrl;
    private BigDecimal teslimatUcreti;
    private BigDecimal minimumSepetTutari;
    private Integer tahminiTeslimatDakika;
    private boolean acik;            // manuel ana anahtar
    private String durum;           // AKTIF | PASIF

    /** O an sipariş alınabilir mi (durum + manuel + çalışma saati). */
    private boolean suAnAcik;
    /** Kapalıysa bir sonraki açılış bilgisi (örn. "Bugün 18:00", "Yarın 09:00"); açıksa null. */
    private String sonrakiAcilis;

    private List<CalismaSaati> calismaSaatleri;

    public static SaticiYaniti of(Satici s, boolean suAnAcik, String sonrakiAcilis, List<CalismaSaati> saatler) {
        return SaticiYaniti.builder()
                .id(s.getId())
                .ad(s.getAd())
                .aciklama(s.getAciklama())
                .konumMetni(s.getKonumMetni())
                .logoUrl(s.getLogoUrl())
                .mutfakTuru(s.getMutfakTuru())
                .kapakGorselUrl(s.getKapakGorselUrl())
                .teslimatUcreti(s.getTeslimatUcreti())
                .minimumSepetTutari(s.getMinimumSepetTutari())
                .tahminiTeslimatDakika(s.getTahminiTeslimatDakika())
                .acik(s.isAcik())
                .durum(s.getDurum().name())
                .suAnAcik(suAnAcik)
                .sonrakiAcilis(sonrakiAcilis)
                .calismaSaatleri(saatler)
                .build();
    }
}
