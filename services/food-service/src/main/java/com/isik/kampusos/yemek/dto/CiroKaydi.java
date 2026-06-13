package com.isik.kampusos.yemek.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Ciro raporundaki tek bir sipariş hareketi (aktivite günlüğü satırı). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CiroKaydi {
    private String siparisId;
    private LocalDateTime tarih;        // sipariş oluşturulma tarihi
    private String musteriAdi;         // siparişi veren öğrenci — soyad kısmen sansürlü
    private String isleyenAdi;         // kabul/red kararını veren işletme kullanıcısı (varsa)
    private String durum;              // TESLIM_EDILDI, IPTAL_EDILDI, REDDEDILDI, ...
    private BigDecimal tutar;          // siparişin toplam tutarı
    private BigDecimal kazanc;         // teslim edildiyse tutar, aksi halde 0
    private String odemeYontemi;      // müşteri beyanı
    private String tahsilEdilenOdeme; // teslimde işaretlenen gerçek tahsilat (varsa)
    private String redNedeni;         // reddedildiyse neden
}
