package com.isik.kampusos.tesis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "tesis_kullanilabilirlik_kurallari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "kaynak")
public class TesisKullanilabilirlikKurali {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kaynak_id", nullable = false)
    @JsonIgnore
    private TesisKaynagi kaynak;

    @Column(nullable = false)
    private int haftaninGunu;

    @Column(nullable = false)
    private LocalTime baslangicSaati;

    @Column(nullable = false)
    private LocalTime bitisSaati;

    private LocalDate gecerlilikBaslangici;
    private LocalDate gecerlilikBitisi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KuralDurumu durum;

    private String guncelleyen;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        olusturulmaTarihi = now;
        guncellenmeTarihi = now;
        if (durum == null) {
            durum = KuralDurumu.AKTIF;
        }
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum KuralDurumu {
        AKTIF,
        DURDURULMUS
    }
}
