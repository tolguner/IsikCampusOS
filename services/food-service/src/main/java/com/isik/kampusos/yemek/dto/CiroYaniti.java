package com.isik.kampusos.yemek.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/** İşletme online sipariş ciro raporu + aktivite günlüğü. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CiroYaniti {
    private long siparisSayisi;        // teslim edilen sipariş sayısı
    private long toplamSiparis;        // aralıktaki tüm siparişler
    private long iptalSayisi;          // müşteri iptali
    private long redSayisi;            // işletme reddi
    private BigDecimal toplamCiro;
    private BigDecimal nakitToplam;
    private BigDecimal krediKartiToplam;
    private List<CiroKaydi> kayitlar;  // sipariş bazlı hareket günlüğü (en yeni önce)
}
