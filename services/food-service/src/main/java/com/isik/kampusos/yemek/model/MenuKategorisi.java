package com.isik.kampusos.yemek.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** İşletme yöneticisinin yönettiği menü kategorisi (işletme başına). */
@Entity
@Table(name = "menu_kategorileri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuKategorisi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String saticiId;

    @Column(nullable = false)
    private String ad;

    @Builder.Default
    private int siralama = 0;

    private LocalDateTime olusturulmaTarihi;

    @PrePersist
    void onCreate() {
        if (olusturulmaTarihi == null) olusturulmaTarihi = LocalDateTime.now();
    }
}
