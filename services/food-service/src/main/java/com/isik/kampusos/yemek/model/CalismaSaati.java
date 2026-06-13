package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/** Satıcının belirli bir gün için çalışma saati (1=Pazartesi … 7=Pazar). */
@Entity
@Table(name = "satici_calisma_saatleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalismaSaati {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    /** 1=Pazartesi, 2=Salı, … 7=Pazar (ISO-8601). */
    @Column(nullable = false)
    private short gun;

    private LocalTime acilis;
    private LocalTime kapanis;

    /** O gün tamamen kapalı (açılış/kapanış yok sayılır). */
    @Builder.Default
    private boolean kapali = false;
}
