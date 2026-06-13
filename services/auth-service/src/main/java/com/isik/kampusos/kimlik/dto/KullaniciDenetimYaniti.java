package com.isik.kampusos.kimlik.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Kullanıcı işlemleri denetim kaydı yanıtı (frontend DenetimKaydi ile uyumlu). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KullaniciDenetimYaniti {
    private String id;
    private String varlikTuru;
    private String varlikId;
    private String islem;
    private String islemYapanId;
    private String islemYapanRol;
    private String mesaj;
    private LocalDateTime olusturulmaTarihi;
}
