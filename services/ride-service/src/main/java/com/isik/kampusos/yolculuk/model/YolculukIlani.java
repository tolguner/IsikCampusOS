package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "yolculuk_ilanlari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YolculukIlani {

    public enum IlanDurumu { AKTIF, DOLU, IPTAL, TAMAMLANDI }
    public enum UcretTipi { UCRETSIZ, UCRETLI }
    public enum OdemeYontemi { YOK, NAKIT, IBAN, NAKIT_VEYA_IBAN }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String surucuKullaniciId;

    @Column(nullable = false)
    private String baslangicBasligi;

    @Column(nullable = false)
    private double baslangicEnlem;

    @Column(nullable = false)
    private double baslangicBoylam;

    @Column(nullable = false)
    private String varisBasligi;

    @Column(nullable = false)
    private double varisEnlem;

    @Column(nullable = false)
    private double varisBoylam;

    @Column(nullable = false)
    private LocalDateTime kalkisZamani;

    @Column(nullable = false)
    private int koltukSayisi;

    @Builder.Default
    @Column(nullable = false)
    private int kabulEdilenKoltukSayisi = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IlanDurumu durum = IlanDurumu.AKTIF;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UcretTipi ucretTipi = UcretTipi.UCRETSIZ;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OdemeYontemi odemeYontemi = OdemeYontemi.YOK;

    private BigDecimal kisiBasiUcret;
    private String iban;

    @Column(length = 700)
    private String aciklama;

    @Builder.Default
    @Column(nullable = false)
    private boolean araDurakKabulEdilir = true;

    @Column(length = 4000)
    private String rotaPolyline;

    private Integer tahminiToplamDakika;
    private Double tahminiMesafeKm;

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
    private LocalDateTime iptalTarihi;
    private LocalDateTime tamamlanmaTarihi;

    @Builder.Default
    @Transient
    private int uygunlukSkoru = 0;

    @Builder.Default
    // nullable = false: Hibernate, FK'yı çocuk INSERT'üne dahil eder (ayrı bir UPDATE
    // yerine) — böylece NOT NULL "ilan_id" kısıtı tek-yönlü @OneToMany'de ihlal edilmez.
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "ilan_id", nullable = false)
    @OrderBy("sira ASC")
    private List<RotaDuragi> duraklar = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.olusturulmaTarihi = now;
        this.guncellenmeTarihi = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.guncellenmeTarihi = LocalDateTime.now();
    }

    public int bosKoltukSayisi() {
        return Math.max(0, koltukSayisi - kabulEdilenKoltukSayisi);
    }
}
