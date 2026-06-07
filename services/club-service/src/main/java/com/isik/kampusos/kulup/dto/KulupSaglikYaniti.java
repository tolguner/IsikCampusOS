package com.isik.kampusos.kulup.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KulupSaglikYaniti {
    private String kulupId;
    private String kulupAdi;
    private boolean aktif;
    private long uyeSayisi;
    private long aktifEtkinlikSayisi;
    private long gelecekEtkinlikSayisi;
    private long onayBekleyenEtkinlikSayisi;
    private long onayBekleyenProfilTalebiSayisi;
    private LocalDateTime sonEtkinlikTarihi;
    private LocalDateTime sonDuyuruTarihi;
    private double katilimOrtalamasi;
    private String saglikDurumu;
    private boolean gozetimAltinda;
    private String sonNot;
    private String sonNotuYazan;
    private LocalDateTime sonNotTarihi;
}
