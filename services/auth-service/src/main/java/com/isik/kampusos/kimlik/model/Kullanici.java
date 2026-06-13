package com.isik.kampusos.kimlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "kullanicilar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kullanici {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(unique = true, nullable = false)
    private String eposta; // Öğrenci: 32yobi1053@isik.edu.tr | Personel: ad.soyad@isikun.edu.tr
 
    @Column(nullable = false)
    private String sifre; // BCrypt hash
 
    @Column(nullable = false)
    private String roller; // e.g., "ROLE_STUDENT", "ROLE_REGISTRAR", "ROLE_ADMIN"
 
    private String ad;
    private String soyad;
 
    @Column(unique = true)
    private String ogrenciNumarasi; // e.g., 32yobi1053 (nullable — personel için null)
 
    private String fakulte;       // Fakülte (öğrenci)
    private String bolum;          // Bölüm (öğrenci)
    private String bolumKodu;      // 4 harfli kısaltma: yobi
    private Integer kayitYili;     // Kayıt yılı: 2023
    private String tcKimlikMaskeli; // TC/Pasaport tam değer saklanmaz, sadece maskeli görünüm tutulur

    // İdari personel iletişim/birim bilgileri (öğrencide fakülte/bölüm yerine):
    private String birim;          // Çalıştığı birim (örn. "Spor Müdürlüğü")
    private String telefon;
    private String ikametAdresi;
    private String kanGrubu;
 
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private KullaniciDurumu durum = KullaniciDurumu.AKTIF;
 
    @Builder.Default
    private boolean epostaDogrulandi = false;
 
    @Builder.Default
    private boolean sifreDegistirmeli = true;
 
    private LocalDateTime sonGirisTarihi;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
        this.guncellenmeTarihi = LocalDateTime.now();
    }
 
    @PreUpdate
    protected void onUpdate() {
        this.guncellenmeTarihi = LocalDateTime.now();
    }
 
    // Helper: tam ad
    public String getTamAd() {
        if (ad != null && soyad != null) {
            return ad + " " + soyad;
        }
        return eposta;
    }
}
