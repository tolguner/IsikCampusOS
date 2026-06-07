package com.isik.kampusos.kimlik.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Sistem yöneticisi kullanıcı yönetim paneli yanıtı (tüm roller). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KullaniciYonetimYaniti {
    private String id;
    private String eposta;
    private String roller;
    private String ad;
    private String soyad;
    private String ogrenciNumarasi;
    private String fakulte;
    private String bolum;
    private Integer kayitYili;
    private String tcKimlikMaskeli;
    private String durum;
    private boolean epostaDogrulandi;
    private boolean sifreDegistirmeli;
    private LocalDateTime sonGirisTarihi;
    private LocalDateTime olusturulmaTarihi;
    private LocalDateTime guncellenmeTarihi;
    /** Yalnızca yeni oluşturmada, üretilen geçici şifre döndürülür (aksi halde null). */
    private String geciciSifre;
}
