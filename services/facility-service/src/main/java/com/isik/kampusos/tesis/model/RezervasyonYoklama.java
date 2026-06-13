package com.isik.kampusos.tesis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "rezervasyon_yoklamalari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "rezervasyon")
public class RezervasyonYoklama {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rezervasyon_id", nullable = false, unique = true)
    @JsonIgnore
    private TesisRezervasyon rezervasyon;

    @Column(nullable = false)
    private String kullaniciId;

    @Column(nullable = false)
    private OffsetDateTime yoklamaTarihi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private YoklamaYontemi yontem;

    private String kanitDosyaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private YoklamaDurumu durum;

    private OffsetDateTime olusturulmaTarihi;
    private OffsetDateTime guncellenmeTarihi;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        olusturulmaTarihi = now;
        guncellenmeTarihi = now;
        if (durum == null) {
            durum = YoklamaDurumu.BEKLEMEDE;
        }
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = OffsetDateTime.now();
    }

    public enum YoklamaYontemi {
        KAREKOD,
        MANUEL
    }

    public enum YoklamaDurumu {
        BEKLEMEDE,
        GIRIS_YAPILDI,
        BASARISIZ
    }
}
