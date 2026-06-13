package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rota_duraklari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RotaDuragi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "ilan_id", insertable = false, updatable = false)
    private String ilanId;

    @Column(nullable = false)
    private String ad;

    @Column(nullable = false)
    private double enlem;

    @Column(nullable = false)
    private double boylam;

    @Column(nullable = false)
    private int sira;

    @Column(nullable = false)
    private int tahminiDakika;
}
