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

    // Geriye uyum için korunur; kayıtta marka + " " + model olarak doldurulur.
    @Column(nullable = false)
    private String markaModel;

    private String marka;
    private String model;
    private String aracTipi;     // Sedan, Hatchback, SUV, ...
    private Integer modelYili;

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

    // Yönetim paneli gösterimi için (DB'ye yazılmaz; auth-service'ten çözülür)
    @Transient private String basvuranAdSoyad;
    @Transient private String basvuranOgrenciNo;
    @Transient private String basvuranTelefon;
    @Transient private String basvuranEposta;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
