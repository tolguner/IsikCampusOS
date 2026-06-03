package com.isik.kampusos.etkinlik.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class AkademikKadroSenkronizasyonYaniti {
    private Instant senkronizasyonTarihi;
    private int tarananSayfaSayisi;
    private int hamKayitSayisi;
    private int tekilKayitSayisi;
    private long aktifKayitSayisi;
}
