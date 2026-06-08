package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** İşletmenin tanımladığı kampanya/indirim. */
@Entity
@Table(name = "kampanyalar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kampanya {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false)
    private String ad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KampanyaTuru tur;

    /** YUZDE: %; TUTAR: ₺ indirim; UCRETSIZ_TESLIMAT: değer kullanılmaz. */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deger = BigDecimal.ZERO;

    /** Kampanyanın geçerli olması için gereken minimum ara toplam. */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minSepetTutari = BigDecimal.ZERO;

    @Builder.Default
    private boolean aktif = true;

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

    public enum KampanyaTuru { YUZDE, TUTAR, UCRETSIZ_TESLIMAT }
}
