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

    // Tür artık UX'te yok; tüm tesisler spor tesisidir. Geriye dönük uyum için kolon korunur.
    @Enumerated(EnumType.STRING)
    private TesisTuru tesisTuru;

    @Column(columnDefinition = "TEXT")
    private String aciklama;

    private String konumMetni;

    // Konum harita üzerinden seçilir ve gösterilir
    private Double enlem;
    private Double boylam;

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
        if (tesisTuru == null) {
            tesisTuru = TesisTuru.SPOR_ALANI;
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
