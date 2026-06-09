package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.CalismaSaatiTalebi;
import com.isik.kampusos.yemek.dto.KampanyaTalebi;
import com.isik.kampusos.yemek.dto.MenuOgesiTalebi;
import com.isik.kampusos.yemek.dto.SaticiGuncellemeTalebi;
import com.isik.kampusos.yemek.dto.SaticiOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.SaticiYaniti;
import com.isik.kampusos.yemek.model.CalismaSaati;
import com.isik.kampusos.yemek.model.Kampanya;
import com.isik.kampusos.yemek.model.MenuOgesi;
import com.isik.kampusos.yemek.model.MenuSecenekGrubu;
import com.isik.kampusos.yemek.model.MenuSecenegi;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.repository.CalismaSaatiDeposu;
import com.isik.kampusos.yemek.repository.IsletmePersonelDeposu;
import com.isik.kampusos.yemek.repository.KampanyaDeposu;
import com.isik.kampusos.yemek.repository.MenuOgesiDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
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
                        .flatMap(p -> saticiDeposu.findById(p.getSaticiId())))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Hesabınıza bağlı bir işletme bulunamadı."));
    }

    @Transactional
    public Satici saticiGuncelle(String yoneticiId, SaticiGuncellemeTalebi talep) {
        Satici s = saticiBul(yoneticiId);
        if (talep.getAd() != null) s.setAd(talep.getAd());
        if (talep.getAciklama() != null) s.setAciklama(talep.getAciklama());
        if (talep.getKonumMetni() != null) s.setKonumMetni(talep.getKonumMetni());
        if (talep.getLogoUrl() != null) s.setLogoUrl(talep.getLogoUrl());
        if (talep.getAcik() != null) s.setAcik(talep.getAcik());
        if (talep.getMutfakTuru() != null) s.setMutfakTuru(talep.getMutfakTuru());
        if (talep.getKapakGorselUrl() != null) s.setKapakGorselUrl(talep.getKapakGorselUrl());
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
    public Satici adminOlustur(SaticiOlusturmaTalebi talep) {
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
                .aciklama(talep.getAciklama())
                .logoUrl(talep.getLogoUrl())
                .durum(Satici.SaticiDurumu.AKTIF)
                .acik(true)
                .build();
        return saticiDeposu.save(s);
    }

    @Transactional
    public Satici adminGuncelle(String id, SaticiOlusturmaTalebi talep) {
        Satici s = saticiDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Satıcı bulunamadı."));
        if (talep.getAd() != null) s.setAd(talep.getAd());
        if (talep.getKonumMetni() != null) s.setKonumMetni(talep.getKonumMetni());
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

    // --- yardımcılar: açık/kapalı hesaplama + yanıt üretimi ---

    /** Satıcıyı çalışma saatleriyle birlikte zenginleştirilmiş yanıta dönüştürür. */
    private SaticiYaniti yanitYap(Satici s) {
        List<CalismaSaati> saatler = calismaSaatiDeposu.findBySaticiIdOrderByGunAsc(s.getId());
        LocalDateTime now = LocalDateTime.now();
        boolean suAnAcik = suAnAcikMi(s, saatler, now);
        String sonraki = suAnAcik ? null : sonrakiAcilisMetni(saatler, now);
        return SaticiYaniti.of(s, suAnAcik, sonraki, saatler);
    }

    /** durum AKTIF + manuel açık + bugünkü çalışma saati aralığında mı? */
    private boolean suAnAcikMi(Satici s, List<CalismaSaati> saatler, LocalDateTime now) {
        if (s.getDurum() != Satici.SaticiDurumu.AKTIF || !s.isAcik()) return false;
        short bugun = (short) now.getDayOfWeek().getValue(); // 1=Pzt … 7=Paz
        Optional<CalismaSaati> bugunkuOpt = saatler.stream().filter(c -> c.getGun() == bugun).findFirst();
        if (bugunkuOpt.isEmpty()) return false; // saat tanımlı değilse kapalı kabul
        CalismaSaati c = bugunkuOpt.get();
        if (c.isKapali() || c.getAcilis() == null || c.getKapanis() == null) return false;
        LocalTime t = now.toLocalTime();
        return !t.isBefore(c.getAcilis()) && t.isBefore(c.getKapanis());
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
