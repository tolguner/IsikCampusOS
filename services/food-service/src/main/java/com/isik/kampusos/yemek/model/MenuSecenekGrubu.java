package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/** Menü öğesine bağlı seçenek grubu (örn. "Boy" — tek seçim, zorunlu). */
@Entity
@Table(name = "menu_secenek_gruplari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSecenekGrubu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecenekTuru tur;

    @Builder.Default
    private boolean zorunlu = false;

    @Builder.Default
    private int siralama = 0;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "grup_id", nullable = false)
    @OrderBy("siralama ASC")
    @Builder.Default
    private List<MenuSecenegi> secenekler = new ArrayList<>();

    public enum SecenekTuru { TEK_SECIM, COKLU_SECIM }
}
