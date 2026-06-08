package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** Bir seçenek grubundaki tek seçenek (örn. "Büyük" +10₺). */
@Entity
@Table(name = "menu_secenekleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSecenegi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal ekFiyat = BigDecimal.ZERO;

    @Builder.Default
    private int siralama = 0;
}
