package com.isik.kampusos.kulup.service;

import com.isik.kampusos.kulup.bildirim.BildirimYayinlayici;

import com.isik.kampusos.kulup.dto.SertifikaVerilmeYaniti;
import com.isik.kampusos.kulup.dto.EtkinlikKatilimciYaniti;
import com.isik.kampusos.kulup.model.DenetimGunlugu;
import com.isik.kampusos.kulup.model.Etkinlik;
import com.isik.kampusos.kulup.model.EtkinlikKatilimi;
import com.isik.kampusos.kulup.repository.EtkinlikDeposu;
import com.isik.kampusos.kulup.repository.EtkinlikKatilimiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EtkinlikKatilimServisi {

    private final EtkinlikDeposu etkinlikDeposu;
    private final EtkinlikKatilimiDeposu etkinlikKatilimiDeposu;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final BildirimYayinlayici bildirimYayinlayici;
    private final DenetimGunluguServisi denetimGunluguServisi;

    @Transactional
    public EtkinlikKatilimi katilimOlustur(String kullaniciId, String etkinlikId) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.YAYINLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sadece yayınlanmış etkinliklere katılım sağlanabilir");
        }

        Optional<EtkinlikKatilimi> mevcutKatilim = etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId(etkinlikId, kullaniciId);
        if (mevcutKatilim.isPresent() && mevcutKatilim.get().getDurum() != EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu etkinliğe zaten katılım talebiniz var");
        }

        EtkinlikKatilimi katilim = mevcutKatilim.orElseGet(() -> EtkinlikKatilimi.builder()
                .etkinlikId(etkinlikId)
                .kullaniciId(kullaniciId)
                .build());
        katilim.setOdemeIncelemeTarihi(null);
        katilim.setOdemeyiInceleyen(null);
        katilim.setOdemeRedNedeni(null);
        katilim.setYoklamaTarihi(null);
        katilim.setYoklamayiYapan(null);
        katilim.setSertifikaGonderilmeTarihi(null);
        katilim.setYoklamaBelirteci(null);

        if (!etkinlik.isKontenjanSiniriVar()) {
            ilkKatilimDurumunuUygula(etkinlik, katilim);
            etkinlik.setMevcutRsvpSayisi(etkinlik.getMevcutRsvpSayisi() + 1);
        } else {
            if (etkinlik.getMevcutRsvpSayisi() < etkinlik.getKontenjan()) {
                ilkKatilimDurumunuUygula(etkinlik, katilim);
                etkinlik.setMevcutRsvpSayisi(etkinlik.getMevcutRsvpSayisi() + 1);
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Etkinlik kontenjanı doludur");
            }
        }

        etkinlikDeposu.save(etkinlik);
        return etkinlikKatilimiDeposu.save(katilim);
    }

    @Transactional
    public EtkinlikKatilimi katilimiIptalEt(String kullaniciId, String etkinlikId) {
        EtkinlikKatilimi katilim = etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId(etkinlikId, kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Katılım talebi bulunamadı"));

        if (katilim.getDurum() == EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI) {
            return katilim;
        }

        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));
        
        if (katilim.getDurum() == EtkinlikKatilimi.KatilimDurumu.ONAYLANDI || katilim.getDurum() == EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR) {
            etkinlik.setMevcutRsvpSayisi(etkinlik.getMevcutRsvpSayisi() - 1);
        } else if (katilim.getDurum() == EtkinlikKatilimi.KatilimDurumu.YEDEKTE) {
            etkinlik.setMevcutYedekSayisi(etkinlik.getMevcutYedekSayisi() - 1);
        }

        katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI);
        etkinlikDeposu.save(etkinlik);
        return etkinlikKatilimiDeposu.save(katilim);
    }

    @Transactional
    public EtkinlikKatilimi kullaniciYoklamasiAl(String yoneticiId, String roller, String etkinlikId, String hedefKullaniciId) {
        Etkinlik etkinlik = kulupYonetimiIcinEtkinlikGetir(yoneticiId, etkinlikId);
        etkinliginYoklamaSaatindeOldugundanEminOl(etkinlik);

        EtkinlikKatilimi katilim = etkinlikKatilimiDeposu.findByEtkinlikIdAndKullaniciId(etkinlikId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Katılım talebi bulunamadı"));

        if (katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.ONAYLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kullanıcının katılımı onaylanmamış");
        }

        katildiOlarakIsaretle(katilim, yoneticiId);
        EtkinlikKatilimi kaydedilen = etkinlikKatilimiDeposu.save(katilim);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, "MANUAL_CHECK_IN", yoneticiId, roller,
                hedefKullaniciId + " öğrencisinin yoklaması manuel alındı.");
        return kaydedilen;
    }

    @Transactional
    public EtkinlikKatilimi odemeyiOnayla(String yoneticiId, String roller, String etkinlikId, String katilimId) {
        Etkinlik etkinlik = kulupYonetimiIcinEtkinlikGetir(yoneticiId, etkinlikId);
        etkinliginGecmisOlmadigindanEminOl(etkinlik, "Geçmiş etkinlikler için ödeme incelemesi yapılamaz");
        EtkinlikKatilimi katilim = etkinlikKatilimiDeposu.findById(katilimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Katılım talebi bulunamadı"));
        katiliminEtkinligeAitOldugundanEminOl(katilim, etkinlikId);

        if (!etkinlik.isUcretli()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etkinlik ücretli değil");
        }
        if (katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Katılım talebi ödeme onayı beklemiyor");
        }

        katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.ONAYLANDI);
        katilim.setYoklamaBelirteci(yoklamaBelirteciOlustur());
        katilim.setOdemeIncelemeTarihi(LocalDateTime.now());
        katilim.setOdemeyiInceleyen(yoneticiId);
        katilim.setOdemeRedNedeni(null);
        EtkinlikKatilimi kaydedilen = etkinlikKatilimiDeposu.save(katilim);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, "PAYMENT_APPROVED", yoneticiId, roller,
                katilim.getKullaniciId() + " öğrencisinin ödemesi onaylandı.");
        return kaydedilen;
    }

    @Transactional
    public EtkinlikKatilimi odemeyiReddet(String yoneticiId, String roller, String etkinlikId, String katilimId) {
        Etkinlik etkinlik = kulupYonetimiIcinEtkinlikGetir(yoneticiId, etkinlikId);
        etkinliginGecmisOlmadigindanEminOl(etkinlik, "Geçmiş etkinlikler için ödeme incelemesi yapılamaz");
        EtkinlikKatilimi katilim = etkinlikKatilimiDeposu.findById(katilimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Katılım talebi bulunamadı"));
        katiliminEtkinligeAitOldugundanEminOl(katilim, etkinlikId);

        if (katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Katılım talebi ödeme onayı beklemiyor");
        }

        katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI);
        katilim.setOdemeIncelemeTarihi(LocalDateTime.now());
        katilim.setOdemeyiInceleyen(yoneticiId);
        katilim.setOdemeRedNedeni("Ödeme onaylanmadı");
        etkinlik.setMevcutRsvpSayisi(Math.max(0, etkinlik.getMevcutRsvpSayisi() - 1));
        etkinlikDeposu.save(etkinlik);
        EtkinlikKatilimi kaydedilen = etkinlikKatilimiDeposu.save(katilim);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, "PAYMENT_REJECTED", yoneticiId, roller,
                katilim.getKullaniciId() + " öğrencisinin ödemesi reddedildi.");
        return kaydedilen;
    }

    @Transactional(readOnly = true)
    public List<EtkinlikKatilimi> katilimlarimiListele(String kullaniciId) {
        return etkinlikKatilimiDeposu.findByKullaniciIdOrderByOlusturulmaTarihiDesc(kullaniciId);
    }

    @Transactional(readOnly = true)
    public List<EtkinlikKatilimciYaniti> katilimcilariListele(String yoneticiId, String roller, String etkinlikId) {
        Etkinlik etkinlik = yonetimIcinEtkinlikGetir(yoneticiId, roller, etkinlikId);
        return etkinlikKatilimiDeposu.findByEtkinlikId(etkinlik.getId()).stream()
                .map(this::katilimciYanitinaDonustur)
                .toList();
    }

    @Transactional
    public EtkinlikKatilimi qrKoduIleYoklamaAl(String yoneticiId, String roller, String etkinlikId, String belirtec) {
        Etkinlik etkinlik = kulupYonetimiIcinEtkinlikGetir(yoneticiId, etkinlikId);
        etkinliginYoklamaSaatindeOldugundanEminOl(etkinlik);

        if (!etkinlik.isQrGirisEtkin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu etkinlik için QR kod ile yoklama alma etkin değil");
        }
        if (belirtec == null || belirtec.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "QR kod yoklama belirteci zorunludur");
        }

        EtkinlikKatilimi katilim = etkinlikKatilimiDeposu.findByEtkinlikIdAndYoklamaBelirteci(etkinlikId, belirtec.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verilen QR kod belirtecine ait katılım kaydı bulunamadı"));

        if (katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.ONAYLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sadece katılımı onaylanmış katılımcıların yoklaması alınabilir");
        }

        katildiOlarakIsaretle(katilim, yoneticiId);
        EtkinlikKatilimi kaydedilen = etkinlikKatilimiDeposu.save(katilim);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, "QR_CHECK_IN", yoneticiId, roller,
                katilim.getKullaniciId() + " öğrencisinin QR yoklaması alındı.");
        return kaydedilen;
    }

    @Transactional
    public SertifikaVerilmeYaniti sertifikalariOlustur(String yoneticiId, String roller, String etkinlikId) {
        Etkinlik etkinlik = yonetimIcinEtkinlikGetir(yoneticiId, roller, etkinlikId);

        if (!etkinlik.isSertifikaEtkin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu etkinlik için sertifika üretimi etkinleştirilmemiş");
        }
        etkinliginGecmisOldugundanEminOl(etkinlik, "Sertifikalar sadece etkinlik bittikten sonra dağıtılabilir");

        List<EtkinlikKatilimi> uygunKatilimcilar = etkinlikKatilimiDeposu.findByEtkinlikIdAndDurumOrderByOlusturulmaTarihiAsc(etkinlikId, EtkinlikKatilimi.KatilimDurumu.KATILDI);
        int gonderilenSayisi = 0;
        LocalDateTime simdi = LocalDateTime.now();

        for (EtkinlikKatilimi katilim : uygunKatilimcilar) {
            if (katilim.getSertifikaGonderilmeTarihi() == null) {
                katilim.setSertifikaGonderilmeTarihi(simdi);
                gonderilenSayisi++;
                String kod = sertifikaKodu(etkinlik, katilim);
                bildirimYayinlayici.kullaniciyiSertifikaylaBilgilendir(
                        katilim.getKullaniciId(),
                        "Katılım sertifikan hazır",
                        String.format("%s etkinliği için katılım sertifikan oluşturuldu. Sertifika kodu: %s",
                                sertifikaBasligi(etkinlik), kod),
                        etkinlik.getId()
                );
                String paylasimYuku = sertifikaYukunuHazirla(etkinlik, katilim, kod, simdi);
                kafkaTemplate.send("etkinlik.sertifika.olusturma-talep-edildi", katilim.getKullaniciId(), paylasimYuku);
            }
        }

        if (gonderilenSayisi > 0) {
            etkinlikKatilimiDeposu.saveAll(uygunKatilimcilar);
            etkinlik.setSertifikalarinOlusturulmaTarihi(simdi);
            etkinlikDeposu.save(etkinlik);
            denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlikId, "CERTIFICATES_ISSUED", yoneticiId, roller,
                    gonderilenSayisi + " katılımcı için sertifika gönderimi başlatıldı.");
        }

        return new SertifikaVerilmeYaniti(etkinlikId, uygunKatilimcilar.size(), gonderilenSayisi);
    }

    private Etkinlik yonetimIcinEtkinlikGetir(String yoneticiId, String roller, String etkinlikId) {
        // We will return Etkinlik.
        return etkinlikGetir(yoneticiId, roller, etkinlikId);
    }

    private Etkinlik etkinlikGetir(String yoneticiId, String roller, String etkinlikId) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        boolean kulupYoneticisiMi = etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(yoneticiId.trim());
        boolean sistemYoneticisiMi = roller != null && (roller.contains("ROLE_SKS_ADMIN") || roller.contains("ROLE_ADMIN"));

        if (!kulupYoneticisiMi && !sistemYoneticisiMi) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi veya sistem yöneticisi katılımcıları yönetebilir");
        }

        return etkinlik;
    }

    private Etkinlik kulupYonetimiIcinEtkinlikGetir(String yoneticiId, String etkinlikId) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (!etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(yoneticiId.trim())) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi bu işlemi gerçekleştirebilir");
        }

        return etkinlik;
    }

    private void katildiOlarakIsaretle(EtkinlikKatilimi katilim, String yoklamayiYapan) {
        katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.KATILDI);
        katilim.setYoklamayiYapan(yoklamayiYapan);
        katilim.setYoklamaTarihi(LocalDateTime.now());
    }

    private void etkinliginYoklamaSaatindeOldugundanEminOl(Etkinlik etkinlik) {
        LocalDateTime baslangic = etkinlik.getBaslangicTarihi();
        LocalDateTime bitis = etkinlik.getBitisTarihi() != null ? etkinlik.getBitisTarihi() : etkinlik.getBaslangicTarihi();
        LocalDateTime simdi = LocalDateTime.now();

        if (baslangic != null && simdi.isBefore(baslangic.minusHours(1))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yoklama işlemleri etkinlik başlangıcından en erken 1 saat önce açılabilir");
        }
        if (bitis != null && simdi.isAfter(bitis.plusHours(1))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yoklama işlemleri etkinlik bitişinden en geç 1 saat sonra kapanır");
        }
    }

    private void etkinliginGecmisOlmadigindanEminOl(Etkinlik etkinlik, String hataMesaji) {
        LocalDateTime sınır = etkinlik.getBitisTarihi() != null ? etkinlik.getBitisTarihi() : etkinlik.getBaslangicTarihi();
        if (sınır != null && sınır.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, hataMesaji);
        }
    }

    private void etkinliginGecmisOldugundanEminOl(Etkinlik etkinlik, String hataMesaji) {
        LocalDateTime sınır = etkinlik.getBitisTarihi() != null ? etkinlik.getBitisTarihi() : etkinlik.getBaslangicTarihi();
        if (sınır == null || sınır.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, hataMesaji);
        }
    }

    private String sertifikaYukunuHazirla(Etkinlik etkinlik, EtkinlikKatilimi katilim, String sertifikaKodu, LocalDateTime olusturulmaTarihi) {
        return String.format(
                "{\"etkinlikId\":\"%s\",\"etkinlikBasligi\":\"%s\",\"kulupAdi\":\"%s\",\"kullaniciId\":\"%s\",\"sertifikaBasligi\":\"%s\",\"sertifikaKodu\":\"%s\",\"olusturulmaTarihi\":\"%s\",\"etkinlikTarihi\":\"%s\",\"etkinlikYeri\":\"%s\",\"kulupBaskaniAdi\":\"%s\"}",
                jsonCoz(etkinlik.getId()),
                jsonCoz(etkinlik.getBaslik()),
                jsonCoz(etkinlik.getKulup().getAd()),
                jsonCoz(katilim.getKullaniciId()),
                jsonCoz(sertifikaBasligi(etkinlik)),
                jsonCoz(sertifikaKodu),
                jsonCoz(olusturulmaTarihi.toString()),
                jsonCoz(etkinlik.getBaslangicTarihi() != null ? etkinlik.getBaslangicTarihi().toString() : ""),
                jsonCoz(sertifikaKonumu(etkinlik)),
                jsonCoz(etkinlik.getKulup().getBaskanTamAdi())
        );
    }

    private String sertifikaKonumu(Etkinlik etkinlik) {
        if (etkinlik.getKonumAdi() != null && !etkinlik.getKonumAdi().isBlank()) {
            return etkinlik.getKonumAdi().trim();
        }
        if (etkinlik.getKonum() != null && !etkinlik.getKonum().isBlank()) {
            return etkinlik.getKonum().trim();
        }
        if (etkinlik.getEtkinlikTuru() == Etkinlik.EtkinlikTuru.CEVRIMICI) {
            return etkinlik.getCevrimiciPlatform() != null && !etkinlik.getCevrimiciPlatform().isBlank()
                    ? etkinlik.getCevrimiciPlatform().trim()
                    : "Çevrimiçi Etkinlik";
        }
        return "FMV Işık Üniversitesi";
    }

    private String sertifikaBasligi(Etkinlik etkinlik) {
        if (etkinlik.getSertifikaBasligi() != null && !etkinlik.getSertifikaBasligi().isBlank()) {
            return etkinlik.getSertifikaBasligi().trim();
        }
        return etkinlik.getBaslik();
    }

    private String sertifikaKodu(Etkinlik etkinlik, EtkinlikKatilimi katilim) {
        return "CERT-" + kisaId(etkinlik.getId()) + "-" + kisaId(katilim.getId());
    }

    private String kisaId(String deger) {
        String normalizeEdilmis = deger == null ? "" : deger.replace("-", "").toUpperCase();
        return normalizeEdilmis.length() <= 8 ? normalizeEdilmis : normalizeEdilmis.substring(0, 8);
    }

    private String jsonCoz(String deger) {
        return deger == null ? "" : deger
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private EtkinlikKatilimciYaniti katilimciYanitinaDonustur(EtkinlikKatilimi katilim) {
        return EtkinlikKatilimciYaniti.builder()
                .katilimId(katilim.getId())
                .etkinlikId(katilim.getEtkinlikId())
                .kullaniciId(katilim.getKullaniciId())
                .durum(katilim.getDurum())
                .kayitTarihi(katilim.getOlusturulmaTarihi())
                .yoklamaTarihi(katilim.getYoklamaTarihi())
                .yoklamayiYapan(katilim.getYoklamayiYapan())
                .odemeBekliyor(katilim.getDurum() == EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR)
                .odemeOnaylandi(katilim.getOdemeIncelemeTarihi() != null && katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI)
                .odemeIncelemeTarihi(katilim.getOdemeIncelemeTarihi())
                .odemeyiInceleyen(katilim.getOdemeyiInceleyen())
                .odemeRedNedeni(katilim.getOdemeRedNedeni())
                .sertifikaGonderildi(katilim.getSertifikaGonderilmeTarihi() != null)
                .sertifikaGonderilmeTarihi(katilim.getSertifikaGonderilmeTarihi())
                .build();
    }

    private void ilkKatilimDurumunuUygula(Etkinlik etkinlik, EtkinlikKatilimi katilim) {
        if (etkinlik.isUcretli()) {
            katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.ODEME_BEKLIYOR);
            return;
        }

        katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.ONAYLANDI);
        katilim.setYoklamaBelirteci(yoklamaBelirteciOlustur());
    }

    private void katiliminEtkinligeAitOldugundanEminOl(EtkinlikKatilimi katilim, String etkinlikId) {
        if (!etkinlikId.equals(katilim.getEtkinlikId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Katılım talebi bu etkinliğe ait değil");
        }
    }

    private String yoklamaBelirteciOlustur() {
        return UUID.randomUUID().toString();
    }
}
