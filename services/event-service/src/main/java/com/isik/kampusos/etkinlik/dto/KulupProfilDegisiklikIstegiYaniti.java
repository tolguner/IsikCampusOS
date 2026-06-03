package com.isik.kampusos.etkinlik.dto;

import com.isik.kampusos.etkinlik.model.KulupProfilDegisiklikIstegi;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KulupProfilDegisiklikIstegiYaniti {
    private String id;
    private KulupYaniti kulup;
    private String talepEden;
    private String ad;
    private String kisaAciklama;
    private String vizyon;
    private String logoUrl;
    private KulupProfilDegisiklikIstegi.DegisiklikDurumu durum;
    private String geriBildirim;
    private String inceleyen;
    private LocalDateTime incelemeTarihi;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
}
