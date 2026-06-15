package com.isik.kampusos.mesaj.service;

import com.isik.kampusos.mesaj.messaging.BildirimYayinlayici;
import com.isik.kampusos.mesaj.messaging.MesajAkisYoneticisi;
import com.isik.kampusos.mesaj.model.Konusma;
import com.isik.kampusos.mesaj.model.Mesaj;
import com.isik.kampusos.mesaj.repository.KonusmaDeposu;
import com.isik.kampusos.mesaj.repository.MesajDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MesajServisi {

    private final KonusmaDeposu konusmaDeposu;
    private final MesajDeposu mesajDeposu;
    private final KullaniciOzetIstemcisi kullaniciOzetIstemcisi;
    private final MesajAkisYoneticisi akisYoneticisi;
    private final BildirimYayinlayici bildirimYayinlayici;

    // --- Servisler-arası (iç) ---

    /** Konuşmayı (modul,baglamId) ile bulur-veya-oluşturur; katılımcı/başlığı günceller, ACIK yapar. */
    @Transactional
    public Konusma konusmaAcVeyaGuncelle(String modul, String baglamId, List<String> katilimcilar, String baslik) {
        Konusma k = konusmaDeposu.findByModulAndBaglamId(modul, baglamId).orElseGet(() -> Konusma.builder()
                .modul(modul).baglamId(baglamId).build());
        if (katilimcilar != null) k.getKatilimcilar().addAll(katilimcilar);
        if (baslik != null && !baslik.isBlank()) k.setBaslik(baslik);
        k.setDurum(Konusma.Durum.ACIK);
        return konusmaDeposu.save(k);
    }

    @Transactional
    public void konusmaKapat(String modul, String baglamId) {
        konusmaDeposu.findByModulAndBaglamId(modul, baglamId).ifPresent(k -> {
            k.setDurum(Konusma.Durum.KAPALI);
            konusmaDeposu.save(k);
        });
    }

    // --- Kullanıcı uçları ---

    public List<Konusma> konusmalarim(String kullaniciId) {
        List<Konusma> liste = konusmaDeposu.findByKatilimcilarContainingOrderBySonMesajTarihiDesc(kullaniciId);
        // Karşı tarafların adlarını topluca çöz.
        Set<String> digerIdler = new HashSet<>();
        liste.forEach(k -> k.getKatilimcilar().forEach(id -> { if (!id.equals(kullaniciId)) digerIdler.add(id); }));
        var ozetler = kullaniciOzetIstemcisi.ozetler(digerIdler);
        liste.forEach(k -> {
            zenginlestir(k, kullaniciId, ozetler);
            Mesaj son = mesajDeposu.findFirstByKonusmaIdOrderByOlusturulmaTarihiDesc(k.getId());
            if (son != null) k.setSonMesajOzeti(son.getIcerik());
        });
        return liste;
    }

    public Konusma konusmaBaglamdan(String kullaniciId, String modul, String baglamId) {
        Konusma k = konusmaDeposu.findByModulAndBaglamId(modul, baglamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konuşma bulunamadı."));
        uyelikDogrula(k, kullaniciId);
        zenginlestir(k, kullaniciId, kullaniciOzetIstemcisi.ozetler(k.getKatilimcilar()));
        return k;
    }

    /** Konuşmanın mesajlarını döndürür ve okuma işaretini günceller. */
    @Transactional
    public List<Mesaj> mesajlar(String kullaniciId, String konusmaId) {
        Konusma k = konusmaBul(konusmaId);
        uyelikDogrula(k, kullaniciId);
        List<Mesaj> mesajlar = mesajDeposu.findByKonusmaIdOrderByOlusturulmaTarihiAsc(konusmaId);
        var ozetler = kullaniciOzetIstemcisi.ozetler(k.getKatilimcilar());
        mesajlar.forEach(m -> {
            var o = ozetler.get(m.getGondericiKullaniciId());
            if (o != null) m.setGondericiAdSoyad(o.adSoyad());
        });
        // Okundu olarak işaretle.
        k.getSonOkumalar().put(kullaniciId, LocalDateTime.now());
        konusmaDeposu.save(k);
        return mesajlar;
    }

    @Transactional
    public Mesaj mesajGonder(String kullaniciId, String konusmaId, String icerik) {
        if (icerik == null || icerik.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mesaj boş olamaz.");
        }
        Konusma k = konusmaBul(konusmaId);
        uyelikDogrula(k, kullaniciId);
        if (k.getDurum() == Konusma.Durum.KAPALI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu konuşma kapalı; mesaj gönderilemez.");
        }
        Mesaj mesaj = mesajDeposu.save(Mesaj.builder()
                .konusmaId(konusmaId)
                .gondericiKullaniciId(kullaniciId)
                .icerik(icerik.trim().length() > 2000 ? icerik.trim().substring(0, 2000) : icerik.trim())
                .build());
        k.setSonMesajTarihi(mesaj.getOlusturulmaTarihi());
        k.getSonOkumalar().put(kullaniciId, mesaj.getOlusturulmaTarihi()); // gönderen için okundu
        konusmaDeposu.save(k);

        // Gönderen adını ekle, alıcılara anlık SSE + bildirim.
        var ozetler = kullaniciOzetIstemcisi.ozetler(List.of(kullaniciId));
        String gonderenAdi = ozetler.containsKey(kullaniciId) ? ozetler.get(kullaniciId).adSoyad() : null;
        mesaj.setGondericiAdSoyad(gonderenAdi);

        Set<String> alicilar = new HashSet<>(k.getKatilimcilar());
        alicilar.remove(kullaniciId);
        akisYoneticisi.yayinla(alicilar, mesaj);
        String ozet = mesaj.getIcerik().length() > 80 ? mesaj.getIcerik().substring(0, 80) + "…" : mesaj.getIcerik();
        alicilar.forEach(a -> bildirimYayinlayici.mesajBildir(a, gonderenAdi, ozet));
        return mesaj;
    }

    @Transactional
    public void okunduIsaretle(String kullaniciId, String konusmaId) {
        Konusma k = konusmaBul(konusmaId);
        uyelikDogrula(k, kullaniciId);
        k.getSonOkumalar().put(kullaniciId, LocalDateTime.now());
        konusmaDeposu.save(k);
    }

    public long okunmamisToplam(String kullaniciId) {
        return konusmaDeposu.findByKatilimcilarContainingOrderBySonMesajTarihiDesc(kullaniciId).stream()
                .mapToLong(k -> okunmamisSayisi(k, kullaniciId)).sum();
    }

    // --- Yardımcılar ---

    private void zenginlestir(Konusma k, String kullaniciId, Map<String, KullaniciOzetIstemcisi.KullaniciOzeti> ozetler) {
        k.getKatilimcilar().stream().filter(id -> !id.equals(kullaniciId)).findFirst()
                .map(ozetler::get).ifPresent(o -> k.setKarsiTarafAdSoyad(o.adSoyad()));
        k.setOkunmamisSayisi(okunmamisSayisi(k, kullaniciId));
    }

    private long okunmamisSayisi(Konusma k, String kullaniciId) {
        LocalDateTime sonOkuma = k.getSonOkumalar().get(kullaniciId);
        return sonOkuma == null
                ? mesajDeposu.countByKonusmaIdAndGondericiKullaniciIdNot(k.getId(), kullaniciId)
                : mesajDeposu.countByKonusmaIdAndGondericiKullaniciIdNotAndOlusturulmaTarihiAfter(k.getId(), kullaniciId, sonOkuma);
    }

    private Konusma konusmaBul(String konusmaId) {
        return konusmaDeposu.findById(konusmaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konuşma bulunamadı."));
    }

    private void uyelikDogrula(Konusma k, String kullaniciId) {
        if (!k.getKatilimcilar().contains(kullaniciId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu konuşmanın katılımcısı değilsiniz.");
        }
    }
}
