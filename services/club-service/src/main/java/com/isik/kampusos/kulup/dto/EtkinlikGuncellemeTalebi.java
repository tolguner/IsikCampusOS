package com.isik.kampusos.kulup.dto;

import lombok.Data;
import com.isik.kampusos.kulup.model.Etkinlik;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EtkinlikGuncellemeTalebi {
    private String baslik;
    private String aciklama;
    private LocalDateTime baslangicTarihi;
    private LocalDateTime bitisTarihi;
    private String konum;
    private Etkinlik.EtkinlikTuru etkinlikTuru;
    private String cevrimiciPlatform;
    private String cevrimiciToplantiUrl;
    private String konumAdi;
    private String konumDetayi;
    private Double enlem;
    private Double boylam;
    private String afisResmiUrl;
    private boolean kontenjanSiniriVar;
    private boolean kontenjanSinirli;
    private int kontenjan;
    private boolean yedekListesiSiniriVar;
    private int yedekListesiKontenjani;
    private boolean qrGirisEtkin;
    private boolean sertifikaEtkin;
    private String sertifikaBasligi;
    private boolean ucretli;
    private BigDecimal ucretTutari;
    private String iban;
    private String odemeTalimatlari;
    private boolean hatirlaticiEtkin;
    private List<Integer> hatirlatmaZamanlariDakika;
}
