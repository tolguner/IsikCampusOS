package com.isik.kampusos.etkinlik.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DenetimGunluguYaniti {
    private String id;
    private String varlikTuru;
    private String varlikId;
    private String islem;
    private String islemYapanId;
    private String islemYapanRol;
    private String mesaj;
    private String metaVeri;
    private LocalDateTime olusturulmaTarihi;
}
