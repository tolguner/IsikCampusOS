package com.isik.kampusos.etkinlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(
    name = "kulup_uyeleri",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_kulup_uye_kulup_kullanici",
        columnNames = {"kulup_id", "kullanici_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KulupUyesi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(name = "kulup_id", nullable = false)
    private String kulupId;
 
    @Column(name = "kullanici_id", nullable = false)
    private String kullaniciId;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UyeRolu rol;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UyeDurumu durum = UyeDurumu.AKTIF;
 
    private LocalDateTime katilmaTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.katilmaTarihi = LocalDateTime.now();
        if (this.durum == null) {
            this.durum = UyeDurumu.AKTIF;
        }
    }
 
    public enum UyeRolu {
        UYE, YONETICI
    }
    
    public enum UyeDurumu {
        BEKLEMEDE, AKTIF, REDDEDILDI
    }
}
