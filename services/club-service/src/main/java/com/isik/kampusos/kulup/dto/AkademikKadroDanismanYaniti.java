package com.isik.kampusos.kulup.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class AkademikKadroDanismanYaniti {
    private String id;
    private String akademikUnvan;
    private String adSoyad;
    private String gorunenAd;
    private String eposta;
    private String fakulteVeyaBirim;
    private String bolum;
    private String rol;
    private String profilUrl;
    private Instant sonSenkronizasyonTarihi;
}
