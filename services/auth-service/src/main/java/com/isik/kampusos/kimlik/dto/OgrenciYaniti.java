package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OgrenciYaniti {
    private String id;
    private String eposta;
    private String ad;
    private String soyad;
    private String tamAd;
    private String ogrenciNumarasi;
    private String fakulte;
    private String bolum;
    private String bolumKodu;
    private Integer kayitYili;
    private String tcKimlikMaskeli;
    private String telefon;
    private String ikametAdresi;
    private String kanGrubu;
    private String durum;
    private boolean epostaDogrulandi;
    private String olusturulmaTarihi;
    private String sonGirisTarihi;
}
