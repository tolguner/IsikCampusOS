package com.isik.kampusos.profil.dto;
 
import lombok.Data;
 
@Data
public class ProfilDetayi {
    private String ad;
    private String soyad;
    private String bolum;
    private String profilResmiUrl;
    private String hakkinda;
    private String yetenekler;
    private Boolean iletisimPaylasimIzni;
}
