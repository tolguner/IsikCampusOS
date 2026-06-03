package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KimlikYaniti {
    private String token;
    private String kullaniciId;
    private String eposta;
    private String roller;
    private String tamAd;
    private String ad;
    private String soyad;
    private String fakulte;
    private String bolum;
    private Integer kayitYili;
    private String ogrenciNumarasi;
    private String tcKimlikMaskeli;
    private boolean sifreDegistirmeli;
    private boolean epostaDogrulandi;
    private String durum;
}
