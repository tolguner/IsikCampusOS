package com.isik.kampusos.mesaj.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mesajlar", indexes = @Index(name = "idx_mesaj_konusma", columnList = "konusmaId, olusturulmaTarihi"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mesaj {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String konusmaId;

    @Column(nullable = false)
    private String gondericiKullaniciId;

    @Column(nullable = false, length = 2000)
    private String icerik;

    private LocalDateTime olusturulmaTarihi;

    // Gösterim için (DB'ye yazılmaz): gönderenin adı.
    @Transient private String gondericiAdSoyad;

    @PrePersist
    protected void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
