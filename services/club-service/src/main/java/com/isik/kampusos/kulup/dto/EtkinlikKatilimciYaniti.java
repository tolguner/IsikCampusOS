package com.isik.kampusos.kulup.dto;

import com.isik.kampusos.kulup.model.EtkinlikKatilimi;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EtkinlikKatilimciYaniti {
    private String katilimId;
    private String etkinlikId;
    private String kullaniciId;
    private EtkinlikKatilimi.KatilimDurumu durum;
    private LocalDateTime kayitTarihi;
    private LocalDateTime yoklamaTarihi;
    private String yoklamayiYapan;
    private boolean odemeBekliyor;
    private boolean odemeOnaylandi;
    private LocalDateTime odemeIncelemeTarihi;
    private String odemeyiInceleyen;
    private String odemeRedNedeni;
    private boolean sertifikaGonderildi;
    private LocalDateTime sertifikaGonderilmeTarihi;
}
