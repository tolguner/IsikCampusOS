package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "yolculuk_talepleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YolculukTalebi {

    public enum TalepDurumu { BEKLEMEDE, KABUL_EDILDI, REDDEDILDI, IPTAL, TAMAMLANDI }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ilanId;

    @Column(nullable = false)
    private String yolcuKullaniciId;

    @Column(nullable = false)
    private String binisBasligi;

    @Column(nullable = false)
    private double binisEnlem;

    @Column(nullable = false)
    private double binisBoylam;

    @Column(nullable = false)
    private String inisBasligi;

    @Column(nullable = false)
    private double inisEnlem;

    @Column(nullable = false)
    private double inisBoylam;

    @Builder.Default
    @Column(nullable = false)
    private int koltukSayisi = 1;

    private Integer tahminiBinisDakika;
    private Integer tahminiInisDakika;

    @Column(length = 500)
    private String mesaj;

    @Column(length = 255)
    private String redNedeni;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TalepDurumu durum = TalepDurumu.BEKLEMEDE;

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime cevapTarihi;
    private LocalDateTime iptalTarihi;
    private LocalDateTime tamamlanmaTarihi;

    // Gösterim için (DB'ye yazılmaz): talebi gönderen yolcu ve ilgili ilan bilgisi.
    @Transient private String yolcuAdSoyad;
    @Transient private String yolcuOgrenciNo;
    @Transient private String ilanBaslangicBasligi;
    @Transient private String ilanVarisBasligi;
    @Transient private LocalDateTime ilanKalkisZamani;

    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
