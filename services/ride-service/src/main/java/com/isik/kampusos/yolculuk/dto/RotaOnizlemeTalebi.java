package com.isik.kampusos.yolculuk.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Form haritası için: sıralı noktalar → gerçek yol-ağı rota önizlemesi. */
@Data
public class RotaOnizlemeTalebi {
    private List<NoktaTalebi> noktalar = new ArrayList<>();
}
