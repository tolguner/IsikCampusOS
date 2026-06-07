package com.isik.kampusos.kulup.service;

import com.isik.kampusos.kulup.dto.DenetimGunluguYaniti;
import com.isik.kampusos.kulup.model.DenetimGunlugu;
import com.isik.kampusos.kulup.repository.DenetimGunluguDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DenetimGunluguServisi {

    private final DenetimGunluguDeposu denetimGunluguDeposu;

    public void kaydet(DenetimGunlugu.VarlikTuru varlikTuru,
                       String varlikId,
                       String islem,
                       String yapanId,
                       String yapanRol,
                       String mesaj) {
        denetimGunluguDeposu.save(DenetimGunlugu.builder()
                .varlikTuru(varlikTuru)
                .varlikId(varlikId)
                .islem(islem)
                .yapanId(yapanId)
                .yapanRol(yapanRol)
                .mesaj(mesaj)
                .build());
    }

    public List<DenetimGunluguYaniti> listele(DenetimGunlugu.VarlikTuru varlikTuru,
                                              String varlikId,
                                              String islem,
                                              String yapanId,
                                              LocalDate baslangic,
                                              LocalDate bitis,
                                              String aramaKelimesi) {
        String normalizeArama = normalize(aramaKelimesi);
        return denetimGunluguDeposu.findByVarlikTuruAndVarlikIdOrderByOlusturulmaTarihiDesc(varlikTuru, varlikId)
                .stream()
                .filter(log -> islem == null || islem.isBlank() || islem.equalsIgnoreCase(log.getIslem()))
                .filter(log -> yapanId == null || yapanId.isBlank() || yapanId.equalsIgnoreCase(log.getYapanId()))
                .filter(log -> baslangic == null || !log.getOlusturulmaTarihi().toLocalDate().isBefore(baslangic))
                .filter(log -> bitis == null || !log.getOlusturulmaTarihi().toLocalDate().isAfter(bitis))
                .filter(log -> normalizeArama == null
                        || normalize(log.getMesaj()).contains(normalizeArama)
                        || normalize(log.getIslem()).contains(normalizeArama)
                        || normalize(log.getYapanId()).contains(normalizeArama))
                .map(this::yanitaDonustur)
                .toList();
    }

    /** Sistem yöneticisi: tüm denetim günlükleri (en yeni 500), opsiyonel filtrelerle. */
    public List<DenetimGunluguYaniti> tumunuListele(DenetimGunlugu.VarlikTuru varlikTuru,
                                                    String islem,
                                                    String yapanId,
                                                    LocalDate baslangic,
                                                    LocalDate bitis,
                                                    String aramaKelimesi) {
        String normalizeArama = normalize(aramaKelimesi);
        return denetimGunluguDeposu.findTop500ByOrderByOlusturulmaTarihiDesc()
                .stream()
                .filter(log -> varlikTuru == null || log.getVarlikTuru() == varlikTuru)
                .filter(log -> islem == null || islem.isBlank() || islem.equalsIgnoreCase(log.getIslem()))
                .filter(log -> yapanId == null || yapanId.isBlank() || yapanId.equalsIgnoreCase(log.getYapanId()))
                .filter(log -> baslangic == null || !log.getOlusturulmaTarihi().toLocalDate().isBefore(baslangic))
                .filter(log -> bitis == null || !log.getOlusturulmaTarihi().toLocalDate().isAfter(bitis))
                .filter(log -> normalizeArama == null
                        || normalize(log.getMesaj()).contains(normalizeArama)
                        || normalize(log.getIslem()).contains(normalizeArama)
                        || normalize(log.getYapanId()).contains(normalizeArama))
                .map(this::yanitaDonustur)
                .toList();
    }

    private DenetimGunluguYaniti yanitaDonustur(DenetimGunlugu log) {
        return DenetimGunluguYaniti.builder()
                .id(log.getId())
                .varlikTuru(log.getVarlikTuru().name())
                .varlikId(log.getVarlikId())
                .islem(log.getIslem())
                .islemYapanId(log.getYapanId())
                .islemYapanRol(log.getYapanRol())
                .mesaj(log.getMesaj())
                .metaVeri(log.getMetaVeri())
                .olusturulmaTarihi(log.getOlusturulmaTarihi())
                .build();
    }

    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.toLowerCase(java.util.Locale.forLanguageTag("tr-TR")).trim();
    }
}
