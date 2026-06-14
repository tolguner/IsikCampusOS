package com.isik.kampusos.yemek.dto;

import lombok.Data;

/** İşletme sahibinin genel bilgi değişikliği talebi (tek alan). */
@Data
public class SaticiDegisiklikTalebi {
    private String alanAdi;          // ad | aciklama | konumMetni | logoUrl | kapakGorselUrl | mutfakTuru
    private String talepEdilenDeger;
}
