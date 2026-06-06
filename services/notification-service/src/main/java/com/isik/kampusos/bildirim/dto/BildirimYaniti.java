package com.isik.kampusos.bildirim.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BildirimYaniti {
    private String id;
    private String baslik;
    private String mesaj;
    private String baglantiUrl;
    private String baglantiEtiketi;
    private String resimUrl;
    private String tur;
    private String hedefKitle;
    private String ilgiliEtkinlikId;
    private String olusturan;
    private String olusturanAdi;
    private boolean okundu;
    private LocalDateTime olusturulmaTarihi;
}
