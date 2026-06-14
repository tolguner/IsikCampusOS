package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Sürücünün garajındaki bir araç. Her araç ayrı yönetici onayından geçer; görsel zorunlu. */
@Entity
@Table(name = "araclar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Arac {

    public enum AracDurumu { BEKLEMEDE, ONAYLANDI, REDDEDILDI, PASIF }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String kullaniciId;

    @Column(nullable = false)
    private String markaModel;

    @Column(nullable = false)
    private String plaka;

    private String renk;
    private Integer koltukKapasitesi;

    /** Araç fotoğrafı (base64 data-URL); zorunlu. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String gorselUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AracDurumu durum = AracDurumu.BEKLEMEDE;

    @Column(length = 700)
    private String adminNotu;

    private String inceleyenKullaniciId;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime incelenmeTarihi;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
