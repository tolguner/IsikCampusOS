package com.isik.kampusos.tesis.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tesisler")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Tesis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TesisTuru tesisTuru;

    @Column(columnDefinition = "TEXT")
    private String aciklama;

    private String konumMetni;

    @Column(nullable = false)
    private int kapasite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TesisDurumu durum;

    private String olusturan;
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
            durum = TesisDurumu.AKTIF;
        }
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum TesisTuru {
        TOPLANTI_ODASI,
        CALISMA_ODASI,
        SPOR_ALANI,
        LABORATUVAR,
        DIGER
    }

    public enum TesisDurumu {
        AKTIF,
        DURDURULMUS,
        ARSIVLENMIS
    }
}
