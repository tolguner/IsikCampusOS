package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bir işletmeye (satıcıya) bağlı personel. Personel hesabının kendisi auth-service'te
 * (ROLE_VENDOR_STAFF) yaşar; bu kayıt işletme↔personel bağını ve durumunu tutar.
 * kullanici_id UNIQUE olduğundan bir personel yalnızca tek işletmede çalışabilir.
 */
@Entity
@Table(name = "isletme_personeli")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IsletmePersoneli {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false, unique = true)
    private String kullaniciId;

    private String ad;

    private String eposta;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PersonelDurumu durum = PersonelDurumu.AKTIF;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }

    public enum PersonelDurumu { AKTIF, PASIF }
}
