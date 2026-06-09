package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.CiroKaydi;
import com.isik.kampusos.yemek.dto.CiroYaniti;
import com.isik.kampusos.yemek.dto.SiparisOlusturmaTalebi;
import com.isik.kampusos.yemek.messaging.AuthKimlikIstemcisi;
import com.isik.kampusos.yemek.messaging.BildirimYayinlayici;
import com.isik.kampusos.yemek.model.Kampanya;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.model.SiparisKalemi;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import com.isik.kampusos.yemek.repository.SiparisDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
public class SiparisServisi {

    private final SiparisDeposu siparisDeposu;
    private final SaticiDeposu saticiDeposu;
    private final MenuOgesiDeposu menuOgesiDeposu;
    private final BildirimYayinlayici bildirimYayinlayici;
    private final SaticiServisi saticiServisi;
    private final AuthKimlikIstemcisi authIstemci;

    // --- Öğrenci ---

    @Transactional
    public Siparis siparisVer(String musteriId, SiparisOlusturmaTalebi talep) {
        if (talep.getTeslimAdresi() == null || talep.getTeslimAdresi().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teslim adresi zorunludur.");
        }
        if (talep.getKalemler() == null || talep.getKalemler().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sepet boş olamaz.");
        }
        Siparis.OdemeYontemi odeme = odemeCoz(talep.getOdemeYontemi());

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

        // Minimum sepet kontrolü
        BigDecimal minSepet = satici.getMinimumSepetTutari() != null ? satici.getMinimumSepetTutari() : BigDecimal.ZERO;
        if (araToplam.compareTo(minSepet) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu satıcının minimum sepet tutarı " + minSepet + " ₺. Sepetinizi tamamlayın.");
        }

        BigDecimal teslimatUcreti = satici.getTeslimatUcreti() != null ? satici.getTeslimatUcreti() : BigDecimal.ZERO;

        // En iyi aktif kampanyayı uygula
        BigDecimal indirim = BigDecimal.ZERO;
        String kampanyaId = null;
        Kampanya enIyi = enIyiKampanya(araToplam, teslimatUcreti, saticiServisi.aktifKampanyalar(satici.getId()));
        if (enIyi != null) {
            indirim = kampanyaIndirimi(enIyi, araToplam, teslimatUcreti);
            kampanyaId = enIyi.getId();
        }

        BigDecimal toplam = araToplam.add(teslimatUcreti).subtract(indirim).max(BigDecimal.ZERO);

        Siparis siparis = Siparis.builder()
                .saticiId(satici.getId())
                .musteriKullaniciId(musteriId)
                .durum(Siparis.SiparisDurumu.BEKLEMEDE)
                .araToplam(araToplam)
                .teslimatUcreti(teslimatUcreti)
                .indirimTutari(indirim)
                .kampanyaId(kampanyaId)
                .toplamTutar(toplam)
                .teslimAdresi(talep.getTeslimAdresi().trim())
                .odemeYontemi(odeme)
                .telefon(talep.getTelefon())
                .musteriNotu(talep.getMusteriNotu())
                .kalemler(kalemler)
                .build();
        return siparisDeposu.save(siparis);
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

    public List<Siparis> benimSiparislerim(String musteriId) {
        return siparisDeposu.findByMusteriKullaniciIdOrderByOlusturulmaTarihiDesc(musteriId);
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
        return siparisDeposu.save(s);
    }

    // --- İşletme yöneticisi ---

    public List<Siparis> saticiSiparisleri(String kullaniciId) {
        Satici satici = saticiServisi.saticiCozumle(kullaniciId);   // sahip veya personel
        return siparisDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(satici.getId());
    }

    @Transactional
    public Siparis kabul(String yoneticiId, String siparisId) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.BEKLEMEDE);
        v.siparis.setDurum(Siparis.SiparisDurumu.KABUL_EDILDI);
        v.siparis.setKabulTarihi(LocalDateTime.now());
        v.siparis.setIsleyenKullaniciId(yoneticiId);   // kabul eden personel/sahip
        return kaydetVeBildir(v, "Siparişiniz onaylandı", "Siparişiniz işletme tarafından onaylandı, hazırlanmaya başlanacak.");
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
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.HAZIR);
        v.siparis.setDurum(Siparis.SiparisDurumu.YOLDA);
        v.siparis.setYolaCikisTarihi(LocalDateTime.now());
        return kaydetVeBildir(v, "Siparişiniz yola çıktı", "Siparişiniz kurye ile yola çıktı.");
    }

    @Transactional
    public Siparis teslim(String yoneticiId, String siparisId, String tahsilEdilenOdeme) {
        Veri v = sahiplikle(yoneticiId, siparisId);
        gecisGuard(v.siparis, Siparis.SiparisDurumu.YOLDA);
        Siparis.OdemeYontemi tahsil = odemeCoz(tahsilEdilenOdeme);
        v.siparis.setDurum(Siparis.SiparisDurumu.TESLIM_EDILDI);
        v.siparis.setTahsilEdilenOdeme(tahsil);
        v.siparis.setTeslimTarihi(LocalDateTime.now());
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
        Satici satici = saticiServisi.saticiCozumle(kullaniciId);   // sahip veya personel
        Siparis s = siparisDeposu.findById(siparisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sipariş bulunamadı."));
        if (!s.getSaticiId().equals(satici.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu sipariş sizin satıcınıza ait değil.");
        }
        return new Veri(s, satici);
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
