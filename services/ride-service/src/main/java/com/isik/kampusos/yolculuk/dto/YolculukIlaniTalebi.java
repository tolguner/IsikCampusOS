package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class YolculukIlaniTalebi {
    private NoktaTalebi baslangic;
    private NoktaTalebi varis;
    private LocalDateTime kalkisZamani;
    private int koltukSayisi;
    private String ucretTipi;
    private String odemeYontemi;
    private BigDecimal kisiBasiUcret;
    private String iban;
    private String aciklama;
    private boolean araDurakKabulEdilir = true;
    private String rotaPolyline;
    private Integer tahminiToplamDakika;
    private Double tahminiMesafeKm;
    private List<RotaDuragiTalebi> duraklar = new ArrayList<>();
}
