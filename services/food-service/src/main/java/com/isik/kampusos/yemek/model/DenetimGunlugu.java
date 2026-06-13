package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** food-service denetim kaydı (işletme/personel/sipariş/talep işlemleri). */
@Entity
@Table(name = "denetim_gunlukleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DenetimGunlugu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String varlikTuru;      // ISLETME | PERSONEL | SIPARIS | DEGISIKLIK_TALEBI
    private String varlikId;

    @Column(nullable = false)
    private String islem;
    private String yapanId;
    private String yapanRol;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String mesaj;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
