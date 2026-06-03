package com.isik.kampusos.etkinlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(
    name = "etkinlik_katilimlari",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_katilim_etkinlik_kullanici",
        columnNames = {"etkinlik_id", "kullanici_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtkinlikKatilimi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(name = "etkinlik_id", nullable = false)
    private String etkinlikId;
 
    @Column(name = "kullanici_id", nullable = false)
    private String kullaniciId;
 
    @Column(name = "yoklama_belirteci", unique = true)
    private String yoklamaBelirteci;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KatilimDurumu durum;
 
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime yoklamaTarihi;
    private String yoklamayiYapan;
    private LocalDateTime sertifikaGonderilmeTarihi;
    private LocalDateTime odemeIncelemeTarihi;
    private String odemeyiInceleyen;
    @Column(length = 1000)
    private String odemeRedNedeni;
 
    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
 
    public enum KatilimDurumu {
        ODEME_BEKLIYOR, ONAYLANDI, YEDEKTE, IPTAL_EDILDI, KATILDI, GELMEDI
    }
}
