package com.isik.kampusos.bildirim.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bildirimler")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bildirim {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String baslik;

    @Column(nullable = false, length = 3000)
    private String mesaj;

    private String baglantiUrl;
    private String baglantiEtiketi;

    @Column(columnDefinition = "TEXT")
    private String resimUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BildirimTuru tur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HedefKitle hedefKitle;

    private String aliciKullaniciId;
    private String ilgiliEtkinlikId;
    private String olusturan;
    private String olusturanAdi;
    private LocalDateTime okunmaTarihi;
    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    protected void onCreate() {
        if (this.olusturulmaTarihi == null) {
            this.olusturulmaTarihi = LocalDateTime.now();
        }
    }

    public enum BildirimTuru {
        DUYURU, ETKINLIK_REVIZYON_TALEBI, ETKINLIK_ONAY_TALEBI, PROFIL_ONAY_TALEBI, SERTIFIKA, SIPARIS_DURUMU,
        REZERVASYON_TALEBI, REZERVASYON_DURUMU
    }

    public enum HedefKitle {
        KULLANICI, TUM_OGRENCILER, TUM_KULLANICILAR, KULUP_BASKANLARI, SKS_YONETICILERI, TESIS_YONETICILERI,
        ISLETME_YONETICILERI, ISLETME_PERSONELLERI
    }
}
