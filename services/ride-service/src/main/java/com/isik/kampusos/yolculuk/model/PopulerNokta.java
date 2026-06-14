package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Haritada hızlı seçim için önerilen popüler nokta (kullanım sıralı). */
@Entity
@Table(name = "populer_noktalar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopulerNokta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Column(nullable = false)
    private double enlem;

    @Column(nullable = false)
    private double boylam;

    @Builder.Default
    private int kullanimSayisi = 0;

    @Builder.Default
    private boolean aktif = true;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
