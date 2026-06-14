package com.isik.kampusos.tesis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tesis_politikalari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "tesis")
public class TesisPolitikasi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tesis_id", nullable = false, unique = true)
    @JsonIgnore
    private Tesis tesis;

    @Column(nullable = false)
    private int rezervasyonPenceresiGun;

    @Column(nullable = false)
    private int minimumBildirimDakika;

    @Column(nullable = false)
    private int iptalLimitDakika;

    @Column(nullable = false)
    private boolean yoklamaZorunlu;

    @Column(nullable = false)
    private int otomatikGelmemeDakika;

    @Column(nullable = false)
    private int maksimumRezervasyonSureDakika;

    // Onay mekanizması: true → öğrenci talebi BEKLEMEDE kalır, Spor Müdürlüğü onaylar;
    // false → rezervasyon anında ONAYLANDI.
    @Column(nullable = false)
    private boolean onayGerekli;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolitikaDurumu durum;

    private String guncelleyen;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
    private LocalDateTime silinmeTarihi;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        olusturulmaTarihi = now;
        guncellenmeTarihi = now;
        if (durum == null) {
            durum = PolitikaDurumu.AKTIF;
        }
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum PolitikaDurumu {
        AKTIF,
        DURDURULMUS
    }
}
