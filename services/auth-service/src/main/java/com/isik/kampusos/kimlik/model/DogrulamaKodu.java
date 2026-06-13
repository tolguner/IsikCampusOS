package com.isik.kampusos.kimlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "dogrulama_kodlari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DogrulamaKodu {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false)
    private String kullaniciId;
 
    @Column(nullable = false)
    private String eposta;
 
    @Column(nullable = false)
    private String kod; // 6 haneli kod
 
    @Column(nullable = false)
    private String kodTuru; // EMAIL_VERIFICATION, PASSWORD_RESET
 
    @Column(nullable = false)
    private LocalDateTime sonKullanmaTarihi;
 
    private boolean kullanildi;
 
    private LocalDateTime olusturulmaTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
}
