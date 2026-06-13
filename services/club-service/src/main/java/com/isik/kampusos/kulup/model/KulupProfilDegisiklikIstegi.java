package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "kulup_profil_degisiklik_istekleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KulupProfilDegisiklikIstegi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kulup_id", nullable = false)
    private Kulup kulup;
 
    @Column(nullable = false)
    private String talepEden;
 
    @Column(nullable = false)
    private String ad;
 
    @Column(length = 500)
    private String kisaAciklama;
 
    @Column(columnDefinition = "TEXT")
    private String vizyon;
 
    @Column(columnDefinition = "TEXT")
    private String logoUrl;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DegisiklikDurumu durum;
 
    @Column(columnDefinition = "TEXT")
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
        BEKLEMEDE,
        ONAYLANDI,
        REVIZYON_TALEP_EDILDI,
        REDDEDILDI
    }
}
