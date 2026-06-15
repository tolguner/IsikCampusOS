package com.isik.kampusos.yolculuk.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "yolculuk_sistem_logu")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YolculukSistemLogu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String islemYapanId;
    
    @Transient
    private String islemYapanAdSoyad;
    
    private String hedefId;

    private String islemTipi;

    private String mesaj;

    @Builder.Default
    private LocalDateTime olusturulmaTarihi = LocalDateTime.now();
}
