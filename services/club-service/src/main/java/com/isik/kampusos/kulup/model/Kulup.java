package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "kulupler")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kulup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false, unique = true)
    private String ad;
 
    @Column(length = 500)
    private String kisaAciklama;
 
    @Column(columnDefinition = "TEXT")
    private String aciklama;
 
    @Column(nullable = false)
    private String yoneticiKullaniciId; // kulüp yöneticisinin kullanıcı ID'si
 
    private String baskanTamAdi;
    private String baskanEpostasi;
    @Column(columnDefinition = "TEXT")
    private String logoUrl;
    private String danismanAkademikPersonelId;
    private String danismanUnvani;
    private String danismanTamAdi;
    private String danismanEpostasi;
    private String danismanBolumu;
 
    private boolean aktif;
    
    private boolean onayGerektirir;
    
    @Column(name = "silindi", nullable = false)
    private boolean silindi = false;
    
    @Column(name = "silinme_tarihi")
    private LocalDateTime silinmeTarihi;
}
