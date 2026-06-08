package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Öğrencinin favori satıcısı. */
@Entity
@Table(name = "favori_saticilar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriSatici {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String kullaniciId;

    @Column(nullable = false)
    private String saticiId;

    private LocalDateTime eklenmeTarihi;

    @PrePersist
    void onCreate() {
        if (eklenmeTarihi == null) eklenmeTarihi = LocalDateTime.now();
    }
}
