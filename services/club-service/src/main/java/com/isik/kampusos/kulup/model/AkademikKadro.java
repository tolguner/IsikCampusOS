package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
 
@Entity
@Table(
        name = "akademik_kadro",
        indexes = {
                @Index(name = "idx_akademik_kadro_tam_ad", columnList = "tam_ad"),
                @Index(name = "idx_akademik_kadro_eposta", columnList = "eposta"),
                @Index(name = "idx_akademik_kadro_aktif", columnList = "aktif")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AkademikKadro {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    private String akademikUnvan;
 
    @Column(nullable = false)
    private String tamAd;
 
    @Column(unique = true)
    private String eposta;
 
    private String fakulteVeyaBirim;
    private String bolum;
    private String rol;
 
    @Column(unique = true)
    private String profilUrl;
 
    @Column(columnDefinition = "TEXT")
    private String kaynakSayfaUrl;
 
    private String kaynakSayfaSonGuncellenme;
    private Instant sonSenkronizasyonTarihi;
 
    @Column(nullable = false)
    private boolean aktif;
}
