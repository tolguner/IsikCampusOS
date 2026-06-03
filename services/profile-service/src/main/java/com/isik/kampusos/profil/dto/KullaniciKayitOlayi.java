package com.isik.kampusos.profil.dto;
 
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
 
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KullaniciKayitOlayi {
    private String kullaniciId;
    private String eposta;
    private String ad;
    private String soyad;
    private String bolum;
    private String ogrenciNumarasi;
    private String tcKimlikMaskeli;
    private String telefonNumarasi;
    private String ikametAdresi;
    private String kanGrubu;
}
