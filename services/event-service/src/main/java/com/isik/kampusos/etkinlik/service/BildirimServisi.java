package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.DuyuruTalebi;
import com.isik.kampusos.etkinlik.dto.BildirimYaniti;
import com.isik.kampusos.etkinlik.model.Bildirim;
import com.isik.kampusos.etkinlik.model.BildirimOkuma;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.BildirimOkumaDeposu;
import com.isik.kampusos.etkinlik.repository.BildirimDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BildirimServisi {

    private final BildirimDeposu bildirimDeposu;
    private final BildirimOkumaDeposu bildirimOkumaDeposu;
    private final KulupDeposu kulupDeposu;

    public BildirimYaniti duyuruOlustur(String olusturan, DuyuruTalebi talep) {
        if (talep.getBaslik() == null || talep.getBaslik().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru basligi zorunludur");
        }
        if (talep.getMesaj() == null || talep.getMesaj().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru mesaji zorunludur");
        }
        if (talep.getBaglantiEtiketi() != null && !talep.getBaglantiEtiketi().isBlank() &&
                (talep.getBaglantiUrl() == null || talep.getBaglantiUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Baglanti etiketi verildiginde baglanti URL'i zorunludur");
        }

        Bildirim.HedefKitle kitle = kitleyiCoz(talep.getHedefKitle());
        Bildirim bildirim = Bildirim.builder()
                .baslik(talep.getBaslik().trim())
                .mesaj(talep.getMesaj().trim())
                .baglantiUrl(bosuTemizle(talep.getBaglantiUrl()))
                .baglantiEtiketi(bosuTemizle(talep.getBaglantiEtiketi()))
                .resimUrl(bosuTemizle(talep.getResimUrl()))
                .tur(Bildirim.BildirimTuru.DUYURU)
                .hedefKitle(kitle)
                .olusturan(olusturan)
                .olusturanAdi(bosuTemizle(talep.getOlusturanAdi()))
                .build();

        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti kullaniciyiBilgilendir(String kullaniciId, String baslik, String mesaj, String ilgiliEtkinlikId) {
        return kullaniciyiTurIleBilgilendir(
                kullaniciId,
                baslik,
                mesaj,
                ilgiliEtkinlikId,
                Bildirim.BildirimTuru.ETKINLIK_REVIZYON_TALEBI
        );
    }

    public BildirimYaniti kullaniciyiTurIleBilgilendir(String kullaniciId,
                                                   String baslik,
                                                   String mesaj,
                                                   String ilgiliEtkinlikId,
                                                   Bildirim.BildirimTuru tur) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(tur)
                .hedefKitle(Bildirim.HedefKitle.KULLANICI)
                .aliciKullaniciId(kullaniciId)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl(kullaniciBildirimBaglantisiniCoz(tur, ilgiliEtkinlikId))
                .baglantiEtiketi(kullaniciBildirimEtiketiniCoz(tur))
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti kullaniciyiSertifikaylaBilgilendir(String kullaniciId,
                                                       String baslik,
                                                       String mesaj,
                                                       String ilgiliEtkinlikId) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(Bildirim.BildirimTuru.SERTIFIKA)
                .hedefKitle(Bildirim.HedefKitle.KULLANICI)
                .aliciKullaniciId(kullaniciId)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl("/bildirimler")
                .baglantiEtiketi("Sertifikayı görüntüle")
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti hedefKitleyiBilgilendir(Bildirim.HedefKitle kitle,
                                               String baslik,
                                               String mesaj,
                                               String olusturan,
                                               String olusturanAdi,
                                               String ilgiliEtkinlikId) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(Bildirim.BildirimTuru.DUYURU)
                .hedefKitle(kitle)
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti sksEtkinlikOnayTalebiBilgilendir(String baslik,
                                                              String mesaj,
                                                              String olusturan,
                                                              String olusturanAdi,
                                                              String ilgiliEtkinlikId) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(Bildirim.BildirimTuru.ETKINLIK_ONAY_TALEBI)
                .hedefKitle(Bildirim.HedefKitle.SKS_YONETICILERI)
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .ilgiliEtkinlikId(ilgiliEtkinlikId)
                .baglantiUrl("/")
                .baglantiEtiketi("Etkinlik taleplerini aç")
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti sksProfilOnayTalebiBilgilendir(String baslik,
                                                                String mesaj,
                                                                String olusturan,
                                                                String olusturanAdi) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .tur(Bildirim.BildirimTuru.PROFIL_ONAY_TALEBI)
                .hedefKitle(Bildirim.HedefKitle.SKS_YONETICILERI)
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .baglantiUrl("/")
                .baglantiEtiketi("Profil taleplerini aç")
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public BildirimYaniti kullaniciDuyurusuBilgilendir(String kullaniciId,
                                                       String baslik,
                                                       String mesaj,
                                                       String baglantiUrl,
                                                       String baglantiEtiketi,
                                                       String resimUrl,
                                                       String olusturan,
                                                       String olusturanAdi) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik)
                .mesaj(mesaj)
                .baglantiUrl(bosuTemizle(baglantiUrl))
                .baglantiEtiketi(bosuTemizle(baglantiEtiketi))
                .resimUrl(bosuTemizle(resimUrl))
                .tur(Bildirim.BildirimTuru.DUYURU)
                .hedefKitle(Bildirim.HedefKitle.KULLANICI)
                .aliciKullaniciId(kullaniciId)
                .olusturan(olusturan)
                .olusturanAdi(olusturanAdi)
                .build();
        return yanitaDonustur(bildirimDeposu.save(bildirim), false);
    }

    public List<BildirimYaniti> gorunurBildirimleriListele(String kullaniciId, String yetkiler) {
        List<Bildirim.HedefKitle> kitleler = gorunurKitleler(kullaniciId, yetkiler);

        return bildirimDeposu
                .findByAliciKullaniciIdOrHedefKitleInOrderByOlusturulmaTarihiDesc(kullaniciId, kitleler)
                .stream()
                .map(bildirim -> yanitaDonustur(bildirim, kullaniciTarafindanOkunduMu(bildirim, kullaniciId)))
                .toList();
    }

    public BildirimYaniti okunduOlarakIsaretle(String kullaniciId, String yetkiler, String bildirimId) {
        Bildirim bildirim = bildirimDeposu.findById(bildirimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bildirim bulunamadi"));

        if (!kullaniciTarafindanGorunurMu(bildirim, kullaniciId, gorunurKitleler(kullaniciId, yetkiler))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu bildirime erisim izniniz yok");
        }

        bildirimOkumaDeposu.findByBildirimIdAndKullaniciId(bildirimId, kullaniciId)
                .orElseGet(() -> bildirimOkumaDeposu.save(BildirimOkuma.builder()
                        .bildirimId(bildirimId)
                        .kullaniciId(kullaniciId)
                        .build()));

        return yanitaDonustur(bildirim, true);
    }

    private List<Bildirim.HedefKitle> gorunurKitleler(String kullaniciId, String yetkiler) {
        List<Bildirim.HedefKitle> kitleler = new ArrayList<>();
        if (yetkiler.contains("ROLE_STUDENT")) {
            kitleler.add(Bildirim.HedefKitle.TUM_OGRENCILER);
        }
        if (yetkiler.contains("ROLE_SKS_ADMIN") || yetkiler.contains("ROLE_ADMIN")) {
            kitleler.add(Bildirim.HedefKitle.SKS_YONETICILERI);
        }
        if (kulupDeposu.findByYoneticiKullaniciIdAndSilindiFalse(kullaniciId).size() > 0) {
            kitleler.add(Bildirim.HedefKitle.KULUP_BASKANLARI);
        }

        return kitleler;
    }

    private boolean kullaniciTarafindanGorunurMu(Bildirim bildirim, String kullaniciId, List<Bildirim.HedefKitle> kitleler) {
        return kullaniciId.equals(bildirim.getAliciKullaniciId()) || kitleler.contains(bildirim.getHedefKitle());
    }

    private boolean kullaniciTarafindanOkunduMu(Bildirim bildirim, String kullaniciId) {
        return bildirimOkumaDeposu.existsByBildirimIdAndKullaniciId(bildirim.getId(), kullaniciId);
    }

    private Bildirim.HedefKitle kitleyiCoz(String deger) {
        if ("CLUB_PRESIDENTS".equalsIgnoreCase(deger) || "KULUP_BASKANLARI".equalsIgnoreCase(deger)) {
            return Bildirim.HedefKitle.KULUP_BASKANLARI;
        }
        if ("ALL_STUDENTS".equalsIgnoreCase(deger) || "TUM_OGRENCILER".equalsIgnoreCase(deger)) {
            return Bildirim.HedefKitle.TUM_OGRENCILER;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gecersiz bildirim hedef kitlesi");
    }

    private BildirimYaniti yanitaDonustur(Bildirim bildirim, boolean okundu) {
        return BildirimYaniti.builder()
                .id(bildirim.getId())
                .baslik(bildirim.getBaslik())
                .mesaj(bildirim.getMesaj())
                .baglantiUrl(bildirim.getBaglantiUrl())
                .baglantiEtiketi(bildirim.getBaglantiEtiketi())
                .resimUrl(bildirim.getResimUrl())
                .tur(bildirim.getTur().name())
                .hedefKitle(bildirim.getHedefKitle().name())
                .ilgiliEtkinlikId(bildirim.getIlgiliEtkinlikId())
                .olusturan(bildirim.getOlusturan())
                .olusturanAdi(bildirim.getOlusturanAdi())
                .okundu(okundu)
                .olusturulmaTarihi(bildirim.getOlusturulmaTarihi())
                .build();
    }

    private String bosuTemizle(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String kullaniciBildirimBaglantisiniCoz(Bildirim.BildirimTuru tur, String ilgiliEtkinlikId) {
        if (ilgiliEtkinlikId == null || ilgiliEtkinlikId.isBlank()) {
            return null;
        }
        if (tur == Bildirim.BildirimTuru.ETKINLIK_ONAY_TALEBI
                || tur == Bildirim.BildirimTuru.ETKINLIK_REVIZYON_TALEBI) {
            return "/kulup-yonetimi/etkinlikler/" + ilgiliEtkinlikId;
        }
        if (tur == Bildirim.BildirimTuru.PROFIL_ONAY_TALEBI) {
            return "/kulup-yonetimi";
        }
        return null;
    }

    private String kullaniciBildirimEtiketiniCoz(Bildirim.BildirimTuru tur) {
        if (tur == Bildirim.BildirimTuru.ETKINLIK_ONAY_TALEBI
                || tur == Bildirim.BildirimTuru.ETKINLIK_REVIZYON_TALEBI) {
            return "Etkinliği aç";
        }
        if (tur == Bildirim.BildirimTuru.PROFIL_ONAY_TALEBI) {
            return "Kulüp yönetimini aç";
        }
        return null;
    }
}
