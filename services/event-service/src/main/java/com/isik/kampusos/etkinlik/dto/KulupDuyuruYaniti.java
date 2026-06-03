package com.isik.kampusos.etkinlik.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KulupDuyuruYaniti {
    private String id;
    private String kulupId;
    private String kulupAdi;
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    private String olusturanKullaniciId;
    private LocalDateTime olusturulmaTarihi;
}
