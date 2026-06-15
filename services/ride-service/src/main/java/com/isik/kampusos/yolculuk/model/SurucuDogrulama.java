package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "surucu_dogrulamalari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurucuDogrulama {

    public enum DogrulamaDurumu { BEKLEMEDE, ONAYLANDI, REDDEDILDI, ASKIYA_ALINDI }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String kullaniciId;

    @Column(nullable = false)
    private String ehliyetSinifi;

    // Kapsamlı ehliyet bilgileri
    private String ehliyetNo;
    private String ehliyetSahibiAdSoyad;
    private java.time.LocalDate verilisTarihi;
    private java.time.LocalDate gecerlilikTarihi;

    // Geriye-uyum (legacy): araç bilgisi artık ayrı `araclar` tablosunda tutulur.
    private String aracMarkaModel;
    private String plaka;
    private String aracRengi;
    private Integer koltukKapasitesi;

    @Column(length = 1000)
    private String belgeUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DogrulamaDurumu durum = DogrulamaDurumu.BEKLEMEDE;

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
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
