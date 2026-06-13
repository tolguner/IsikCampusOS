package com.isik.kampusos.tesis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tesis_kaynaklari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "tesis")
public class TesisKaynagi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tesis_id", nullable = false)
    @JsonIgnore
    private Tesis tesis;

    @Column(nullable = false)
    private String kaynakKodu;

    @Column(nullable = false)
    private String ad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KaynakTuru kaynakTuru;

    @Column(nullable = false)
    private int kapasite;

    @Column(nullable = false)
    private boolean rezervasyonYapilabilir;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KaynakDurumu durum;

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
            durum = KaynakDurumu.AKTIF;
        }
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum KaynakTuru {
        TOPLANTI_ODASI,
        CALISMA_ODASI,
        SPOR_ALANI,
        LABORATUVAR,
        DIGER
    }

    public enum KaynakDurumu {
        AKTIF,
        DURDURULMUS,
        ARSIVLENMIS
    }
}
