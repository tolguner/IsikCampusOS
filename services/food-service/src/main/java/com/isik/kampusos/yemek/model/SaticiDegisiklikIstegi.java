package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * İşletme genel bilgileri için sahip-tarafından açılan değişiklik talebi.
 * Sistem yöneticisi onaylar (alan satıcıya uygulanır) veya revize ister (geri bildirimle).
 */
@Entity
@Table(name = "satici_degisiklik_istekleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaticiDegisiklikIstegi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false)
    private String alanAdi;          // ad | aciklama | konumMetni | logoUrl | kapakGorselUrl | mutfakTuru

    @Column(columnDefinition = "TEXT")
    private String mevcutDeger;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String talepEdilenDeger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Durum durum = Durum.BEKLEMEDE;

    private String inceleyen;        // sistem yöneticisi id
    @Column(length = 1000)
    private String geriBildirim;
    private LocalDateTime incelemeTarihi;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (olusturulmaTarihi == null) olusturulmaTarihi = now;
        guncellenmeTarihi = now;
    }

    @PreUpdate
    void onUpdate() { guncellenmeTarihi = LocalDateTime.now(); }

    public enum Durum { BEKLEMEDE, ONAYLANDI, REDDEDILDI, REVIZE_TALEP }
}
