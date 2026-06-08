package com.isik.kampusos.yemek.config;

import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Geliştirme verisi: örnek satıcı (Kampüs Kantini) + menü.
 * Satıcı, auth-service'teki sabit kantin kullanıcısına (kantin@isikun.edu.tr) bağlanır.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class VeriBesleyici implements CommandLineRunner {

    /** auth-service VeriBesleyici'deki KANTIN_KULLANICI_ID ile AYNI olmalı. */
    private static final String KANTIN_KULLANICI_ID = "f00d0000-0000-4000-8000-000000000001";

    private final SaticiDeposu saticiDeposu;
    private final MenuOgesiDeposu menuOgesiDeposu;

    @Override
    public void run(String... args) {
        if (saticiDeposu.findByYoneticiKullaniciId(KANTIN_KULLANICI_ID).isPresent()) {
            return;
        }

        Satici kantin = saticiDeposu.save(Satici.builder()
                .ad("Kampüs Kantini")
                .aciklama("Sıcak yemekler, atıştırmalıklar ve içecekler.")
                .konumMetni("Merkez Kampüs, A Blok zemin kat")
                .yoneticiKullaniciId(KANTIN_KULLANICI_ID)
                .acik(true)
                .durum(Satici.SaticiDurumu.AKTIF)
                .build());

        List<MenuOgesi> menu = List.of(
                menuOgesi(kantin.getId(), "Tavuklu Sandviç", "Izgara tavuk, marul, domates", "Sandviç", "65.00"),
                menuOgesi(kantin.getId(), "Ayran", "30 cl", "İçecek", "15.00"),
                menuOgesi(kantin.getId(), "Mercimek Çorbası", "Günün çorbası", "Çorba", "40.00"),
                menuOgesi(kantin.getId(), "Patates Kızartması", "Orta boy", "Atıştırmalık", "45.00"),
                menuOgesi(kantin.getId(), "Su", "50 cl", "İçecek", "10.00")
        );
        menuOgesiDeposu.saveAll(menu);

        log.info("✅ Seed: Kampüs Kantini satıcısı + {} menü öğesi oluşturuldu (yönetici id={})",
                menu.size(), KANTIN_KULLANICI_ID);
    }

    private MenuOgesi menuOgesi(String saticiId, String ad, String aciklama, String kategori, String fiyat) {
        return MenuOgesi.builder()
                .saticiId(saticiId)
                .ad(ad)
                .aciklama(aciklama)
                .kategori(kategori)
                .fiyat(new BigDecimal(fiyat))
                .mevcut(true)
                .durum(MenuOgesi.MenuDurumu.AKTIF)
                .build();
    }
}
