package com.isik.kampusos.kimlik.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Sistem yöneticisi kullanıcı/rol işlemleri denetim kaydı (auth_db). */
@Entity
@Table(name = "denetim_gunlukleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KullaniciDenetimGunlugu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Builder.Default
    private String varlikTuru = "KULLANICI";

    private String varlikId;
    private String islem;
    private String yapanId;
    private String yapanRol;

    @Column(columnDefinition = "TEXT")
    private String mesaj;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    void onCreate() {
        if (this.olusturulmaTarihi == null) this.olusturulmaTarihi = LocalDateTime.now();
    }
}
