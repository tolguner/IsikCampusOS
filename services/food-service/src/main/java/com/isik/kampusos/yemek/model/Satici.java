package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "saticilar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Satici {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Column(columnDefinition = "TEXT")
    private String aciklama;

    private String konumMetni;

    @Column(columnDefinition = "TEXT")
    private String logoUrl;

    @Column(nullable = false)
    private String yoneticiKullaniciId;

    @Builder.Default
    private boolean acik = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SaticiDurumu durum = SaticiDurumu.AKTIF;

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (olusturulmaTarihi == null) olusturulmaTarihi = now;
        guncellenmeTarihi = now;
    }

    @PreUpdate
    void onUpdate() {
        guncellenmeTarihi = LocalDateTime.now();
    }

    public enum SaticiDurumu { AKTIF, PASIF }
}
