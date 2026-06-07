package com.isik.kampusos.kulup.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KulupUyeYaniti {
    private String id;
    private String kulupId;
    private String kullaniciId;
    private String adSoyad;
    private String rol;     // MEMBER, ADMIN
    private String durum;   // PENDING, ACTIVE, REJECTED
    private LocalDateTime katilmaTarihi;
}
