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

    @Column(nullable = false)
    private String aracMarkaModel;

    @Column(nullable = false)
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

    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
