package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_ogeleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuOgesi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false)
    private String ad;

    @Column(columnDefinition = "TEXT")
    private String aciklama;

    private String kategori;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fiyat;

    @Column(columnDefinition = "TEXT")
    private String gorselUrl;

    @Builder.Default
    private boolean mevcut = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MenuDurumu durum = MenuDurumu.AKTIF;

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

    public enum MenuDurumu { AKTIF, ARSIVLENDI }
}
