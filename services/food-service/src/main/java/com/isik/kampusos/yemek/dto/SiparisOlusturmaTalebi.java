package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.util.List;

@Data
public class SiparisOlusturmaTalebi {
    private String saticiId;
    private String teslimAdresi;
    private String odemeYontemi;   // NAKIT | KREDI_KARTI
    private String teslimatTuru;   // ADRESE_TESLIMAT (varsayılan) | GEL_AL
    private String telefon;
    private String musteriNotu;
    private List<KalemTalebi> kalemler;

    @Data
    public static class KalemTalebi {
        private String menuOgesiId;
        private int adet;
        private List<String> secilenSecenekIdleri;
    }
}
