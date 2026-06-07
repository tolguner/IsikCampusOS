package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "kulup_duyurulari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KulupDuyurusu {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(name = "kulup_id", nullable = false)
    private String kulupId;
 
    @Column(nullable = false)
    private String baslik;
 
    @Column(columnDefinition = "TEXT", nullable = false)
    private String mesaj;
 
    private String baglantiUrl;
    private String baglantiEtiketi;
    
    @Column(columnDefinition = "TEXT")
    private String resimUrl;
 
    @Column(name = "olusturan_id", nullable = false)
    private String olusturanKullaniciId;
 
    @Column(nullable = false)
    private LocalDateTime olusturulmaTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
