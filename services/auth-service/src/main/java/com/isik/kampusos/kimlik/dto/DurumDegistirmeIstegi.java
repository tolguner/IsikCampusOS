package com.isik.kampusos.kimlik.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DurumDegistirmeIstegi {
    private String yeniDurum; // AKTIF, PASIF, MEZUN, ILISIGI_KESILMIS
    private String neden;
}
