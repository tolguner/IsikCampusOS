package com.isik.kampusos.mesaj.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Modül-agnostik konuşma. {@code (modul, baglamId)} tekildir; örn. RIDE + talepId, FOOD + siparisId.
 * Katılımcıları ve kimin nereye kadar okuduğunu tutar; mesajlar ayrı tablodadır.
 */
@Entity
@Table(name = "konusmalar", uniqueConstraints = @UniqueConstraint(columnNames = {"modul", "baglam_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Konusma {

    public enum Durum { ACIK, KAPALI }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String modul;          // RIDE, FOOD, PROJECTMATCH, ...

    @Column(name = "baglam_id", nullable = false)
    private String baglamId;

    private String baslik;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Durum durum = Durum.ACIK;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "konusma_katilimcilar", joinColumns = @JoinColumn(name = "konusma_id"))
    @Column(name = "kullanici_id", nullable = false)
    private Set<String> katilimcilar = new HashSet<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "konusma_okumalar", joinColumns = @JoinColumn(name = "konusma_id"))
    @MapKeyColumn(name = "kullanici_id")
    @Column(name = "son_okuma_tarihi")
    private Map<String, LocalDateTime> sonOkumalar = new HashMap<>();

    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime sonMesajTarihi;

    // Gösterim için (DB'ye yazılmaz): karşı taraf adı, son mesaj özeti, okunmamış sayısı.
    @Transient private String karsiTarafAdSoyad;
    @Transient private String sonMesajOzeti;
    @Transient private long okunmamisSayisi;

    @PrePersist
    protected void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
