package com.isik.kampusos.profil.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "profil_degisiklik_istekleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfilDegisiklikIstegi {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false)
    private String kullaniciId;
 
    @Column(nullable = false)
    private String alanAdi;
 
    @Column(length = 1000)
    private String mevcutDeger;
 
    @Column(nullable = false, length = 1000)
    private String talepEdilenDeger;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProfilDegisiklikIstegiDurumu durum = ProfilDegisiklikIstegiDurumu.BEKLEMEDE;
 
    private String inceleyen;
    private String geriBildirim;
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
}
