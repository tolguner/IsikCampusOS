package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "etkinlik_degisiklik_istekleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtkinlikDegisiklikIstegi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @ManyToOne
    @JoinColumn(name = "etkinlik_id", nullable = false)
    private Etkinlik etkinlik;
 
    private String talepEden;
 
    @Column(nullable = false)
    private String baslik;
 
    @Column(length = 2000)
    private String aciklama;
 
    private LocalDateTime baslangicTarihi;
    private LocalDateTime bitisTarihi;
    private String konum;
    @Enumerated(EnumType.STRING)
    private Etkinlik.EtkinlikTuru etkinlikTuru;
    private String cevrimiciPlatform;
    private String cevrimiciToplantiUrl;
    private String konumAdi;
    @Column(length = 1000)
    private String konumDetayi;
    private Double enlem;
    private Double boylam;
    @Column(columnDefinition = "TEXT")
    private String afisResmiUrl;
    private boolean kontenjanSiniriVar;
    private int kontenjan;
    private boolean kontenjanSinirli;
    private boolean yedekListesiSiniriVar;
    private int yedekListesiKontenjani;
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
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DegisiklikDurumu durum;
 
    @Column(length = 2000)
    private String geriBildirim;
 
    private String inceleyen;
    private LocalDateTime incelemeTarihi;
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
 
    public enum DegisiklikDurumu {
        SKS_ONAYI_BEKLIYOR, REVIZYON_TALEP_EDILDI, ONAYLANDI
    }
}
