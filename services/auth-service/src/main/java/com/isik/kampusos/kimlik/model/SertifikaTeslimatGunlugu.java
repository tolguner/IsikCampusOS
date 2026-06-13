package com.isik.kampusos.kimlik.model;
 
import jakarta.persistence.*;
import lombok.*;
 
import java.time.LocalDateTime;
 
@Entity
@Table(name = "sertifika_teslimat_gunlukleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SertifikaTeslimatGunlugu {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false, unique = true)
    private String sertifikaKodu;
 
    @Column(nullable = false)
    private String kullaniciId;
 
    @Column(nullable = false)
    private String eposta;
 
    @Column(nullable = false)
    private String etkinlikId;
 
    private String aliciAdi;
    private String etkinlikBasligi;
    private String kulupAdi;
    private String sertifikaBasligi;
    private LocalDateTime verilmeTarihi;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeslimatDurumu durum;
 
    @Column(length = 2000)
    private String hataMesaji;
 
    private LocalDateTime gonderilmeTarihi;
    private LocalDateTime eklenmeTarihi;
    private LocalDateTime guncellenmeTarihi;
 
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.eklenmeTarihi = now;
        this.guncellenmeTarihi = now;
    }
 
    @PreUpdate
    protected void onUpdate() {
        this.guncellenmeTarihi = LocalDateTime.now();
    }
 
    public enum TeslimatDurumu {
        GONDERILDI, HATA
    }
}
