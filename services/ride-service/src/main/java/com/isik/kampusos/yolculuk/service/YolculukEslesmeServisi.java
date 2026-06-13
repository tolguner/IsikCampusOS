package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.model.RotaDuragi;
import com.isik.kampusos.yolculuk.model.YolculukIlani;
import com.isik.kampusos.yolculuk.model.YolculukTalebi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class YolculukEslesmeServisi {

    public static boolean rotaKapsiyorMu(List<RotaDuragi> rota, String binis, String inis) {
        Optional<Integer> binisSirasi = durakSirasi(rota, binis);
        Optional<Integer> inisSirasi = durakSirasi(rota, inis);
        return binisSirasi.isPresent() && inisSirasi.isPresent() && binisSirasi.get() < inisSirasi.get();
    }

    public static Optional<Integer> durakDakikasi(List<RotaDuragi> rota, String durakAdi) {
        return rota.stream()
                .filter(d -> ayniDurak(d.getAd(), durakAdi))
                .min(Comparator.comparingInt(RotaDuragi::getSira))
                .map(RotaDuragi::getTahminiDakika);
    }

    public static boolean kabulEdilebilirMi(YolculukIlani ilan) {
        return ilan.getDurum() == null || (ilan.getDurum() == YolculukIlani.IlanDurumu.AKTIF
                && ilan.getKabulEdilenKoltukSayisi() < ilan.getKoltukSayisi());
    }

    public static void talebiKabulEt(YolculukIlani ilan, YolculukTalebi talep) {
        if (talep.getDurum() != YolculukTalebi.TalepDurumu.BEKLEMEDE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yalnızca bekleyen talepler kabul edilebilir.");
        }
        if (!kabulEdilebilirMi(ilan) || ilan.bosKoltukSayisi() < talep.getKoltukSayisi()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu ilanda yeterli boş koltuk yok.");
        }
        ilan.setKabulEdilenKoltukSayisi(ilan.getKabulEdilenKoltukSayisi() + talep.getKoltukSayisi());
        if (ilan.getKabulEdilenKoltukSayisi() >= ilan.getKoltukSayisi()) {
            ilan.setDurum(YolculukIlani.IlanDurumu.DOLU);
        }
        talep.setDurum(YolculukTalebi.TalepDurumu.KABUL_EDILDI);
    }

    private static Optional<Integer> durakSirasi(List<RotaDuragi> rota, String durakAdi) {
        return rota.stream()
                .filter(d -> ayniDurak(d.getAd(), durakAdi))
                .min(Comparator.comparingInt(RotaDuragi::getSira))
                .map(RotaDuragi::getSira);
    }

    private static boolean ayniDurak(String sol, String sag) {
        return normalize(sol).equals(normalize(sag));
    }

    private static String normalize(String deger) {
        return deger == null ? "" : deger.trim().toLowerCase(java.util.Locale.forLanguageTag("tr-TR"));
    }
}
