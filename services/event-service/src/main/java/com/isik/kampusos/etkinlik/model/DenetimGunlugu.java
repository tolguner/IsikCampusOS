package com.isik.kampusos.etkinlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "denetim_gunlukleri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DenetimGunlugu {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VarlikTuru varlikTuru;
 
    @Column(nullable = false)
    private String varlikId;
 
    @Column(nullable = false)
    private String islem;
 
    @Column(nullable = false)
    private String yapanId;
 
    private String yapanRol;
 
    @Column(columnDefinition = "TEXT", nullable = false)
    private String mesaj;
 
    @Column(columnDefinition = "TEXT")
    private String metaVeri;
 
    @Column(nullable = false)
    private LocalDateTime olusturulmaTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.olusturulmaTarihi = LocalDateTime.now();
    }
 
    public enum VarlikTuru {
        KULUP, ETKINLIK
    }
}
