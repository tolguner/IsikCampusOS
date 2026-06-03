package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.model.EtkinlikKatilimi;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikKatilimiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EtkinlikHatirlaticiZamanlayici {

    private final EtkinlikDeposu etkinlikDeposu;
    private final EtkinlikKatilimiDeposu etkinlikKatilimiDeposu;
    private final BildirimServisi bildirimServisi;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void bekleyenEtkinlikHatirlatmalariGonder() {
        LocalDateTime simdi = LocalDateTime.now();
        List<Etkinlik> etkinlikler = etkinlikDeposu.findByDurumAndHatirlaticiEtkinTrue(Etkinlik.EtkinlikDurumu.YAYINLANDI);

        for (Etkinlik etkinlik : etkinlikler) {
            if (etkinlik.getBaslangicTarihi() == null || etkinlik.getBaslangicTarihi().isBefore(simdi)) {
                continue;
            }

            long baslangicaKalanDakika = Duration.between(simdi, etkinlik.getBaslangicTarihi()).toMinutes();
            Set<Integer> gonderilenZamanlar = dakikalariCoz(etkinlik.getGonderilenHatirlatmaZamanlariDakika());
            boolean degisti = false;

            for (Integer zaman : dakikalariCoz(etkinlik.getHatirlatmaZamanlariDakika())) {
                if (gonderilenZamanlar.contains(zaman)) {
                    continue;
                }
                if (baslangicaKalanDakika <= zaman && baslangicaKalanDakika >= Math.max(0, zaman - 1)) {
                    hatirlatmaGonder(etkinlik, zaman);
                    gonderilenZamanlar.add(zaman);
                    degisti = true;
                }
            }

            if (degisti) {
                etkinlik.setGonderilenHatirlatmaZamanlariDakika(dakikalariBirlestir(gonderilenZamanlar));
                etkinlikDeposu.save(etkinlik);
            }
        }
    }

    private void hatirlatmaGonder(Etkinlik etkinlik, int zamanDakika) {
        List<EtkinlikKatilimi> alicilar = etkinlikKatilimiDeposu.findByEtkinlikIdAndDurumInOrderByOlusturulmaTarihiAsc(
                etkinlik.getId(),
                List.of(EtkinlikKatilimi.KatilimDurumu.ONAYLANDI, EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR)
        );

        String sureMetni = zamanDakika >= 60 && zamanDakika % 60 == 0
                ? (zamanDakika / 60) + " saat"
                : zamanDakika + " dakika";
        String konum = etkinlik.getEtkinlikTuru() == Etkinlik.EtkinlikTuru.CEVRIMICI
                ? "Online: " + bosuMetneDonustur(etkinlik.getCevrimiciPlatform())
                : bosuMetneDonustur(etkinlik.getKonumAdi() != null ? etkinlik.getKonumAdi() : etkinlik.getKonum());

        for (EtkinlikKatilimi katilim : alicilar) {
            bildirimServisi.kullaniciDuyurusuBilgilendir(
                    katilim.getKullaniciId(),
                    "Etkinlik hatırlatması: " + etkinlik.getBaslik(),
                    etkinlik.getBaslik() + " etkinliği yaklaşık " + sureMetni + " sonra başlayacak.\n\nBaşlangıç: "
                            + etkinlik.getBaslangicTarihi() + "\nKonum: " + konum,
                    etkinlik.getCevrimiciToplantiUrl(),
                    etkinlik.getEtkinlikTuru() == Etkinlik.EtkinlikTuru.CEVRIMICI ? "Toplantıya katıl" : null,
                    etkinlik.getAfisResmiUrl(),
                    "system",
                    etkinlik.getKulup().getAd()
            );
        }
    }

    private Set<Integer> dakikalariCoz(String deger) {
        if (deger == null || deger.isBlank()) {
            return new HashSet<>();
        }
        return Arrays.stream(deger.split(","))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(Integer::parseInt)
                .filter(item -> item > 0)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private String dakikalariBirlestir(Set<Integer> dakikalar) {
        return dakikalar.stream()
                .sorted((left, right) -> Integer.compare(right, left))
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private String bosuMetneDonustur(String deger) {
        return deger == null || deger.isBlank() ? "Bilgi bekleniyor" : deger;
    }
}
