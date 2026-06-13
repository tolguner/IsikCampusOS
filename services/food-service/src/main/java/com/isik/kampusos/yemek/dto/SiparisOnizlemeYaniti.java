package com.isik.kampusos.yemek.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Sipariş öncesi gerçek tutar dökümü (kampanya indirimi dahil) — kayıt oluşturmaz. */
@Data
@Builder
public class SiparisOnizlemeYaniti {
    private BigDecimal araToplam;
    private BigDecimal teslimatUcreti;
    private BigDecimal indirimTutari;
    private String kampanyaAd;          // uygulanan kampanya (yoksa null)
    private BigDecimal toplamTutar;
    private BigDecimal minimumSepetTutari;
    private boolean minimumKarsilandi;
}
