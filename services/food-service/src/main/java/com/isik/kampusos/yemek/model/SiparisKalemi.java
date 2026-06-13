package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "siparis_kalemleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiparisKalemi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String menuOgesiId;

    @Column(nullable = false)
    private String urunAdi;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal birimFiyat;

    @Column(nullable = false)
    private int adet;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal araToplam;

    /** Seçilen opsiyonların okunabilir özeti (örn. "Büyük, Ekstra peynir"). */
    @Column(length = 500)
    private String secimlerOzeti;
}
