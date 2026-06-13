package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SertifikaOlusturmaIstegiOlayi {
    private String etkinlikId;
    private String etkinlikBasligi;
    private String kulupAdi;
    private String kullaniciId;
    private String sertifikaBasligi;
    private String sertifikaKodu;
    private String olusturulmaTarihi;
    private String etkinlikTarihi;
    private String etkinlikYeri;
    private String kulupBaskaniAdi;
}
