package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
/**
 * Diğer mikroservislerin kullanıcı bilgilerini çekmesi için kullanılan hafif DTO.
 * Hassas bilgiler (şifre vb.) dahil edilmez.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KullaniciOzetiYaniti {
    private String id;
    private String tamAd;
    private String ogrenciNumarasi;
    private String bolum;
    private String fakulte;
    private String eposta;
}
