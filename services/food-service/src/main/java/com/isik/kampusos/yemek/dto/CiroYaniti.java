package com.isik.kampusos.yemek.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** İşletme online sipariş ciro raporu. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CiroYaniti {
    private long siparisSayisi;
    private BigDecimal toplamCiro;
    private BigDecimal nakitToplam;
    private BigDecimal krediKartiToplam;
}
