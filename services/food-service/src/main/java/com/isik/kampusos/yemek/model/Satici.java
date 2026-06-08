package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "saticilar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Satici {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Column(columnDefinition = "TEXT")
    private String aciklama;

    private String konumMetni;

    @Column(columnDefinition = "TEXT")
    private String logoUrl;

    @Column(nullable = false)
    private String yoneticiKullaniciId;

    /** Mutfak türü / kategori (örn. "Fast Food", "Kafe", "Tatlı"). Filtreleme için. */
    private String mutfakTuru;

    @Column(columnDefinition = "TEXT")
    private String kapakGorselUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal teslimatUcreti = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minimumSepetTutari = BigDecimal.ZERO;

    /** Tahmini teslimat süresi (dakika). */
    private Integer tahminiTeslimatDakika;

    /** Manuel ana anahtar — false ise satıcı çalışma saatine bakılmaksızın kapalıdır (yoğunluk vb.). */
    @Builder.Default
    private boolean acik = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SaticiDurumu durum = SaticiDurumu.AKTIF;

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (olusturulmaTarihi == null) olusturulmaTarihi = now;
        guncellenmeTarihi = now;
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum SaticiDurumu { AKTIF, PASIF }
}
