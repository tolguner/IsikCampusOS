package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "yolculuk_puanlari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YolculukPuani {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String talepId;

    @Column(nullable = false)
    private String verenKullaniciId;

    @Column(nullable = false)
    private String alanKullaniciId;

    @Column(nullable = false)
    private int puan;

    @Column(length = 500)
    private String yorum;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
