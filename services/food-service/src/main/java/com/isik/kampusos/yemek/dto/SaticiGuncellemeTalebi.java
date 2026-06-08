package com.isik.kampusos.yemek.dto;

import lombok.Data;

/** İşletme yöneticisinin kendi satıcısını güncellemesi. */
@Data
public class SaticiGuncellemeTalebi {
    private String ad;
    private String aciklama;
    private String konumMetni;
    private String logoUrl;
    private Boolean acik;
}
