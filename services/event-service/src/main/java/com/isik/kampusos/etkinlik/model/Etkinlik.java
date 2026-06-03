package com.isik.kampusos.etkinlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "etkinlikler")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Etkinlik {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @ManyToOne
    @JoinColumn(name = "kulup_id", nullable = false)
    private Kulup kulup;
 
    @Column(nullable = false)
    private String baslik;
 
    @Column(length = 2000)
    private String aciklama;
 
    private LocalDateTime baslangicTarihi;
    private LocalDateTime bitisTarihi;
 
    private String konum;
    @Enumerated(EnumType.STRING)
    private EtkinlikTuru etkinlikTuru;
    private String cevrimiciPlatform;
    private String cevrimiciToplantiUrl;
    private String konumAdi;
    @Column(length = 1000)
    private String konumDetayi;
    private Double enlem;
    private Double boylam;
 
    @Column(columnDefinition = "TEXT")
    private String afisResmiUrl;
    
    // Kontenjan mantığı
    private boolean kontenjanSiniriVar;
    private int kontenjan;
    private boolean kontenjanSinirli;
    
    private boolean yedekListesiSiniriVar;
    private int yedekListesiKontenjani;
    
    private int mevcutRsvpSayisi;
    private int mevcutYedekSayisi;
 
    private boolean qrGirisEtkin;
    private boolean sertifikaEtkin;
    private String sertifikaBasligi;
    private boolean ucretli;
    private BigDecimal ucretTutari;
    private String iban;
    @Column(length = 1000)
    private String odemeTalimatlari;
    private boolean hatirlaticiEtkin;
    @Column(length = 255)
    private String hatirlatmaZamanlariDakika;
    @Column(length = 255)
    private String gonderilenHatirlatmaZamanlariDakika;
 
    @Enumerated(EnumType.STRING)
    private EtkinlikDurumu durum;
 
    private String redNedeni;
    private String onaylayan;
    private LocalDateTime onayTarihi;
    private LocalDateTime yayinTarihi;
    private LocalDateTime sertifikalarinOlusturulmaTarihi;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
 
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.olusturulmaTarihi = now;
        this.guncellenmeTarihi = now;
    }
 
    @PreUpdate
    protected void onUpdate() {
        this.guncellenmeTarihi = LocalDateTime.now();
    }
 
    public enum EtkinlikDurumu {
        TASLAK, SKS_ONAYI_BEKLIYOR, REVIZYON_TALEP_EDILDI, YAYINLANDI, REDDEDILDI, IPTAL_EDILDI, TAMAMLANDI
    }
 
    public enum EtkinlikTuru {
        CEVRIMICI, YUZ_YUZE
    }
}
