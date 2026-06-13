package com.isik.kampusos.tesis.config;

import com.isik.kampusos.tesis.model.Tesis;
import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import com.isik.kampusos.tesis.model.TesisPolitikasi;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import com.isik.kampusos.tesis.repository.TesisKullanilabilirlikKuraliDeposu;
import com.isik.kampusos.tesis.repository.TesisPolitikasiDeposu;
import com.isik.kampusos.tesis.repository.TesisDeposu;
import com.isik.kampusos.tesis.repository.TesisKaynagiDeposu;
import com.isik.kampusos.tesis.repository.RezervasyonYoklamaDeposu;
import com.isik.kampusos.tesis.repository.TesisRezervasyonDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class SporTesisleriVeriTohumlayici implements CommandLineRunner {

    private static final String TOHUMLAYICI_AKTOR = "atakan.cetiner@isikun.edu.tr";

    private final TesisDeposu tesisDeposu;
    private final TesisKaynagiDeposu tesisKaynagiDeposu;
    private final TesisPolitikasiDeposu tesisPolitikasiDeposu;
    private final TesisKullanilabilirlikKuraliDeposu tesisKullanilabilirlikKuraliDeposu;
    private final RezervasyonYoklamaDeposu rezervasyonYoklamaDeposu;
    private final TesisRezervasyonDeposu tesisRezervasyonDeposu;

    @Override
    @Transactional
    public void run(String... args) {
        if (tesisDeposu.findByAdAndSilinmeTarihiIsNull("Plaj Voleybolu Sahası").isPresent()) {
            return;
        }

        // Önceki eski çatı tesis verilerini temizle
        tesisDeposu.findByAdAndSilinmeTarihiIsNull("Işık Üniversitesi Spor Tesisleri").ifPresent(old -> {
            log.info("Eski çatı tesis verileri temizleniyor...");
            rezervasyonYoklamaDeposu.deleteAll();
            tesisRezervasyonDeposu.deleteAll();
            tesisKullanilabilirlikKuraliDeposu.deleteAll();
            tesisKaynagiDeposu.deleteAll();
            tesisPolitikasiDeposu.deleteAll();
            tesisDeposu.delete(old);
        });

        sportsResources().forEach(seed -> {
            // 1. Bağımsız Tesis Oluştur
            Tesis tesis = tesisDeposu.save(Tesis.builder()
                    .ad(seed.name())
                    .tesisTuru(Tesis.TesisTuru.SPOR_ALANI)
                    .aciklama(seed.name() + " - Spor Müdürlüğü tarafından yönetilen spor alanı.")
                    .konumMetni("Şile Kampüsü Spor Tesisleri")
                    .kapasite(seed.capacity())
                    .durum(Tesis.TesisDurumu.AKTIF)
                    .olusturan(TOHUMLAYICI_AKTOR)
                    .guncelleyen(TOHUMLAYICI_AKTOR)
                    .build());

            // 2. Tesis Politikası Oluştur
            tesisPolitikasiDeposu.save(TesisPolitikasi.builder()
                    .tesis(tesis)
                    .rezervasyonPenceresiGun(14)
                    .minimumBildirimDakika(120)
                    .iptalLimitDakika(120)
                    .yoklamaZorunlu(true)
                    .otomatikGelmemeDakika(15)
                    .maksimumRezervasyonSureDakika(120)
                    .durum(TesisPolitikasi.PolitikaDurumu.AKTIF)
                    .guncelleyen(TOHUMLAYICI_AKTOR)
                    .build());

            // 3. Arka Planda Varsayılan Kaynak Oluştur
            TesisKaynagi kaynak = TesisKaynagi.builder()
                    .tesis(tesis)
                    .kaynakKodu("DEFAULT_" + tesis.getId().substring(0, 8).toUpperCase())
                    .ad(tesis.getAd())
                    .kaynakTuru(TesisKaynagi.KaynakTuru.SPOR_ALANI)
                    .kapasite(tesis.getKapasite())
                    .rezervasyonYapilabilir(true)
                    .durum(TesisKaynagi.KaynakDurumu.AKTIF)
                    .olusturan(TOHUMLAYICI_AKTOR)
                    .guncelleyen(TOHUMLAYICI_AKTOR)
                    .build();
            tesisKaynagiDeposu.save(kaynak);

            // 4. Haftalık Uygunluk Saatlerini Tohumla
            seedWeeklyAvailability(kaynak);
        });

        log.info("✅ Seed: Bağımsız spor tesisleri ve saat tanımları başarıyla tohumlandı.");
    }

    private List<ResourceSeed> sportsResources() {
        return List.of(
                new ResourceSeed("KAPALI_SPOR_SALONU", "Kapalı Spor Salonu", 120),
                new ResourceSeed("BASKETBOL_1", "Basketbol Sahası 1", 20),
                new ResourceSeed("BASKETBOL_2", "Basketbol Sahası 2", 20),
                new ResourceSeed("BUYUK_FUTBOL", "Büyük Futbol Sahası", 50),
                new ResourceSeed("PLAJ_VOLEYBOLU", "Plaj Voleybolu Sahası", 12),
                new ResourceSeed("TENIS", "Tenis Sahası", 4),
                new ResourceSeed("HALI_SAHA", "Halı Saha", 14)
        );
    }

    private void seedWeeklyAvailability(TesisKaynagi kaynak) {
        for (int gun = 1; gun <= 7; gun++) {
            tesisKullanilabilirlikKuraliDeposu.save(TesisKullanilabilirlikKurali.builder()
                    .kaynak(kaynak)
                    .haftaninGunu(gun)
                    .baslangicSaati(LocalTime.of(8, 0))
                    .bitisSaati(LocalTime.of(22, 0))
                    .durum(TesisKullanilabilirlikKurali.KuralDurumu.AKTIF)
                    .guncelleyen(TOHUMLAYICI_AKTOR)
                    .build());
        }
    }

    private record ResourceSeed(String code, String name, int capacity) {
    }
}
