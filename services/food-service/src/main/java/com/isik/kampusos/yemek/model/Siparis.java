package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "siparisler")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Siparis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false)
    private String musteriKullaniciId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SiparisDurumu durum;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal araToplam = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal teslimatUcreti = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal indirimTutari = BigDecimal.ZERO;

    private String kampanyaId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal toplamTutar;

    @Column(nullable = false, length = 500)
    private String teslimAdresi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OdemeYontemi odemeYontemi;

    @Enumerated(EnumType.STRING)
    private OdemeYontemi tahsilEdilenOdeme;

    @Column(length = 500)
    private String musteriNotu;

    private String telefon;
    private String redNedeni;
    private Integer tahminiHazirDakika;

    /** Siparişi üstlenen (kabul/red eden) işletme kullanıcısı; teslime kadar süreci o yürütür. */
    private String isleyenKullaniciId;

    /** Teslimat türü: adrese teslimat (kurye) veya gel-al (öğrenci işletmeden alır, YOLDA atlanır). */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TeslimatTuru teslimatTuru = TeslimatTuru.ADRESE_TESLIMAT;

    /** Adrese teslimatta siparişi taşıyan kurye (yolda aşamasında atanır; denetim için). */
    private String kuryeKullaniciId;

    /** İyimser kilit — eşzamanlı durum geçişlerinde ikinci yazan çakışma alır. */
    @Version
    private Long surum;

    /** Kalıcı değil — yanıtta üstlenen kişinin adını taşımak için (auth'tan çözülür). */
    @Transient
    private String isleyenAdi;

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime kabulTarihi;
    private LocalDateTime hazirTarihi;
    private LocalDateTime yolaCikisTarihi;
    private LocalDateTime teslimTarihi;
    private LocalDateTime iptalTarihi;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "siparis_id", nullable = false)
    @Builder.Default
    private List<SiparisKalemi> kalemler = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }

    public enum SiparisDurumu {
        BEKLEMEDE, KABUL_EDILDI, HAZIRLANIYOR, HAZIR, YOLDA, TESLIM_EDILDI, REDDEDILDI, IPTAL_EDILDI
    }

    public enum OdemeYontemi { NAKIT, KREDI_KARTI }

    public enum TeslimatTuru { ADRESE_TESLIMAT, GEL_AL }
}
