package com.isik.kampusos.tesis.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tesis_rezervasyonlari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "kaynak")
public class TesisRezervasyon {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kaynak_id", nullable = false)
    private TesisKaynagi kaynak;

    @Column(nullable = false)
    private String rezervasyonYapanKullaniciId;

    @Column(nullable = false)
    private OffsetDateTime baslangicTarihi;

    @Column(nullable = false)
    private OffsetDateTime bitisTarihi;

    @Column(columnDefinition = "TEXT")
    private String amac;

    @Column(nullable = false)
    private int katilimciSayisi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RezervasyonDurumu durum;

    private OffsetDateTime iptalEdilmeTarihi;
    private String iptalNedeni;
    private OffsetDateTime gelmemeTarihi;

    public enum RezervasyonDurumu {
        TASLAK,
        BEKLEMEDE,
        ONAYLANDI,
        IPTAL_EDILDI,
        TAMAMLANDI,
        GELMEDI,
        BLOKE
    }
}
