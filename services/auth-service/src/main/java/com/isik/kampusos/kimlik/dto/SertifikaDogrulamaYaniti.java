package com.isik.kampusos.kimlik.dto;
 
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
 
@Data
@Builder
public class SertifikaDogrulamaYaniti {
    private boolean gecerli;
    private String sertifikaKodu;
    private String aliciAdi;
    private String etkinlikBasligi;
    private String kulupAdi;
    private String sertifikaBasligi;
    private LocalDateTime verilmeTarihi;
    private LocalDateTime gonderilmeTarihi;
}
