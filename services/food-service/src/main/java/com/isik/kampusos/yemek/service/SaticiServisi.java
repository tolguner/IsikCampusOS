package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.CalismaSaatiTalebi;
import com.isik.kampusos.yemek.dto.KampanyaTalebi;
import com.isik.kampusos.yemek.dto.MenuOgesiTalebi;
import com.isik.kampusos.yemek.dto.SaticiGuncellemeTalebi;
import com.isik.kampusos.yemek.dto.SaticiDegisiklikIstegiYaniti;
import com.isik.kampusos.yemek.dto.SaticiDegisiklikTalebi;
import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.SaticiYaniti;
import com.isik.kampusos.yemek.model.SaticiDegisiklikIstegi;
import com.isik.kampusos.yemek.model.CalismaSaati;
import com.isik.kampusos.yemek.model.Kampanya;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.MenuSecenekGrubu;
import com.isik.kampusos.yemek.model.MenuSecenegi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.model.Siparis;
import com.isik.kampusos.yemek.messaging.AuthKimlikIstemcisi;
import com.isik.kampusos.yemek.repository.CalismaSaatiDeposu;
import com.isik.kampusos.yemek.repository.FavoriSaticiDeposu;
import com.isik.kampusos.yemek.repository.IsletmePersonelDeposu;
import com.isik.kampusos.yemek.repository.KampanyaDeposu;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import com.isik.kampusos.yemek.repository.SiparisDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SaticiServisi {

    private static final String[] GUN_ADLARI = {"", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"};
    private static final DateTimeFormatter SAAT_BICIMI = DateTimeFormatter.ofPattern("HH:mm");

    private final SaticiDeposu saticiDeposu;
    private final MenuOgesiDeposu menuOgesiDeposu;
    private final CalismaSaatiDeposu calismaSaatiDeposu;
    private final KampanyaDeposu kampanyaDeposu;
    private final IsletmePersonelDeposu personelDeposu;
    private final SiparisDeposu siparisDeposu;
    private final FavoriSaticiDeposu favoriDeposu;
    private final AuthKimlikIstemcisi authIstemci;
    private final com.isik.kampusos.yemek.repository.SaticiDegisiklikIstegiDeposu talepDeposu;
    private final com.isik.kampusos.yemek.repository.MenuKategorisiDeposu kategoriDeposu;
    private final DenetimServisi denetim;

    /** Onaya tabi genel/kimlik alanları (sahip doğrudan değiştiremez, talep açar). */
    private static final java.util.Set<String> ONAYA_TABI_ALANLAR =
            java.util.Set.of("ad", "aciklama", "konumMetni", "logoUrl", "kapakGorselUrl", "mutfakTuru");

    /** Yoğunluk hesabında "aktif" sayılan durumlar (hazırlık hattını meşgul edenler). */
    private static final List<Siparis.SiparisDurumu> AKTIF_SIPARIS_DURUMLARI =
            List.of(Siparis.SiparisDurumu.BEKLEMEDE, Siparis.SiparisDurumu.KABUL_EDILDI, Siparis.SiparisDurumu.HAZIRLANIYOR);

    // --- Öğrenci / herkese görünür ---

    public List<SaticiYaniti> aktifSaticilar() {
        return aktifSaticilar(null, null, null);
    }

    /**
     * Arama/filtre/sıralama ile aktif satıcılar.
     * @param ara    ad/açıklama içinde geçen metin (büyük/küçük harf duyarsız)
     * @param mutfak mutfak türü filtresi (tam eşleşme)
     * @param sirala "isim" | "sure" | (varsayılan: açık olanlar önce, sonra isim)
     */
    public List<SaticiYaniti> aktifSaticilar(String ara, String mutfak, String sirala) {
        String q = ara == null ? "" : ara.trim().toLowerCase();
        List<SaticiYaniti> liste = new java.util.ArrayList<>(
                saticiDeposu.findByDurumOrderByAdAsc(Satici.SaticiDurumu.AKTIF).stream()
                        .filter(s -> mutfak == null || mutfak.isBlank() || mutfak.equalsIgnoreCase(s.getMutfakTuru()))
                        .filter(s -> q.isEmpty()
                                || (s.getAd() != null && s.getAd().toLowerCase().contains(q))
                                || (s.getAciklama() != null && s.getAciklama().toLowerCase().contains(q))
                                || (s.getMutfakTuru() != null && s.getMutfakTuru().toLowerCase().contains(q)))
                        .map(this::yanitYap).toList());

        java.util.Comparator<SaticiYaniti> kar;
        if ("isim".equalsIgnoreCase(sirala)) {
            kar = java.util.Comparator.comparing(y -> y.getAd() == null ? "" : y.getAd().toLowerCase());
        } else if ("sure".equalsIgnoreCase(sirala)) {
            kar = java.util.Comparator.comparing((SaticiYaniti y) ->
                    y.getTahminiTeslimatDakika() == null ? Integer.MAX_VALUE : y.getTahminiTeslimatDakika());
        } else {
            // Varsayılan: açık olanlar önce, sonra isim
            kar = java.util.Comparator.comparing((SaticiYaniti y) -> y.isSuAnAcik() ? 0 : 1)
                    .thenComparing(y -> y.getAd() == null ? "" : y.getAd().toLowerCase());
        }
        liste.sort(kar);
        return liste;
    }

    /** Aktif satıcılarda kullanılan benzersiz mutfak türleri (filtre çipleri için). */
    public List<String> mevcutMutfakTurleri() {
        return saticiDeposu.findByDurumOrderByAdAsc(Satici.SaticiDurumu.AKTIF).stream()
                .map(Satici::getMutfakTuru)
                .filter(m -> m != null && !m.isBlank())
                .distinct().sorted().toList();
    }

    public SaticiYaniti saticiDetay(String saticiId) {
        Satici s = saticiDeposu.findById(saticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        return yanitYap(s);
    }

    public List<MenuOgesi> saticiMenusu(String saticiId) {
        saticiDeposu.findById(saticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        return menuOgesiDeposu.findBySaticiIdAndDurumOrderByKategoriAscAdAsc(saticiId, MenuOgesi.MenuDurumu.AKTIF);
    }

    // --- İşletme yöneticisi (kendi satıcısı) ---

    public Satici benimSaticim(String kullaniciId) {
        return saticiCozumle(kullaniciId);
    }

    /**
     * Bir kullanıcının (işletme sahibi VEYA personeli) bağlı olduğu işletmeyi çözer.
     * Önce sahip (yonetici_kullanici_id), bulunamazsa personel bağı (isletme_personeli) denenir.
     * Sipariş akışında kullanılır; menü/ayar gibi sahip-özel işlemlerde {@link #saticiBul} kullanılır.
     */
    public Satici saticiCozumle(String kullaniciId) {
        return saticiDeposu.findByYoneticiKullaniciId(kullaniciId)
                .or(() -> personelDeposu.findByKullaniciId(kullaniciId)
                        // Askıya alınan (PASIF) personel işletme işlemlerine erişemez.
                        .filter(p -> p.getDurum() == com.isik.kampusos.yemek.model.IsletmePersoneli.PersonelDurumu.AKTIF)
                        .flatMap(p -> saticiDeposu.findById(p.getSaticiId())))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Hesabınıza bağlı bir işletme bulunamadı."));
    }

    @Transactional
    public Satici saticiGuncelle(String yoneticiId, SaticiGuncellemeTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        // Genel/kimlik alanları (ad, açıklama, konum, logo, kapak, mutfak türü) doğrudan değiştirilemez;
        // bunlar değişiklik talebi + admin onayı ile güncellenir. Burada yalnız operasyonel alanlar.
        if (talep.getAcik() != null) s.setAcik(talep.getAcik());
        if (talep.getTeslimatUcreti() != null) {
            if (talep.getTeslimatUcreti().signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teslimat ücreti negatif olamaz.");
            s.setTeslimatUcreti(talep.getTeslimatUcreti());
        }
        if (talep.getMinimumSepetTutari() != null) {
            if (talep.getMinimumSepetTutari().signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum sepet tutarı negatif olamaz.");
            s.setMinimumSepetTutari(talep.getMinimumSepetTutari());
        }
        if (talep.getTahminiTeslimatDakika() != null) s.setTahminiTeslimatDakika(talep.getTahminiTeslimatDakika());
        return saticiDeposu.save(s);
    }

    // --- Çalışma saatleri (işletme yöneticisi) ---

    public List<CalismaSaati> benimCalismaSaatlerim(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return calismaSaatiDeposu.findBySaticiIdOrderByGunAsc(s.getId());
    }

    @Transactional
    public List<CalismaSaati> calismaSaatleriKaydet(String yoneticiId, CalismaSaatiTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        // Tüm haftayı topluca değiştir: önce mevcutları sil, sonra geleni yaz.
        calismaSaatiDeposu.deleteBySaticiId(s.getId());
        if (talep.getGunler() != null) {
            for (CalismaSaatiTalebi.Gun g : talep.getGunler()) {
                if (g.getGun() < 1 || g.getGun() > 7) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz gün: " + g.getGun());
                }
                CalismaSaati cs = CalismaSaati.builder()
                        .saticiId(s.getId())
                        .gun(g.getGun())
                        .kapali(g.isKapali())
                        .acilis(g.isKapali() ? null : saatCoz(g.getAcilis()))
                        .kapanis(g.isKapali() ? null : saatCoz(g.getKapanis()))
                        .build();
                calismaSaatiDeposu.save(cs);
            }
        }
        return calismaSaatiDeposu.findBySaticiIdOrderByGunAsc(s.getId());
    }

    private LocalTime saatCoz(String deger) {
        if (deger == null || deger.isBlank()) return null;
        try {
            return LocalTime.parse(deger.trim(), SAAT_BICIMI);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz saat biçimi (HH:mm bekleniyor): " + deger);
        }
    }

    // --- Kampanyalar (işletme yöneticisi) ---

    public List<Kampanya> kampanyalarim(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return kampanyaDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(s.getId());
    }

    @Transactional
    public Kampanya kampanyaEkle(String yoneticiId, KampanyaTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        Kampanya k = Kampanya.builder()
                .saticiId(s.getId())
                .ad(talep.getAd())
                .tur(kampanyaTuruCoz(talep.getTur()))
                .deger(talep.getDeger() != null ? talep.getDeger() : java.math.BigDecimal.ZERO)
                .minSepetTutari(talep.getMinSepetTutari() != null ? talep.getMinSepetTutari() : java.math.BigDecimal.ZERO)
                .aktif(talep.getAktif() == null || talep.getAktif())
                .build();
        kampanyaDogrula(k);
        return kampanyaDeposu.save(k);
    }

    @Transactional
    public Kampanya kampanyaGuncelle(String yoneticiId, String id, KampanyaTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        Kampanya k = kampanyaSahipligiyleBul(id, s.getId());
        if (talep.getAd() != null) k.setAd(talep.getAd());
        if (talep.getTur() != null) k.setTur(kampanyaTuruCoz(talep.getTur()));
        if (talep.getDeger() != null) k.setDeger(talep.getDeger());
        if (talep.getMinSepetTutari() != null) k.setMinSepetTutari(talep.getMinSepetTutari());
        if (talep.getAktif() != null) k.setAktif(talep.getAktif());
        kampanyaDogrula(k);
        return kampanyaDeposu.save(k);
    }

    @Transactional
    public void kampanyaSil(String yoneticiId, String id) {
        Satici s = saticiBul(yoneticiId);
        Kampanya k = kampanyaSahipligiyleBul(id, s.getId());
        kampanyaDeposu.delete(k);
    }

    /** SiparisServisi için: satıcının aktif kampanyaları. */
    public List<Kampanya> aktifKampanyalar(String saticiId) {
        return kampanyaDeposu.findBySaticiIdAndAktifTrue(saticiId);
    }

    /** SiparisServisi için: satıcı o an sipariş alabilir mi (durum + manuel + çalışma saati). */
    public boolean acikMi(Satici s) {
        List<CalismaSaati> saatler = calismaSaatiDeposu.findBySaticiIdOrderByGunAsc(s.getId());
        return suAnAcikMi(s, saatler, LocalDateTime.now());
    }

    private Kampanya kampanyaSahipligiyleBul(String id, String saticiId) {
        Kampanya k = kampanyaDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kampanya bulunamadı."));
        if (!k.getSaticiId().equals(saticiId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kampanya sizin satıcınıza ait değil.");
        }
        return k;
    }

    private Kampanya.KampanyaTuru kampanyaTuruCoz(String deger) {
        if (deger == null || deger.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kampanya türü zorunludur.");
        }
        try {
            return Kampanya.KampanyaTuru.valueOf(deger.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz kampanya türü: " + deger);
        }
    }

    private void kampanyaDogrula(Kampanya k) {
        if (k.getAd() == null || k.getAd().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kampanya adı zorunludur.");
        }
        if (k.getTur() == Kampanya.KampanyaTuru.YUZDE
                && (k.getDeger().signum() <= 0 || k.getDeger().compareTo(java.math.BigDecimal.valueOf(100)) > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yüzde indirimi 1-100 arası olmalıdır.");
        }
        if (k.getTur() == Kampanya.KampanyaTuru.TUTAR && k.getDeger().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tutar indirimi pozitif olmalıdır.");
        }
    }

    // --- Menü kategorileri (işletme yöneticisi yönetir) ---

    public List<com.isik.kampusos.yemek.model.MenuKategorisi> benimKategorilerim(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return kategoriDeposu.findBySaticiIdOrderBySiralamaAscAdAsc(s.getId());
    }

    @Transactional
    public com.isik.kampusos.yemek.model.MenuKategorisi kategoriEkle(String yoneticiId, String ad) {
        Satici s = saticiBul(yoneticiId);
        String temiz = kategoriAdDogrula(ad);
        if (kategoriDeposu.existsBySaticiIdAndAdIgnoreCase(s.getId(), temiz)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu kategori zaten mevcut.");
        }
        return kategoriDeposu.save(com.isik.kampusos.yemek.model.MenuKategorisi.builder()
                .saticiId(s.getId()).ad(temiz).build());
    }

    /** Kategori adını değiştirir ve ilgili tüm ürünlerin kategori adını birlikte günceller. */
    @Transactional
    public com.isik.kampusos.yemek.model.MenuKategorisi kategoriYenidenAdlandir(String yoneticiId, String id, String yeniAd) {
        Satici s = saticiBul(yoneticiId);
        com.isik.kampusos.yemek.model.MenuKategorisi k = kategoriDeposu.findByIdAndSaticiId(id, s.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategori bulunamadı."));
        String temiz = kategoriAdDogrula(yeniAd);
        if (!temiz.equalsIgnoreCase(k.getAd()) && kategoriDeposu.existsBySaticiIdAndAdIgnoreCase(s.getId(), temiz)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu kategori zaten mevcut.");
        }
        String eski = k.getAd();
        menuOgesiDeposu.kategoriYenidenAdlandir(s.getId(), eski, temiz);
        k.setAd(temiz);
        return kategoriDeposu.save(k);
    }

    @Transactional
    public void kategoriSil(String yoneticiId, String id) {
        Satici s = saticiBul(yoneticiId);
        com.isik.kampusos.yemek.model.MenuKategorisi k = kategoriDeposu.findByIdAndSaticiId(id, s.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategori bulunamadı."));
        if (menuOgesiDeposu.existsBySaticiIdAndKategoriAndDurum(s.getId(), k.getAd(), MenuOgesi.MenuDurumu.AKTIF)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu kategoride ürün var. Önce ürünleri başka kategoriye taşıyın ya da silin.");
        }
        kategoriDeposu.delete(k);
    }

    private String kategoriAdDogrula(String ad) {
        if (ad == null || ad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori adı zorunludur.");
        }
        String t = ad.trim();
        if (t.length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori adı en fazla 120 karakter olabilir.");
        }
        return t;
    }

    public List<MenuOgesi> benimMenum(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return menuOgesiDeposu.findBySaticiIdAndDurumOrderByKategoriAscAdAsc(s.getId(), MenuOgesi.MenuDurumu.AKTIF);
    }

    @Transactional
    public MenuOgesi menuEkle(String yoneticiId, MenuOgesiTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        menuDogrula(talep);
        MenuOgesi oge = MenuOgesi.builder()
                .saticiId(s.getId())
                .ad(talep.getAd())
                .aciklama(talep.getAciklama())
                .kategori(talep.getKategori())
                .fiyat(talep.getFiyat())
                .gorselUrl(talep.getGorselUrl())
                .etiketler(talep.getEtiketler())
                .mevcut(talep.getMevcut() == null || talep.getMevcut())
                .oneCikan(talep.getOneCikan() != null && talep.getOneCikan())
                .durum(MenuOgesi.MenuDurumu.AKTIF)
                .secenekGruplari(secenekGruplariKur(talep.getSecenekGruplari()))
                .build();
        return menuOgesiDeposu.save(oge);
    }

    @Transactional
    public MenuOgesi menuGuncelle(String yoneticiId, String ogeId, MenuOgesiTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        MenuOgesi oge = menuOgesiSahipligiyleBul(ogeId, s.getId());
        if (talep.getAd() != null) oge.setAd(talep.getAd());
        if (talep.getAciklama() != null) oge.setAciklama(talep.getAciklama());
        if (talep.getKategori() != null) oge.setKategori(talep.getKategori());
        if (talep.getFiyat() != null) {
            if (talep.getFiyat().signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fiyat negatif olamaz.");
            oge.setFiyat(talep.getFiyat());
        }
        if (talep.getGorselUrl() != null) oge.setGorselUrl(talep.getGorselUrl());
        if (talep.getEtiketler() != null) oge.setEtiketler(talep.getEtiketler());
        if (talep.getMevcut() != null) oge.setMevcut(talep.getMevcut());
        if (talep.getOneCikan() != null) oge.setOneCikan(talep.getOneCikan());
        if (talep.getSecenekGruplari() != null) {
            // Seçenek gruplarını topluca değiştir (orphanRemoval eskileri siler).
            oge.getSecenekGruplari().clear();
            oge.getSecenekGruplari().addAll(secenekGruplariKur(talep.getSecenekGruplari()));
        }
        return menuOgesiDeposu.save(oge);
    }

    private java.util.List<MenuSecenekGrubu> secenekGruplariKur(java.util.List<MenuOgesiTalebi.SecenekGrubu> talepler) {
        java.util.List<MenuSecenekGrubu> gruplar = new java.util.ArrayList<>();
        if (talepler == null) return gruplar;
        for (MenuOgesiTalebi.SecenekGrubu gt : talepler) {
            if (gt.getAd() == null || gt.getAd().isBlank()) continue;
            MenuSecenekGrubu.SecenekTuru tur;
            try {
                tur = MenuSecenekGrubu.SecenekTuru.valueOf(gt.getTur() == null ? "TEK_SECIM" : gt.getTur().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz seçenek türü: " + gt.getTur());
            }
            java.util.List<MenuSecenegi> secenekler = new java.util.ArrayList<>();
            if (gt.getSecenekler() != null) {
                for (MenuOgesiTalebi.Secenek st : gt.getSecenekler()) {
                    if (st.getAd() == null || st.getAd().isBlank()) continue;
                    secenekler.add(MenuSecenegi.builder()
                            .ad(st.getAd().trim())
                            .ekFiyat(st.getEkFiyat() != null ? st.getEkFiyat() : java.math.BigDecimal.ZERO)
                            .siralama(st.getSiralama())
                            .build());
                }
            }
            gruplar.add(MenuSecenekGrubu.builder()
                    .ad(gt.getAd().trim())
                    .tur(tur)
                    .zorunlu(gt.isZorunlu())
                    .siralama(gt.getSiralama())
                    .secenekler(secenekler)
                    .build());
        }
        return gruplar;
    }

    @Transactional
    public void menuSil(String yoneticiId, String ogeId) {
        Satici s = saticiBul(yoneticiId);
        MenuOgesi oge = menuOgesiSahipligiyleBul(ogeId, s.getId());
        oge.setDurum(MenuOgesi.MenuDurumu.ARSIVLENDI);
        menuOgesiDeposu.save(oge);
    }

    // --- Sistem yöneticisi ---

    public List<Satici> tumSaticilar() {
        return saticiDeposu.findAll();
    }

    @Transactional
    public Satici adminOlustur(SaticiOlusturmaTalebi talep, String adminId) {
        if (talep.getAd() == null || talep.getAd().isBlank()
                || talep.getYoneticiKullaniciId() == null || talep.getYoneticiKullaniciId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Satıcı adı ve yönetici kullanıcı zorunludur.");
        }
        if (saticiDeposu.findByYoneticiKullaniciId(talep.getYoneticiKullaniciId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu yönetici zaten bir satıcıya atanmış.");
        }
        Satici s = Satici.builder()
                .ad(talep.getAd())
                .yoneticiKullaniciId(talep.getYoneticiKullaniciId())
                .konumMetni(talep.getKonumMetni())
                .enlem(talep.getEnlem())
                .boylam(talep.getBoylam())
                .aciklama(talep.getAciklama())
                .logoUrl(talep.getLogoUrl())
                .durum(Satici.SaticiDurumu.AKTIF)
                .acik(true)
                .build();
        Satici kaydedilen = saticiDeposu.save(s);
        denetim.kaydet("ISLETME", kaydedilen.getId(), "ISLETME_OLUSTURULDU", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                "İşletme oluşturuldu: " + kaydedilen.getAd());
        return kaydedilen;
    }

    @Transactional
    public Satici adminGuncelle(String id, SaticiOlusturmaTalebi talep) {
        Satici s = saticiDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        if (talep.getAd() != null) s.setAd(talep.getAd());
        if (talep.getKonumMetni() != null) s.setKonumMetni(talep.getKonumMetni());
        if (talep.getEnlem() != null) s.setEnlem(talep.getEnlem());
        if (talep.getBoylam() != null) s.setBoylam(talep.getBoylam());
        if (talep.getAciklama() != null) s.setAciklama(talep.getAciklama());
        if (talep.getLogoUrl() != null) s.setLogoUrl(talep.getLogoUrl());
        if (talep.getDurum() != null && !talep.getDurum().isBlank()) {
            try {
                s.setDurum(Satici.SaticiDurumu.valueOf(talep.getDurum().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz durum: " + talep.getDurum());
            }
        }
        return saticiDeposu.save(s);
    }

    /**
     * İşletmeyi ve tüm bağlı food kayıtlarını siler (sipariş+kalem, menü, personel bağı,
     * çalışma saati, kampanya, favori). Personel auth hesapları da silinir. İşletme sahibinin
     * id'si döner (frontend onu PASIF'e alır). Sahip hesabı denetim için korunur.
     */
    @Transactional
    public Satici adminSil(String id, String adminId) {
        Satici s = saticiDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "İşletme bulunamadı."));

        // Personel auth hesaplarını sil + bağlarını kaldır
        personelDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(id).forEach(p -> {
            try { authIstemci.personelSil(adminId, p.getKullaniciId()); } catch (Exception ignored) { }
            personelDeposu.delete(p);
        });
        // Siparişler (kalemler orphanRemoval ile düşer)
        siparisDeposu.deleteAll(siparisDeposu.findBySaticiId(id));
        // Menü, çalışma saati, kampanya, favori
        menuOgesiDeposu.deleteAll(menuOgesiDeposu.findBySaticiId(id));
        calismaSaatiDeposu.deleteBySaticiId(id);
        kampanyaDeposu.deleteBySaticiId(id);
        favoriDeposu.deleteBySaticiId(id);

        saticiDeposu.delete(s);
        denetim.kaydet("ISLETME", id, "ISLETME_SILINDI", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                "İşletme silindi: " + s.getAd());
        return s;   // yoneticiKullaniciId frontend tarafından PASIF'e alınır
    }

    /**
     * İşletmenin yöneticisini değiştirir: yeni yönetici atanır, eski yönetici id'si döner
     * (frontend eski yöneticiyi PASIF'e alır — denetim için silinmez).
     */
    @Transactional
    public String yoneticiDegistir(String id, String yeniYoneticiId, String adminId) {
        if (yeniYoneticiId == null || yeniYoneticiId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yeni yönetici zorunludur.");
        }
        Satici s = saticiDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "İşletme bulunamadı."));
        saticiDeposu.findByYoneticiKullaniciId(yeniYoneticiId).ifPresent(diger -> {
            if (!diger.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu yönetici zaten başka bir işletmeye atanmış.");
            }
        });
        String eski = s.getYoneticiKullaniciId();
        s.setYoneticiKullaniciId(yeniYoneticiId);
        saticiDeposu.save(s);
        denetim.kaydet("ISLETME", id, "YONETICI_DEGISTI", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                s.getAd() + " yöneticisi değişti (" + eski + " → " + yeniYoneticiId + ")");
        return eski;
    }

    // --- İşletme bilgi-değişikliği onay akışı (R7) ---

    /** Sahip: genel bilgi değişikliği talebi açar (BEKLEMEDE). */
    @Transactional
    public SaticiDegisiklikIstegiYaniti talepOlustur(String yoneticiId, SaticiDegisiklikTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        String alan = talep.getAlanAdi() == null ? "" : talep.getAlanAdi().trim();
        if (!ONAYA_TABI_ALANLAR.contains(alan)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu alan için değişiklik talebi açılamaz: " + alan);
        }
        if (talep.getTalepEdilenDeger() == null || talep.getTalepEdilenDeger().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Talep edilen değer boş olamaz.");
        }
        SaticiDegisiklikIstegi istek = SaticiDegisiklikIstegi.builder()
                .saticiId(s.getId())
                .alanAdi(alan)
                .mevcutDeger(mevcutDeger(s, alan))
                .talepEdilenDeger(talep.getTalepEdilenDeger())
                .durum(SaticiDegisiklikIstegi.Durum.BEKLEMEDE)
                .build();
        SaticiDegisiklikIstegi kayit = talepDeposu.save(istek);
        denetim.kaydet("DEGISIKLIK_TALEBI", kayit.getId(), "TALEP_ACILDI", yoneticiId, "ROLE_VENDOR_ADMIN",
                s.getAd() + " — '" + alan + "' için değişiklik talebi");
        return SaticiDegisiklikIstegiYaniti.of(kayit, s.getAd());
    }

    /** Sahip: kendi taleplerim. */
    public List<SaticiDegisiklikIstegiYaniti> taleplerim(String yoneticiId) {
        Satici s = saticiBul(yoneticiId);
        return talepDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(s.getId()).stream()
                .map(i -> SaticiDegisiklikIstegiYaniti.of(i, s.getAd())).toList();
    }

    /** Admin: bekleyen talepler. */
    public List<SaticiDegisiklikIstegiYaniti> bekleyenTalepler() {
        return talepDeposu.findByDurumOrderByOlusturulmaTarihiDesc(SaticiDegisiklikIstegi.Durum.BEKLEMEDE).stream()
                .map(i -> SaticiDegisiklikIstegiYaniti.of(i,
                        saticiDeposu.findById(i.getSaticiId()).map(Satici::getAd).orElse("—")))
                .toList();
    }

    /** Admin: talebi onayla — değeri satıcıya uygula. */
    @Transactional
    public void talepOnayla(String istekId, String adminId) {
        SaticiDegisiklikIstegi istek = bekleyenTalep(istekId);
        Satici s = saticiDeposu.findById(istek.getSaticiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "İşletme bulunamadı."));
        alaniUygula(s, istek.getAlanAdi(), istek.getTalepEdilenDeger());
        saticiDeposu.save(s);
        istek.setDurum(SaticiDegisiklikIstegi.Durum.ONAYLANDI);
        istek.setInceleyen(adminId);
        istek.setIncelemeTarihi(LocalDateTime.now());
        talepDeposu.save(istek);
        denetim.kaydet("DEGISIKLIK_TALEBI", istek.getId(), "TALEP_ONAYLANDI", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                s.getAd() + " — '" + istek.getAlanAdi() + "' değişikliği onaylandı");
    }

    /** Admin: revize iste (geri bildirimle) — değer uygulanmaz. */
    @Transactional
    public void talepRevize(String istekId, String adminId, String geriBildirim) {
        SaticiDegisiklikIstegi istek = bekleyenTalep(istekId);
        istek.setDurum(SaticiDegisiklikIstegi.Durum.REVIZE_TALEP);
        istek.setInceleyen(adminId);
        istek.setGeriBildirim(geriBildirim);
        istek.setIncelemeTarihi(LocalDateTime.now());
        talepDeposu.save(istek);
        denetim.kaydet("DEGISIKLIK_TALEBI", istek.getId(), "TALEP_REVIZE", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                "'" + istek.getAlanAdi() + "' için revize istendi" + (geriBildirim != null ? ": " + geriBildirim : ""));
    }

    /**
     * Sahip: tek gönderimde birden çok genel bilgi alanı için TEK talep grubu açar.
     * Yalnız onaya-tabi ve gerçekten değişmiş alanlar kaydedilir; aynı işletmenin önceki
     * bekleyen talepleri (varsa) temizlenir — aynı anda tek aktif talep grubu olur.
     */
    @Transactional
    public List<SaticiDegisiklikIstegiYaniti> talepOlusturToplu(String yoneticiId, java.util.Map<String, String> degisiklikler) {
        Satici s = saticiBul(yoneticiId);
        if (degisiklikler == null || degisiklikler.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Değişiklik talebi için en az bir alan gerekli.");
        }
        // Önceki bekleyen talepleri temizle (yeni talep eskisini geçersiz kılar).
        talepDeposu.deleteAll(talepDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(s.getId()).stream()
                .filter(i -> i.getDurum() == SaticiDegisiklikIstegi.Durum.BEKLEMEDE).toList());

        String grupId = java.util.UUID.randomUUID().toString();
        List<SaticiDegisiklikIstegi> olusan = new java.util.ArrayList<>();
        for (var giris : degisiklikler.entrySet()) {
            String alan = giris.getKey() == null ? "" : giris.getKey().trim();
            if (!ONAYA_TABI_ALANLAR.contains(alan)) continue;
            String yeni = giris.getValue();
            if (yeni == null) continue;
            String mevcut = mevcutDeger(s, alan);
            if (yeni.equals(mevcut == null ? "" : mevcut)) continue;   // değişmemiş alanları atla
            olusan.add(talepDeposu.save(SaticiDegisiklikIstegi.builder()
                    .saticiId(s.getId())
                    .grupId(grupId)
                    .alanAdi(alan)
                    .mevcutDeger(mevcut)
                    .talepEdilenDeger(yeni)
                    .durum(SaticiDegisiklikIstegi.Durum.BEKLEMEDE)
                    .build()));
        }
        if (olusan.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hiçbir alan değişmedi; talep oluşturulmadı.");
        }
        denetim.kaydet("DEGISIKLIK_TALEBI", grupId, "TALEP_ACILDI", yoneticiId, "ROLE_VENDOR_ADMIN",
                s.getAd() + " — " + olusan.size() + " alan için değişiklik talebi");
        return olusan.stream().map(i -> SaticiDegisiklikIstegiYaniti.of(i, s.getAd())).toList();
    }

    /** Admin: bir talep grubunu (tüm alanları) onayla ve işletmeye uygula. */
    @Transactional
    public void talepGrupOnayla(String grupId, String adminId) {
        List<SaticiDegisiklikIstegi> grup = talepDeposu.findByGrupIdOrderByOlusturulmaTarihiAsc(grupId).stream()
                .filter(i -> i.getDurum() == SaticiDegisiklikIstegi.Durum.BEKLEMEDE).toList();
        if (grup.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bekleyen talep grubu bulunamadı.");
        }
        Satici s = saticiDeposu.findById(grup.get(0).getSaticiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "İşletme bulunamadı."));
        LocalDateTime now = LocalDateTime.now();
        for (SaticiDegisiklikIstegi istek : grup) {
            alaniUygula(s, istek.getAlanAdi(), istek.getTalepEdilenDeger());
            istek.setDurum(SaticiDegisiklikIstegi.Durum.ONAYLANDI);
            istek.setInceleyen(adminId);
            istek.setIncelemeTarihi(now);
            talepDeposu.save(istek);
        }
        saticiDeposu.save(s);
        denetim.kaydet("DEGISIKLIK_TALEBI", grupId, "TALEP_ONAYLANDI", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                s.getAd() + " — " + grup.size() + " alan değişikliği onaylandı");
    }

    /** Admin: bir talep grubunu (tüm alanları) revize iste — değerler uygulanmaz. */
    @Transactional
    public void talepGrupRevize(String grupId, String adminId, String geriBildirim) {
        List<SaticiDegisiklikIstegi> grup = talepDeposu.findByGrupIdOrderByOlusturulmaTarihiAsc(grupId).stream()
                .filter(i -> i.getDurum() == SaticiDegisiklikIstegi.Durum.BEKLEMEDE).toList();
        if (grup.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bekleyen talep grubu bulunamadı.");
        }
        LocalDateTime now = LocalDateTime.now();
        for (SaticiDegisiklikIstegi istek : grup) {
            istek.setDurum(SaticiDegisiklikIstegi.Durum.REVIZE_TALEP);
            istek.setInceleyen(adminId);
            istek.setGeriBildirim(geriBildirim);
            istek.setIncelemeTarihi(now);
            talepDeposu.save(istek);
        }
        denetim.kaydet("DEGISIKLIK_TALEBI", grupId, "TALEP_REVIZE", adminId, "ROLE_SUPPORT_SERVICES_ADMIN",
                grup.size() + " alanlı talep grubu için revize istendi" + (geriBildirim != null ? ": " + geriBildirim : ""));
    }

    private SaticiDegisiklikIstegi bekleyenTalep(String istekId) {
        SaticiDegisiklikIstegi istek = talepDeposu.findById(istekId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talep bulunamadı."));
        if (istek.getDurum() != SaticiDegisiklikIstegi.Durum.BEKLEMEDE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu talep zaten incelenmiş.");
        }
        return istek;
    }

    private String mevcutDeger(Satici s, String alan) {
        return switch (alan) {
            case "ad" -> s.getAd();
            case "aciklama" -> s.getAciklama();
            case "konumMetni" -> s.getKonumMetni();
            case "logoUrl" -> s.getLogoUrl();
            case "kapakGorselUrl" -> s.getKapakGorselUrl();
            case "mutfakTuru" -> s.getMutfakTuru();
            default -> null;
        };
    }

    private void alaniUygula(Satici s, String alan, String deger) {
        switch (alan) {
            case "ad" -> s.setAd(deger);
            case "aciklama" -> s.setAciklama(deger);
            case "konumMetni" -> s.setKonumMetni(deger);
            case "logoUrl" -> s.setLogoUrl(deger);
            case "kapakGorselUrl" -> s.setKapakGorselUrl(deger);
            case "mutfakTuru" -> s.setMutfakTuru(deger);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz alan: " + alan);
        }
    }

    // --- yardımcılar: açık/kapalı hesaplama + yanıt üretimi ---

    /** Satıcıyı çalışma saatleri + yoğunluk ekiyle zenginleştirilmiş yanıta dönüştürür. */
    private SaticiYaniti yanitYap(Satici s) {
        List<CalismaSaati> saatler = calismaSaatiDeposu.findBySaticiIdOrderByGunAsc(s.getId());
        LocalDateTime now = LocalDateTime.now();
        boolean suAnAcik = suAnAcikMi(s, saatler, now);
        String sonraki = suAnAcik ? null : sonrakiAcilisMetni(saatler, now);
        return SaticiYaniti.of(s, suAnAcik, sonraki, saatler, yogunlukEkDakika(s.getId()));
    }

    /** Yoğunluğa duyarlı süre: her aktif sipariş +5 dk, en fazla +30 dk. */
    private int yogunlukEkDakika(String saticiId) {
        long aktif = siparisDeposu.countBySaticiIdAndDurumIn(saticiId, AKTIF_SIPARIS_DURUMLARI);
        return (int) Math.min(30, aktif * 5);
    }

    /**
     * durum AKTIF + manuel açık + çalışma saati aralığında mı?
     * Gece yarısını aşan aralıklar (örn. 22:00–02:00, kapanış &lt; açılış) desteklenir:
     * bugünün kaydı açılıştan gece yarısına, dünün kaydı gece yarısından kapanışa bakılır.
     */
    private boolean suAnAcikMi(Satici s, List<CalismaSaati> saatler, LocalDateTime now) {
        if (s.getDurum() != Satici.SaticiDurumu.AKTIF || !s.isAcik()) return false;
        LocalTime t = now.toLocalTime();
        short bugun = (short) now.getDayOfWeek().getValue();           // 1=Pzt … 7=Paz
        short dun = (short) now.minusDays(1).getDayOfWeek().getValue();
        return aralikIcindeMi(saatler, bugun, t, true) || aralikIcindeMi(saatler, dun, t, false);
    }

    /** bugunMu=true: günün kendi aralığı; false: önceki günün gece yarısını aşan (sabaha taşan) kısmı. */
    private boolean aralikIcindeMi(List<CalismaSaati> saatler, short gun, LocalTime t, boolean bugunMu) {
        Optional<CalismaSaati> opt = saatler.stream().filter(c -> c.getGun() == gun).findFirst();
        if (opt.isEmpty()) return false; // saat tanımlı değilse kapalı kabul
        CalismaSaati c = opt.get();
        if (c.isKapali() || c.getAcilis() == null || c.getKapanis() == null) return false;
        boolean geceyiAsar = !c.getKapanis().isAfter(c.getAcilis()); // kapanış <= açılış → ertesi güne sarkar
        if (bugunMu) {
            if (!geceyiAsar) return !t.isBefore(c.getAcilis()) && t.isBefore(c.getKapanis());
            return !t.isBefore(c.getAcilis()); // açılıştan gece yarısına kadar açık
        }
        return geceyiAsar && t.isBefore(c.getKapanis()); // dünden sarkan kısım: 00:00–kapanış
    }

    /** Kapalıyken bir sonraki açılışı insan-okur metne çevirir (örn. "Bugün 18:00", "Yarın 09:00", "Pazartesi 09:00"). */
    private String sonrakiAcilisMetni(List<CalismaSaati> saatler, LocalDateTime now) {
        if (saatler.isEmpty()) return null;
        LocalTime simdi = now.toLocalTime();
        for (int ileri = 0; ileri < 7; ileri++) {
            short gun = (short) now.plusDays(ileri).getDayOfWeek().getValue();
            Optional<CalismaSaati> opt = saatler.stream().filter(c -> c.getGun() == gun).findFirst();
            if (opt.isEmpty()) continue;
            CalismaSaati c = opt.get();
            if (c.isKapali() || c.getAcilis() == null) continue;
            // Bugünse ve açılış zaten geçtiyse atla (kapanmış demektir)
            if (ileri == 0 && !c.getAcilis().isAfter(simdi)) continue;
            String saat = c.getAcilis().format(SAAT_BICIMI);
            if (ileri == 0) return "Bugün " + saat;
            if (ileri == 1) return "Yarın " + saat;
            return GUN_ADLARI[gun] + " " + saat;
        }
        return null;
    }

    // --- yardımcılar ---

    private Satici saticiBul(String yoneticiId) {
        return saticiDeposu.findByYoneticiKullaniciId(yoneticiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hesabınıza bağlı bir satıcı bulunamadı."));
    }

    private MenuOgesi menuOgesiSahipligiyleBul(String ogeId, String saticiId) {
        MenuOgesi oge = menuOgesiDeposu.findById(ogeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menü öğesi bulunamadı."));
        if (!oge.getSaticiId().equals(saticiId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu menü öğesi sizin satıcınıza ait değil.");
        }
        return oge;
    }

    private void menuDogrula(MenuOgesiTalebi talep) {
        if (talep.getAd() == null || talep.getAd().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ürün adı zorunludur.");
        }
        if (talep.getFiyat() == null || talep.getFiyat().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçerli bir fiyat zorunludur.");
        }
    }
}
