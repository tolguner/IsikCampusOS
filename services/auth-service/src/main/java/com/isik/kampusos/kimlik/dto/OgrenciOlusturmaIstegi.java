package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OgrenciOlusturmaIstegi {
    private String ad;
    private String soyad;
    private String ogrenciNumarasi;   // e.g., 32yobi1053
    private String tcKimlikNo;      // 11 haneli TC
    private String fakulte;
    private String bolum;
    private String bolumKodu;      // 4 harfli kısaltma: yobi
    private Integer kayitYili;
    private String telefonNumarasi;
    private String ikametAdresi;
    private String kanGrubu;
}
