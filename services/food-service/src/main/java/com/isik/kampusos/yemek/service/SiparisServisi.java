package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.CiroKaydi;
import com.isik.kampusos.yemek.dto.CiroYaniti;
import com.isik.kampusos.yemek.dto.SiparisOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.SiparisOnizlemeYaniti;
import com.isik.kampusos.yemek.messaging.AuthKimlikIstemcisi;
import com.isik.kampusos.yemek.messaging.BildirimYayinlayici;
import com.isik.kampusos.yemek.messaging.ProfilIstemcisi;
import com.isik.kampusos.yemek.model.IsletmePersoneli;
import com.isik.kampusos.yemek.repository.IsletmePersonelDeposu;
import com.isik.kampusos.yemek.model.Kampanya;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.model.SiparisKalemi;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import com.isik.kampusos.yemek.repository.SiparisDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiparisServisi {

    /** Bu süre içinde onaylanmayan siparişler otomatik reddedilir. */
    @Value("${siparis.zaman-asimi-dakika:15}")
    private long zamanAsimiDakika;

    private final SiparisDeposu siparisDeposu;
    private final SaticiDeposu saticiDeposu;
    private final MenuOgesiDeposu menuOgesiDeposu;
    private final BildirimYayinlayici bildirimYayinlayici;
    private final com.isik.kampusos.yemek.messaging.KonusmaIstemcisi konusmaIstemcisi;
    private final SaticiServisi saticiServisi;
    private final AuthKimlikIstemcisi authIstemci;
    private final ProfilIstemcisi profilIstemci;
    private final IsletmePersonelDeposu personelDeposu;

    // --- Öğrenci ---

    /** Sepet hesabının ortak sonucu — sipariş kaydı ve ön-izleme aynı mantığı kullanır. */
    private record Hesap(Satici satici, List<SiparisKalemi> kalemler, BigDecimal araToplam,
                         BigDecimal teslimatUcreti, BigDecimal indirim, Kampanya kampanya, BigDecimal toplam) {}

    @Transactional
    public Siparis siparisVer(String musteriId, SiparisOlusturmaTalebi talep) {
        Siparis.TeslimatTuru teslimatTuru = teslimatTuruCoz(talep.getTeslimatTuru());
        // Gel-al'da adres gerekmez (işletmeden alınır); adrese teslimatta zorunlu.
        if (teslimatTuru == Siparis.TeslimatTuru.ADRESE_TESLIMAT
                && (talep.getTeslimAdresi() == null || talep.getTeslimAdresi().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teslim adresi zorunludur.");
        }
        Siparis.OdemeYontemi odeme = odemeCoz(talep.getOdemeYontemi());

        Hesap h = hesapla(talep);
        Satici satici = h.satici();

        // Minimum sepet kontrolü (yalnızca gerçek siparişte engelleyici)
        BigDecimal minSepet = satici.getMinimumSepetTutari() != null ? satici.getMinimumSepetTutari() : BigDecimal.ZERO;
        if (h.araToplam().compareTo(minSepet) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu satıcının minimum sepet tutarı " + minSepet + " ₺. Sepetinizi tamamlayın.");
        }

        // İletişim izni backend'de zorlanır: izin yoksa telefon hiç kaydedilmez.
        String telefon = talep.getTelefon();
        if (telefon != null && !telefon.isBlank() && !profilIstemci.iletisimIzniVarMi(musteriId)) {
            telefon = null;
        }

        Siparis siparis = Siparis.builder()
                .saticiId(satici.getId())
                .musteriKullaniciId(musteriId)
                .durum(Siparis.SiparisDurumu.BEKLEMEDE)
                .araToplam(h.araToplam())
                .teslimatUcreti(h.teslimatUcreti())
                .indirimTutari(h.indirim())
                .kampanyaId(h.kampanya() != null ? h.kampanya().getId() : null)
                .toplamTutar(h.toplam())
                .teslimatTuru(teslimatTuru)
                .teslimAdresi(teslimatTuru == Siparis.TeslimatTuru.GEL_AL
                        ? "Gel-Al — işletmeden teslim alınacak"
                        : talep.getTeslimAdresi().trim())
                .odemeYontemi(odeme)
                .telefon(telefon)
                .musteriNotu(talep.getMusteriNotu())
                .kalemler(h.kalemler())
                .build();
        Siparis kaydedilen = siparisDeposu.save(siparis);

        // İşletme tarafına (sahip + aktif personel) anlık bildirim — sipariş beklemede kalmasın.
        isletmeyeYayinla(satici, "Yeni sipariş 🛎️",
                "#" + kaydedilen.getId().substring(0, 8) + " — " + kaydedilen.getToplamTutar()
                        + " ₺ tutarında yeni sipariş onay bekliyor.");
        return kaydedilen;
    }

    /** Sipariş öncesi gerçek tutar dökümü (kampanya dahil) — kayıt oluşturmaz. */
    public SiparisOnizlemeYaniti onizleme(SiparisOlusturmaTalebi talep) {
        Hesap h = hesapla(talep);
        BigDecimal minSepet = h.satici().getMinimumSepetTutari() != null
                ? h.satici().getMinimumSepetTutari() : BigDecimal.ZERO;
        return SiparisOnizlemeYaniti.builder()
                .araToplam(h.araToplam())
                .teslimatUcreti(h.teslimatUcreti())
                .indirimTutari(h.indirim())
                .kampanyaAd(h.kampanya() != null ? h.kampanya().getAd() : null)
                .toplamTutar(h.toplam())
                .minimumSepetTutari(minSepet)
                .minimumKarsilandi(h.araToplam().compareTo(minSepet) >= 0)
                .build();
    }

    /** Sepet doğrulama + tutar/kampanya hesabı (siparisVer ve onizleme ortak çekirdeği). */
    private Hesap hesapla(SiparisOlusturmaTalebi talep) {
        if (talep.getKalemler() == null || talep.getKalemler().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sepet boş olamaz.");
        }
        Satici satici = saticiDeposu.findById(talep.getSaticiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        if (!saticiServisi.acikMi(satici)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Satıcı şu anda siparişe kapalı.");
        }

        List<SiparisKalemi> kalemler = new ArrayList<>();
        BigDecimal araToplam = BigDecimal.ZERO;
        for (SiparisOlusturmaTalebi.KalemTalebi kt : talep.getKalemler()) {
            if (kt.getAdet() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adet en az 1 olmalıdır.");
            }
            MenuOgesi oge = menuOgesiDeposu.findById(kt.getMenuOgesiId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menü öğesi bulunamadı."));
            if (!oge.getSaticiId().equals(satici.getId()) || oge.getDurum() != MenuOgesi.MenuDurumu.AKTIF || !oge.isMevcut()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ürün şu anda sunulamıyor: " + oge.getAd());
            }

            // Seçilen opsiyonları doğrula + ek fiyat + özet hesapla
            List<String> secilenIdler = kt.getSecilenSecenekIdleri() != null ? kt.getSecilenSecenekIdleri() : List.of();
            BigDecimal ekFiyat = BigDecimal.ZERO;
            List<String> secimAdlari = new ArrayList<>();
            for (com.isik.kampusos.yemek.model.MenuSecenekGrubu grup : oge.getSecenekGruplari()) {
                List<com.isik.kampusos.yemek.model.MenuSecenegi> grupSecimleri = grup.getSecenekler().stream()
                        .filter(sec -> secilenIdler.contains(sec.getId())).toList();
                if (grup.isZorunlu() && grupSecimleri.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            oge.getAd() + " için '" + grup.getAd() + "' seçimi zorunludur.");
                }
                if (grup.getTur() == com.isik.kampusos.yemek.model.MenuSecenekGrubu.SecenekTuru.TEK_SECIM
                        && grupSecimleri.size() > 1) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "'" + grup.getAd() + "' için yalnızca bir seçim yapılabilir.");
                }
                for (var sec : grupSecimleri) {
                    ekFiyat = ekFiyat.add(sec.getEkFiyat());
                    secimAdlari.add(sec.getAd());
                }
            }

            BigDecimal birimFiyat = oge.getFiyat().add(ekFiyat);
            BigDecimal kalemAraToplam = birimFiyat.multiply(BigDecimal.valueOf(kt.getAdet()));
            araToplam = araToplam.add(kalemAraToplam);
            kalemler.add(SiparisKalemi.builder()
                    .menuOgesiId(oge.getId())
                    .urunAdi(oge.getAd())
                    .birimFiyat(birimFiyat)
                    .adet(kt.getAdet())
                    .araToplam(kalemAraToplam)
                    .secimlerOzeti(secimAdlari.isEmpty() ? null : String.join(", ", secimAdlari))
                    .build());
        }

        // Gel-al'da teslimat ücreti alınmaz (öğrenci işletmeden kendisi alır).
        BigDecimal teslimatUcreti = teslimatTuruCoz(talep.getTeslimatTuru()) == Siparis.TeslimatTuru.GEL_AL
                ? BigDecimal.ZERO
                : (satici.getTeslimatUcreti() != null ? satici.getTeslimatUcreti() : BigDecimal.ZERO);

        // En iyi aktif kampanyayı uygula
        BigDecimal indirim = BigDecimal.ZERO;
        Kampanya enIyi = enIyiKampanya(araToplam, teslimatUcreti, saticiServisi.aktifKampanyalar(satici.getId()));
        if (enIyi != null) {
            indirim = kampanyaIndirimi(enIyi, araToplam, teslimatUcreti);
        }

        BigDecimal toplam = araToplam.add(teslimatUcreti).subtract(indirim).max(BigDecimal.ZERO);
        return new Hesap(satici, kalemler, araToplam, teslimatUcreti, indirim, enIyi, toplam);
    }

    /** Uygun kampanyalar arasından en yüksek indirimi sağlayanı seçer. */
    private Kampanya enIyiKampanya(BigDecimal araToplam, BigDecimal teslimat, List<Kampanya> kampanyalar) {
        Kampanya enIyi = null;
        BigDecimal enYuksek = BigDecimal.ZERO;
        for (Kampanya k : kampanyalar) {
            if (araToplam.compareTo(k.getMinSepetTutari()) < 0) continue;
            BigDecimal ind = kampanyaIndirimi(k, araToplam, teslimat);
            if (ind.compareTo(enYuksek) > 0) { enYuksek = ind; enIyi = k; }
        }
        return enIyi;
    }

    private BigDecimal kampanyaIndirimi(Kampanya k, BigDecimal araToplam, BigDecimal teslimat) {
        return switch (k.getTur()) {
            case YUZDE -> araToplam.multiply(k.getDeger()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case TUTAR -> k.getDeger().min(araToplam);
            case UCRETSIZ_TESLIMAT -> teslimat;
        };
    }

    public List<Siparis> benimSiparislerim(String musteriId, int limit) {
        List<Siparis> liste = siparisDeposu.findByMusteriKullaniciIdOrderByOlusturulmaTarihiDesc(
                musteriId, PageRequest.of(0, limitClamp(limit)));
        // Öğrenci "siparişimle kim ilgileniyor" görsün (güven artırıcı).
        isleyenAdlariniDoldur(musteriId, liste);
        return liste;
    }

    @Transactional
    public Siparis musteriIptal(String musteriId, String siparisId) {
        Siparis s = siparisDeposu.findById(siparisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sipariş bulunamadı."));
        if (!s.getMusteriKullaniciId().equals(musteriId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu sipariş size ait değil.");
        }
        if (s.getDurum() != Siparis.SiparisDurumu.BEKLEMEDE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yalnızca onay bekleyen sipariş iptal edilebilir.");
        }
        s.setDurum(Siparis.SiparisDurumu.IPTAL_EDILDI);
        s.setIptalTarihi(LocalDateTime.now());
        Siparis kaydedilen = siparisDeposu.save(s);
        konusmaIstemcisi.konusmaKapat("FOOD", s.getId());
        // İşletme tarafına haber ver — hazırlığa boşuna başlamasınlar.
        saticiDeposu.findById(s.getSaticiId()).ifPresent(satici ->
                isletmeyeYayinla(satici, "Sipariş iptal edildi",
                        "#" + s.getId().substring(0, 8) + " numaralı bekleyen sipariş müşteri tarafından iptal edildi."));
        return kaydedilen;
    }

    /** İşletme tarafındaki herkese (sahip + aktif personel) bildirim yayınlar. */
    private void isletmeyeYayinla(Satici satici, String baslik, String mesaj) {
        java.util.Set<String> alicilar = new java.util.LinkedHashSet<>();
        if (satici.getYoneticiKullaniciId() != null) alicilar.add(satici.getYoneticiKullaniciId());
        personelDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(satici.getId()).stream()
                .filter(p -> p.getDurum() == IsletmePersoneli.PersonelDurumu.AKTIF)
                .forEach(p -> alicilar.add(p.getKullaniciId()));
        alicilar.forEach(id -> bildirimYayinlayici.isletmeyeBildir(id, baslik, mesaj, satici.getAd()));
    }

    // --- İşletme yöneticisi ---

    public List<Siparis> saticiSiparisleri(String kullaniciId, int limit) {
        Satici satici = saticiServisi.saticiCozumle(kullaniciId);   // sahip veya personel
        List<Siparis> liste = siparisDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(
                satici.getId(), PageRequest.of(0, limitClamp(limit)));
        // Üstlenen personel adını çöz (kartlarda "Üstlenen: X" göstermek için).
        isleyenAdlariniDoldur(kullaniciId, liste);
        return liste;
    }

    private int limitClamp(int limit) {
        return Math.max(1, Math.min(limit, 200));
    }

    /** isleyen_kullanici_id'leri auth'tan toplu çözüp Transient isleyenAdi alanına yazar. */
    private void isleyenAdlariniDoldur(String cagiranId, List<Siparis> liste) {
        List<String> idler = liste.stream().map(Siparis::getIsleyenKullaniciId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        if (idler.isEmpty()) return;
        java.util.Map<String, String> adlar = authIstemci.adlariGetir(cagiranId, idler);
        liste.forEach(s -> {
            if (s.getIsleyenKullaniciId() != null) s.setIsleyenAdi(adlar.get(s.getIsleyenKullaniciId()));
        });
    }

    /**
     * Zaman aşımı: eşik süre içinde onaylanmayan siparişleri otomatik reddeder.
     * Öğrenci süresiz beklemez; iki tarafa da bildirim gider.
     */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void zamanAsimiBekleyenleriReddet() {
        LocalDateTime esik = LocalDateTime.now().minusMinutes(zamanAsimiDakika);
        List<Siparis> bekleyenler = siparisDeposu.findByDurumAndOlusturulmaTarihiBefore(
                Siparis.SiparisDurumu.BEKLEMEDE, esik);
        for (Siparis s : bekleyenler) {
            s.setDurum(Siparis.SiparisDurumu.REDDEDILDI);
            s.setRedNedeni("İşletme " + zamanAsimiDakika + " dakika içinde onaylayamadığı için otomatik iptal edildi.");
            s.setIptalTarihi(LocalDateTime.now());
            siparisDeposu.save(s);
            saticiDeposu.findById(s.getSaticiId()).ifPresent(satici -> {
                bildirimYayinlayici.siparisDurumBildir(s, satici.getAd(), "Siparişiniz otomatik iptal edildi",
                        "Siparişiniz işletme tarafından zamanında onaylanamadığı için otomatik iptal edildi.");
                isletmeyeYayinla(satici, "Sipariş zaman aşımı ⏱️",
                        "#" + s.getId().substring(0, 8) + " zamanında onaylanmadığı için otomatik iptal edildi.");
            });
            log.info("Sipariş zaman aşımıyla reddedildi: {}", s.getId());
        }
    }

    @Transactional
    public Siparis kabul(String yoneticiId, String siparisId, Integer tahminiDakika) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.BEKLEMEDE);
        v.siparis.setDurum(Siparis.SiparisDurumu.KABUL_EDILDI);
        v.siparis.setKabulTarihi(LocalDateTime.now());
        v.siparis.setIsleyenKullaniciId(yoneticiId);   // kabul eden personel/sahip — teslime kadar süreci o yürütür
        String mesaj = "Siparişiniz işletme tarafından onaylandı, hazırlanmaya başlanacak.";
        if (tahminiDakika != null && tahminiDakika > 0 && tahminiDakika <= 240) {
            v.siparis.setTahminiHazirDakika(tahminiDakika);
            mesaj = "Siparişiniz onaylandı. Tahmini hazırlık süresi: ~" + tahminiDakika + " dk.";
        }
        // Sipariş üstlenildi → müşteri ile işleyen personel arasında konuşma aç.
        konusmaIstemcisi.konusmaAc("FOOD", v.siparis.getId(),
                java.util.List.of(v.siparis.getMusteriKullaniciId(), yoneticiId),
                "Sipariş #" + v.siparis.getId().substring(0, 8));
        return kaydetVeBildir(v, "Siparişiniz onaylandı", mesaj);
    }

    @Transactional
    public Siparis reddet(String yoneticiId, String siparisId, String neden) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        if (v.siparis.getDurum() != Siparis.SiparisDurumu.BEKLEMEDE
                && v.siparis.getDurum() != Siparis.SiparisDurumu.KABUL_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu aşamada sipariş reddedilemez.");
        }
        v.siparis.setDurum(Siparis.SiparisDurumu.REDDEDILDI);
        v.siparis.setRedNedeni(neden);
        v.siparis.setIptalTarihi(LocalDateTime.now());
        v.siparis.setIsleyenKullaniciId(yoneticiId);   // reddeden personel/sahip
        konusmaIstemcisi.konusmaKapat("FOOD", v.siparis.getId());
        return kaydetVeBildir(v, "Siparişiniz reddedildi", "Siparişiniz reddedildi" + (neden != null && !neden.isBlank() ? ": " + neden : "."));
    }

    @Transactional
    public Siparis hazirla(String yoneticiId, String siparisId) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.KABUL_EDILDI);
        v.siparis.setDurum(Siparis.SiparisDurumu.HAZIRLANIYOR);
        return kaydetVeBildir(v, "Siparişiniz hazırlanıyor", "Siparişiniz hazırlanmaya başlandı.");
    }

    @Transactional
    public Siparis hazir(String yoneticiId, String siparisId) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.HAZIRLANIYOR);
        v.siparis.setDurum(Siparis.SiparisDurumu.HAZIR);
        v.siparis.setHazirTarihi(LocalDateTime.now());
        return kaydetVeBildir(v, "Siparişiniz hazır", "Siparişiniz hazır, birazdan yola çıkacak.");
    }

    @Transactional
    public Siparis yolda(String yoneticiId, String siparisId) {
        Veri v = sahiplikle(yoneticiId, siparisId, true);
        if (v.siparis.getTeslimatTuru() == Siparis.TeslimatTuru.GEL_AL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Gel-al siparişinde kurye aşaması yoktur; sipariş hazır olduğunda doğrudan teslim edilir.");
        }
        gecisGuard(v.siparis, Siparis.SiparisDurumu.HAZIR);
        v.siparis.setDurum(Siparis.SiparisDurumu.YOLDA);
        v.siparis.setYolaCikisTarihi(LocalDateTime.now());
        v.siparis.setKuryeKullaniciId(yoneticiId);   // yola çıkaran (kurye/personel/sahip) — denetim
        return kaydetVeBildir(v, "Siparişiniz yola çıktı", "Siparişiniz kurye ile yola çıktı.");
    }

    @Transactional
    public Siparis teslim(String yoneticiId, String siparisId, String tahsilEdilenOdeme) {
        Veri v = sahiplikle(yoneticiId, siparisId, true);
        // Gel-al: kurye aşaması atlanır, HAZIR'dan doğrudan teslim edilir.
        Siparis.SiparisDurumu beklenen = v.siparis.getTeslimatTuru() == Siparis.TeslimatTuru.GEL_AL
                ? Siparis.SiparisDurumu.HAZIR : Siparis.SiparisDurumu.YOLDA;
        gecisGuard(v.siparis, beklenen);
        Siparis.OdemeYontemi tahsil = odemeCoz(tahsilEdilenOdeme);
        v.siparis.setDurum(Siparis.SiparisDurumu.TESLIM_EDILDI);
        v.siparis.setTahsilEdilenOdeme(tahsil);
        v.siparis.setTeslimTarihi(LocalDateTime.now());
        konusmaIstemcisi.konusmaKapat("FOOD", v.siparis.getId());
        return kaydetVeBildir(v, "Siparişiniz teslim edildi", "Siparişiniz teslim edildi. Afiyet olsun!");
    }

    public CiroYaniti ciro(String yoneticiId, LocalDate baslangic, LocalDate bitis) {
        Satici satici = saticiBul(yoneticiId);
        LocalDateTime bas = (baslangic != null ? baslangic : LocalDate.now().minusDays(30)).atStartOfDay();
        LocalDateTime bit = (bitis != null ? bitis : LocalDate.now()).atTime(23, 59, 59);
        // Aralıktaki tüm siparişler (oluşturulma tarihine göre) — hem özet hem aktivite günlüğü.
        List<Siparis> hepsi = siparisDeposu.findBySaticiIdAndOlusturulmaTarihiBetweenOrderByOlusturulmaTarihiDesc(
                satici.getId(), bas, bit);

        // İsim çözümleme: müşteri + işleyen personel id'lerini auth'tan tek seferde topluca al.
        java.util.Set<String> idler = new java.util.HashSet<>();
        for (Siparis s : hepsi) {
            if (s.getMusteriKullaniciId() != null) idler.add(s.getMusteriKullaniciId());
            if (s.getIsleyenKullaniciId() != null) idler.add(s.getIsleyenKullaniciId());
        }
        java.util.Map<String, String> adlar = authIstemci.adlariGetir(yoneticiId, new ArrayList<>(idler));

        BigDecimal toplam = BigDecimal.ZERO, nakit = BigDecimal.ZERO, kk = BigDecimal.ZERO;
        long teslim = 0, iptal = 0, red = 0;
        List<CiroKaydi> kayitlar = new ArrayList<>();
        for (Siparis s : hepsi) {
            boolean teslimEdildi = s.getDurum() == Siparis.SiparisDurumu.TESLIM_EDILDI;
            if (teslimEdildi) {
                teslim++;
                toplam = toplam.add(s.getToplamTutar());
                if (s.getTahsilEdilenOdeme() == Siparis.OdemeYontemi.NAKIT) nakit = nakit.add(s.getToplamTutar());
                else if (s.getTahsilEdilenOdeme() == Siparis.OdemeYontemi.KREDI_KARTI) kk = kk.add(s.getToplamTutar());
            } else if (s.getDurum() == Siparis.SiparisDurumu.IPTAL_EDILDI) {
                iptal++;
            } else if (s.getDurum() == Siparis.SiparisDurumu.REDDEDILDI) {
                red++;
            }
            kayitlar.add(CiroKaydi.builder()
                    .siparisId(s.getId())
                    .tarih(s.getOlusturulmaTarihi())
                    .musteriAdi(soyadSansurle(adlar.get(s.getMusteriKullaniciId())))
                    .isleyenAdi(s.getIsleyenKullaniciId() != null ? adlar.get(s.getIsleyenKullaniciId()) : null)
                    .durum(s.getDurum().name())
                    .tutar(s.getToplamTutar())
                    .kazanc(teslimEdildi ? s.getToplamTutar() : BigDecimal.ZERO)
                    .odemeYontemi(s.getOdemeYontemi() != null ? s.getOdemeYontemi().name() : null)
                    .tahsilEdilenOdeme(s.getTahsilEdilenOdeme() != null ? s.getTahsilEdilenOdeme().name() : null)
                    .redNedeni(s.getRedNedeni())
                    .build());
        }
        return CiroYaniti.builder()
                .siparisSayisi(teslim)
                .toplamSiparis(hepsi.size())
                .iptalSayisi(iptal)
                .redSayisi(red)
                .toplamCiro(toplam)
                .nakitToplam(nakit)
                .krediKartiToplam(kk)
                .kayitlar(kayitlar)
                .build();
    }

    // --- yardımcılar ---

    private record Veri(Siparis siparis, Satici satici) {}

    private Veri sahiplikle(String kullaniciId, String siparisId) {
        return sahiplikle(kullaniciId, siparisId, false);
    }

    /**
     * Sipariş üzerinde işlem yetkisi:
     *   * SAHIP — her aşamayı yürütebilir.
     *   * PERSONEL — üstlenme kuralı: atanmamış siparişi alabilir; atanmışsa yalnız üstlenen sürdürür.
     *   * KURYE — yalnız teslimat aşamaları (yolda/teslim); teslimatı yola çıkaran kurye tamamlar.
     */
    private Veri sahiplikle(String kullaniciId, String siparisId, boolean teslimatAsamasi) {
        Satici satici = saticiServisi.saticiCozumle(kullaniciId);   // sahip veya aktif personel/kurye
        Siparis s = siparisDeposu.findById(siparisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sipariş bulunamadı."));
        if (!s.getSaticiId().equals(satici.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu sipariş sizin satıcınıza ait değil.");
        }
        if (kullaniciId.equals(satici.getYoneticiKullaniciId())) {
            return new Veri(s, satici);   // sahip — sınırsız
        }
        IsletmePersoneli.PersonelRolu rol = personelDeposu.findByKullaniciId(kullaniciId)
                .map(p -> p.getRol() != null ? p.getRol() : IsletmePersoneli.PersonelRolu.PERSONEL)
                .orElse(IsletmePersoneli.PersonelRolu.PERSONEL);
        if (rol == IsletmePersoneli.PersonelRolu.KURYE) {
            if (!teslimatAsamasi) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Kurye yalnızca teslimat aşamalarını (yola çıkar / teslim et) yürütebilir.");
            }
            if (s.getKuryeKullaniciId() != null && !s.getKuryeKullaniciId().equals(kullaniciId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Bu teslimatı başka bir kurye üstlendi.");
            }
            return new Veri(s, satici);
        }
        // PERSONEL — üstlenme kuralı
        if (s.getIsleyenKullaniciId() != null && !s.getIsleyenKullaniciId().equals(kullaniciId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bu siparişi başka bir personel üstlendi; işlemi yalnızca o personel veya işletme sahibi sürdürebilir.");
        }
        return new Veri(s, satici);
    }

    private Siparis.TeslimatTuru teslimatTuruCoz(String deger) {
        if (deger == null || deger.isBlank()) return Siparis.TeslimatTuru.ADRESE_TESLIMAT;
        try {
            return Siparis.TeslimatTuru.valueOf(deger.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz teslimat türü: " + deger);
        }
    }

    private void gecisGuard(Siparis s, Siparis.SiparisDurumu beklenen) {
        if (s.getDurum() != beklenen) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Geçersiz durum geçişi (mevcut: " + s.getDurum() + ").");
        }
    }

    private Siparis kaydetVeBildir(Veri v, String baslik, String mesaj) {
        Siparis kaydedilen = siparisDeposu.save(v.siparis);
        bildirimYayinlayici.siparisDurumBildir(kaydedilen, v.satici.getAd(), baslik, mesaj);
        return kaydedilen;
    }

    private Satici saticiBul(String yoneticiId) {
        return saticiDeposu.findByYoneticiKullaniciId(yoneticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hesabınıza bağlı bir satıcı bulunamadı."));
    }

    /** "Tolga Olguner" → "Tolga O*****" (ad tam, soyad ilk harf + yıldız; tek kelimeyse o kısmen maskelenir). */
    private String soyadSansurle(String tamAd) {
        if (tamAd == null || tamAd.isBlank()) return null;
        String[] parcalar = tamAd.trim().split("\\s+");
        String soyad = parcalar[parcalar.length - 1];
        String maskeli = soyad.substring(0, 1) + "*".repeat(Math.max(1, soyad.length() - 1));
        if (parcalar.length == 1) return maskeli;
        StringBuilder ad = new StringBuilder();
        for (int i = 0; i < parcalar.length - 1; i++) {
            if (i > 0) ad.append(" ");
            ad.append(parcalar[i]);
        }
        return ad + " " + maskeli;
    }

    private Siparis.OdemeYontemi odemeCoz(String deger) {
        if (deger == null || deger.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ödeme yöntemi zorunludur.");
        }
        try {
            return Siparis.OdemeYontemi.valueOf(deger.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz ödeme yöntemi: " + deger);
        }
    }
}
