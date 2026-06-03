package com.isik.kampusos.etkinlik.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(
        name = "bildirim_okumalari",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_bildirim_okuma_kullanici",
                columnNames = {"bildirim_id", "kullanici_id"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BildirimOkuma {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(name = "bildirim_id", nullable = false)
    private String bildirimId;
 
    @Column(name = "kullanici_id", nullable = false)
    private String kullaniciId;
 
    @Column(nullable = false)
    private LocalDateTime okunmaTarihi;
 
    @PrePersist
    protected void onCreate() {
        this.okunmaTarihi = LocalDateTime.now();
    }
}
