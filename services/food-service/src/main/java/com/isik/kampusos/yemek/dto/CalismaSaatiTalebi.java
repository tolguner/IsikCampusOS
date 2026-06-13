package com.isik.kampusos.yemek.dto;

import lombok.Data;

import java.util.List;

/** İşletmecinin haftalık çalışma saatlerini topluca kaydetmesi. */
@Data
public class CalismaSaatiTalebi {
    private List<Gun> gunler;

    @Data
    public static class Gun {
        private short gun;          // 1=Pazartesi … 7=Pazar
        private String acilis;      // "HH:mm" (kapalı ise yok sayılır)
        private String kapanis;     // "HH:mm"
        private boolean kapali;     // o gün kapalı
    }
}
