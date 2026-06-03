package com.isik.kampusos.profil.model;
 
import jakarta.persistence.*;
import lombok.*;
 
@Entity
@Table(name = "profiller")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profil {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(unique = true, nullable = false)
    private String kullaniciId;
 
    private String eposta;
    private String ad;
    private String soyad;
    private String bolum;
    private String telefonNumarasi;
    private String ikametAdresi;
    private String kanGrubu;
    private String tcKimlikMaskeli;
 
    @Column(columnDefinition = "TEXT")
    private String profilResmiUrl;
    
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "profil_resmi_baytlari")
    private byte[] profilResmiBaytlari;
 
    private String profilResmiIcerikTuru;
    
    @Column(length = 1000)
    private String hakkinda;
    
    private String yetenekler; // Virgülle ayrılmış değerler olarak saklanır
    
    private int guvenSkoru;
 
    @PrePersist
    protected void onCreate() {
        this.guvenSkoru = 100; // Varsayılan başlangıç güven skoru
    }
}
