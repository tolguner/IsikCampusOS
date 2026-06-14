package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OgrenciGuncellemeIstegi {
    private String ad;
    private String soyad;
    private String fakulte;
    private String bolum;
    private String telefonNumarasi;
    private String ikametAdresi;
    private String kanGrubu;
}
