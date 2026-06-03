package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SifreSifirlamaIstegi {
    private String eposta;
    private String kod;
    private String yeniSifre;
}
