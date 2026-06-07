package com.isik.kampusos.kulup.model;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "kulup_saglik_kayitlari")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KulupSaglikKaydi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false, unique = true)
    private String kulupId;
 
    private boolean gozlemListesinde;
 
    @Column(columnDefinition = "TEXT")
    private String sonNot;
 
    private String sonNotuYazan;
    private LocalDateTime sonNotTarihi;
    private LocalDateTime guncellenmeTarihi;
 
    @PrePersist
    @PreUpdate
    protected void onWrite() {
        this.guncellenmeTarihi = LocalDateTime.now();
    }
}
