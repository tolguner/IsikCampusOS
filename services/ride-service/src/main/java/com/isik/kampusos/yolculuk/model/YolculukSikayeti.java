package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "yolculuk_sikayetleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YolculukSikayeti {

    public enum SikayetNedeni { SURUCU_GELMEDI, YOLCU_GELMEDI, GUVENLIK, UCRET, UYGUNSUZ_DAVRANIS, YANLIS_ROTA, DIGER }
    public enum SikayetDurumu { ACIK, INCELEMEDE, COZULDU, REDDEDILDI, YAPTIRIM_UYGULANDI }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String talepId;

    @Column(nullable = false)
    private String sikayetciKullaniciId;

    @Column(nullable = false)
    private String hedefKullaniciId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SikayetNedeni neden;

    @Column(nullable = false, length = 1000)
    private String aciklama;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SikayetDurumu durum = SikayetDurumu.ACIK;

    @Column(length = 1000)
    private String adminNotu;

    private String inceleyenKullaniciId;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime incelenmeTarihi;

    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
