package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.EtkinlikOlusturmaTalebi;
import com.isik.kampusos.etkinlik.dto.EtkinlikIptalTalebi;
import com.isik.kampusos.etkinlik.dto.EtkinlikGeriBildirimTalebi;
import com.isik.kampusos.etkinlik.dto.EtkinlikGuncellemeTalebi;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.model.EtkinlikDegisiklikIstegi;
import com.isik.kampusos.etkinlik.model.Bildirim;
import com.isik.kampusos.etkinlik.model.EtkinlikKatilimi;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikDegisiklikIstegiDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikKatilimiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EtkinlikServisi {

    private static final DateTimeFormatter BILDIRIM_TARIH_FORMATI = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final List<KulupUyesi.UyeDurumu> AKTIF_BENZERI_UYE_DURUMLARI = List.of(
            KulupUyesi.UyeDurumu.AKTIF,
            KulupUyesi.UyeDurumu.BEKLEMEDE);

    private final EtkinlikDeposu etkinlikDeposu;
    private final EtkinlikDegisiklikIstegiDeposu etkinlikDegisiklikIstegiDeposu;
    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final EtkinlikKatilimiDeposu etkinlikKatilimiDeposu;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final BildirimServisi bildirimServisi;
    private final DenetimGunluguServisi denetimGunluguServisi;

    public Etkinlik etkinlikTaslagiOlustur(String kullaniciId, EtkinlikOlusturmaTalebi talep) {
        Kulup kulup = kulupDeposu.findById(talep.getKulupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        if (!kulup.isAktif()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Aktif olmayan kulüpler etkinlik oluşturamaz");
        }
        if (!kulup.getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim())) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi etkinlik oluşturabilir");
        }
        etkinlikTalebiniDogrula(talep);

        Etkinlik etkinlik = Etkinlik.builder()
                .kulup(kulup)
                .baslik(talep.getBaslik())
                .aciklama(talep.getAciklama())
                .baslangicTarihi(talep.getBaslangicTarihi())
                .bitisTarihi(talep.getBitisTarihi())
                .konum(eskiKonumuCoz(talep))
                .etkinlikTuru(talep.getEtkinlikTuru() != null ? talep.getEtkinlikTuru() : Etkinlik.EtkinlikTuru.YUZ_YUZE)
                .cevrimiciPlatform(bosuNullYap(talep.getCevrimiciPlatform()))
                .cevrimiciToplantiUrl(bosuNullYap(talep.getCevrimiciToplantiUrl()))
                .konumAdi(bosuNullYap(talep.getKonumAdi()))
                .konumDetayi(bosuNullYap(talep.getKonumDetayi()))
                .enlem(talep.getEnlem())
                .boylam(talep.getBoylam())
                .afisResmiUrl(bosuNullYap(talep.getAfisResmiUrl()))
                .kontenjanSiniriVar(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()))
                .kontenjanSinirli(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()))
                .kontenjan(talep.getKontenjan())
                .yedekListesiSiniriVar(false)
                .yedekListesiKontenjani(0)
                .qrGirisEtkin(talep.isQrGirisEtkin())
                .sertifikaEtkin(talep.isSertifikaEtkin())
                .sertifikaBasligi(talep.getSertifikaBasligi())
                .ucretli(talep.isUcretli())
                .ucretTutari(talep.getUcretTutari())
                .iban(bosuNullYap(talep.getIban()))
                .odemeTalimatlari(bosuNullYap(talep.getOdemeTalimatlari()))
                .hatirlaticiEtkin(talep.isHatirlaticiEtkin())
                .hatirlatmaZamanlariDakika(hatirlatmaDakikalariniNormalizeEt(talep.getHatirlatmaZamanlariDakika()))
                .gonderilenHatirlatmaZamanlariDakika("")
                .mevcutRsvpSayisi(0)
                .mevcutYedekSayisi(0)
                .durum(Etkinlik.EtkinlikDurumu.TASLAK)
                .build();

        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_DRAFT_CREATED", kullaniciId, "CLUB_ADMIN",
                kaydedilen.getKulup().getAd() + " kulübü " + kaydedilen.getBaslik() + " etkinlik taslağını oluşturdu.");
        return kaydedilen;
    }

    public Etkinlik onayaSun(String kullaniciId, String etkinlikId) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (!etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim())) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi onaya sunabilir");
        }
        if (gecmisEtkinlikMi(etkinlik)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Geçmiş etkinlikler onaya sunulamaz");
        }

        etkinlik.setDurum(Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR);
        etkinlik.setRedNedeni(null);
        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_SUBMITTED", kullaniciId, "CLUB_ADMIN",
                kaydedilen.getBaslik() + " etkinliği SKS onayına gönderildi.");

        bildirimServisi.sksEtkinlikOnayTalebiBilgilendir(
                "Yeni etkinlik onay talebi",
                kaydedilen.getKulup().getAd() + " kulübü \"" + kaydedilen.getBaslik() + "\" etkinliği için SKS onayı istedi.",
                kullaniciId,
                kaydedilen.getKulup().getAd(),
                kaydedilen.getId()
        );

        return kaydedilen;
    }

    public Etkinlik etkinlikOnayla(String adminId, String etkinlikId) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etkinlik onay bekleyen durumda değil");
        }
        if (gecmisEtkinlikMi(etkinlik)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Geçmiş etkinlikler yayınlanamaz");
        }

        etkinlik.setDurum(Etkinlik.EtkinlikDurumu.YAYINLANDI);
        etkinlik.setOnaylayan(adminId);
        etkinlik.setOnayTarihi(LocalDateTime.now());
        etkinlik.setYayinTarihi(LocalDateTime.now());
        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_APPROVED", adminId, "SKS",
                kaydedilen.getBaslik() + " etkinliği onaylandı ve yayınlandı.");

        // Kafka: bildirim servisi tetikle
        String paylasimYuku = String.format("{\"etkinlikId\":\"%s\", \"baslik\":\"%s\", \"onaylayan\":\"%s\"}",
                kaydedilen.getId(), kaydedilen.getBaslik(), adminId);
        kafkaTemplate.send("etkinlik.yayinlandi", kaydedilen.getId(), paylasimYuku);

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                kaydedilen.getKulup().getYoneticiKullaniciId(),
                "Etkinlik talebi onaylandı",
                kaydedilen.getKulup().getAd() + " kulübünün \"" + kaydedilen.getBaslik() + "\" etkinliği SKS tarafından onaylandı ve yayınlandı.",
                kaydedilen.getId(),
                Bildirim.BildirimTuru.ETKINLIK_ONAY_TALEBI
        );
        kulupUyelerineYeniEtkinligiDuyur(kaydedilen);

        return kaydedilen;
    }

    public Etkinlik revizyonTalepEt(String adminId, String etkinlikId, EtkinlikGeriBildirimTalebi talep) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR
                && etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.REVIZYON_TALEP_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etkinlik SKS incelemesi bekleyen durumda değil");
        }
        if (talep.getGeriBildirim() == null || talep.getGeriBildirim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geri bildirim gereklidir");
        }

        etkinlik.setDurum(Etkinlik.EtkinlikDurumu.REVIZYON_TALEP_EDILDI);
        etkinlik.setRedNedeni(talep.getGeriBildirim().trim());
        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_REVISION_REQUESTED", adminId, "SKS",
                kaydedilen.getBaslik() + " etkinliği için revizyon istendi: " + kaydedilen.getRedNedeni());

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                kaydedilen.getKulup().getYoneticiKullaniciId(),
                "Etkinlik düzenleme talebi",
                kaydedilen.getBaslik() + " etkinliği için SKS düzenleme istedi: " + kaydedilen.getRedNedeni(),
                kaydedilen.getId(),
                Bildirim.BildirimTuru.ETKINLIK_REVIZYON_TALEBI
        );

        return kaydedilen;
    }

    @Transactional
    public Etkinlik etkinlikIptalEt(String kullaniciId, String roller, String etkinlikId, EtkinlikIptalTalebi talep) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        boolean kulupYoneticisiMi = etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim());
        boolean sistemYoneticisiMi = roller != null && (roller.contains("ROLE_SKS_ADMIN") || roller.contains("ROLE_ADMIN"));
        if (!kulupYoneticisiMi && !sistemYoneticisiMi) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi veya sistem yöneticisi etkinliği iptal edebilir");
        }
        if (etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.YAYINLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sadece yayınlanmış etkinlikler iptal edebilir");
        }
        if (gecmisEtkinlikMi(etkinlik)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Geçmiş etkinlikler iptal edilemez");
        }

        String neden = talep != null && talep.getNeden() != null && !talep.getNeden().isBlank()
                ? talep.getNeden().trim()
                : "Etkinlik kulüp yönetimi tarafından iptal edildi.";

        etkinlik.setDurum(Etkinlik.EtkinlikDurumu.IPTAL_EDILDI);
        etkinlik.setRedNedeni(neden);

        List<EtkinlikKatilimi> katilimlar = etkinlikKatilimiDeposu.findByEtkinlikId(etkinlikId);
        katilimlar.stream()
                .filter(katilim -> katilim.getDurum() != EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI)
                .forEach(katilim -> katilim.setDurum(EtkinlikKatilimi.KatilimDurumu.IPTAL_EDILDI));
        if (!katilimlar.isEmpty()) {
            etkinlikKatilimiDeposu.saveAll(katilimlar);
        }

        etkinlik.setMevcutRsvpSayisi(0);
        etkinlik.setMevcutYedekSayisi(0);
        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_CANCELLED", kullaniciId, roller, 
                kaydedilen.getBaslik() + " etkinliği iptal edildi. Gerekçe: " + neden);

        bildirimServisi.hedefKitleyiBilgilendir(
                Bildirim.HedefKitle.TUM_OGRENCILER,
                "Etkinlik iptal edildi: " + kaydedilen.getBaslik(),
                kaydedilen.getKulup().getAd() + " kulübünün \"" + kaydedilen.getBaslik() + "\" etkinliği iptal edildi.\n\nGerekçe: " + neden,
                kullaniciId,
                kaydedilen.getKulup().getAd(),
                kaydedilen.getId()
        );

        String paylasimYuku = String.format("{\"etkinlikId\":\"%s\", \"baslik\":\"%s\", \"iptalEden\":\"%s\"}",
                kaydedilen.getId(), kaydedilen.getBaslik(), kullaniciId);
        kafkaTemplate.send("etkinlik.iptal-edildi", kaydedilen.getId(), paylasimYuku);

        return kaydedilen;
    }

    public Etkinlik etkinlikGuncelle(String kullaniciId, String etkinlikId, EtkinlikGuncellemeTalebi talep) {
        Etkinlik etkinlik = etkinlikDeposu.findById(etkinlikId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etkinlik bulunamadı"));

        if (!etkinlik.getKulup().getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim())) {
            throw new AccessDeniedException("Sadece kulüp yöneticisi etkinliği güncelleyebilir");
        }
        if (gecmisEtkinlikMi(etkinlik)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Geçmiş etkinlikler güncellenemez");
        }
        etkinlikTalebiniDogrula(talep);

        if (etkinlik.getDurum() == Etkinlik.EtkinlikDurumu.YAYINLANDI) {
            EtkinlikDegisiklikIstegi degisiklikIstegi = degisiklikIstegiOlustur(etkinlik, kullaniciId, talep);
            etkinlikDegisiklikIstegiDeposu.save(degisiklikIstegi);
            denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlik.getId(), "EVENT_CHANGE_REQUESTED", kullaniciId, "CLUB_ADMIN",
                    etkinlik.getBaslik() + " etkinliği için değişiklik talebi oluşturuldu.");
            return etkinlik;
        }

        if (etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.TASLAK && etkinlik.getDurum() != Etkinlik.EtkinlikDurumu.REVIZYON_TALEP_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mevcut durumda etkinlik düzenlenemez");
        }

        guncellemeyiUygula(etkinlik, talep);
        etkinlik.setDurum(Etkinlik.EtkinlikDurumu.TASLAK);
        etkinlik.setRedNedeni(null);
        Etkinlik kaydedilen = etkinlikDeposu.save(etkinlik);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getId(), "EVENT_UPDATED", kullaniciId, "CLUB_ADMIN",
                kaydedilen.getBaslik() + " etkinlik taslağı güncellendi.");
        return kaydedilen;
    }

    public List<Etkinlik> onayBekleyenleriListele() {
        return etkinlikDeposu.findByDurum(Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR);
    }

    public List<EtkinlikDegisiklikIstegi> degisiklikTalepleriniListele() {
        return etkinlikDegisiklikIstegiDeposu.findByDurumInOrderByOlusturulmaTarihiDesc(List.of(
                EtkinlikDegisiklikIstegi.DegisiklikDurumu.SKS_ONAYI_BEKLIYOR,
                EtkinlikDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI
        ));
    }

    public Etkinlik degisiklikTalebiniOnayla(String adminId, String degisiklikIstegiId) {
        EtkinlikDegisiklikIstegi degisiklikIstegi = etkinlikDegisiklikIstegiDeposu.findById(degisiklikIstegiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Değişiklik talebi bulunamadı"));

        if (degisiklikIstegi.getDurum() != EtkinlikDegisiklikIstegi.DegisiklikDurumu.SKS_ONAYI_BEKLIYOR) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Değişiklik talebi onay bekleyen durumda değil");
        }

        Etkinlik etkinlik = degisiklikIstegi.getEtkinlik();
        degisiklikIsteginiUygula(etkinlik, degisiklikIstegi);
        etkinlik.setOnaylayan(adminId);
        etkinlik.setOnayTarihi(LocalDateTime.now());
        etkinlik.setYayinTarihi(etkinlik.getYayinTarihi() == null ? LocalDateTime.now() : etkinlik.getYayinTarihi());
        etkinlikDeposu.save(etkinlik);

        degisiklikIstegi.setDurum(EtkinlikDegisiklikIstegi.DegisiklikDurumu.ONAYLANDI);
        degisiklikIstegi.setInceleyen(adminId);
        degisiklikIstegi.setIncelemeTarihi(LocalDateTime.now());
        etkinlikDegisiklikIstegiDeposu.save(degisiklikIstegi);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, etkinlik.getId(), "EVENT_CHANGE_APPROVED", adminId, "SKS",
                etkinlik.getBaslik() + " etkinliği değişiklik talebi onaylandı.");

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                etkinlik.getKulup().getYoneticiKullaniciId(),
                "Etkinlik değişikliği onaylandı",
                etkinlik.getBaslik() + " etkinliği için gönderilen değişiklik talebi SKS tarafından onaylandı.",
                etkinlik.getId(),
                Bildirim.BildirimTuru.ETKINLIK_ONAY_TALEBI
        );

        return etkinlik;
    }

    public EtkinlikDegisiklikIstegi degisiklikTalebiIcinRevizyonIste(String adminId, String degisiklikIstegiId, EtkinlikGeriBildirimTalebi talep) {
        EtkinlikDegisiklikIstegi degisiklikIstegi = etkinlikDegisiklikIstegiDeposu.findById(degisiklikIstegiId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Değişiklik talebi bulunamadı"));

        if (talep.getGeriBildirim() == null || talep.getGeriBildirim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geri bildirim gereklidir");
        }

        degisiklikIstegi.setDurum(EtkinlikDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI);
        degisiklikIstegi.setGeriBildirim(talep.getGeriBildirim().trim());
        degisiklikIstegi.setInceleyen(adminId);
        degisiklikIstegi.setIncelemeTarihi(LocalDateTime.now());
        EtkinlikDegisiklikIstegi kaydedilen = etkinlikDegisiklikIstegiDeposu.save(degisiklikIstegi);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.ETKINLIK, kaydedilen.getEtkinlik().getId(), "EVENT_CHANGE_REVISION_REQUESTED", adminId, "SKS",
                kaydedilen.getEtkinlik().getBaslik() + " etkinliği değişiklik talebi için revizyon istendi: " + kaydedilen.getGeriBildirim());

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                kaydedilen.getEtkinlik().getKulup().getYoneticiKullaniciId(),
                "Etkinlik değişikliği düzenleme talebi",
                kaydedilen.getEtkinlik().getBaslik() + " etkinliği değişikliği için SKS düzenleme istedi: " + kaydedilen.getGeriBildirim(),
                kaydedilen.getEtkinlik().getId(),
                Bildirim.BildirimTuru.ETKINLIK_REVIZYON_TALEBI
        );

        return kaydedilen;
    }

    public List<Etkinlik> yayinlananEtkinlikleriListele() {
        return etkinlikDeposu.findByDurum(Etkinlik.EtkinlikDurumu.YAYINLANDI);
    }

    public List<Etkinlik> kulupEtkinlikleriniListele(String kulupId) {
        Kulup kulup = kulupDeposu.findById(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kulüp aktif değil");
        }
        return etkinlikDeposu.findByKulup_IdAndDurumIn(kulupId, List.of(
                Etkinlik.EtkinlikDurumu.YAYINLANDI,
                Etkinlik.EtkinlikDurumu.TAMAMLANDI,
                Etkinlik.EtkinlikDurumu.IPTAL_EDILDI
        ));
    }

    public List<Etkinlik> yonetilenEtkinlikleriListele(String yoneticiKullaniciId) {
        return etkinlikDeposu.findByKulup_YoneticiKullaniciId(yoneticiKullaniciId);
    }

    private void kulupUyelerineYeniEtkinligiDuyur(Etkinlik etkinlik) {
        String kulupId = etkinlik.getKulup().getId();
        String kulupAdi = etkinlik.getKulup().getAd();
        String baslangic = etkinlik.getBaslangicTarihi() != null
                ? etkinlik.getBaslangicTarihi().format(BILDIRIM_TARIH_FORMATI)
                : "Tarih belirtilmedi";
        String konum = yoklamaEtkinlikKonumunuCoz(etkinlik);

        kulupUyesiDeposu.findByKulupIdAndDurumIn(kulupId, AKTIF_BENZERI_UYE_DURUMLARI)
                .stream()
                .map(KulupUyesi::getKullaniciId)
                .filter(userId -> userId != null && !userId.isBlank())
                .distinct()
                .forEach(userId -> bildirimServisi.kullaniciDuyurusuBilgilendir(
                        userId,
                        "Kulübünün yeni etkinliği yayınlandı",
                        kulupAdi + " kulübü yeni bir etkinlik düzenliyor: " + etkinlik.getBaslik()
                                + "\n\nBaşlangıç: " + baslangic
                                + "\nKonum: " + konum,
                        "/kulupler/" + kulupId,
                        "Etkinliği görüntüle",
                        etkinlik.getAfisResmiUrl(),
                        etkinlik.getKulup().getYoneticiKullaniciId(),
                        kulupAdi
                ));
    }

    private String yoklamaEtkinlikKonumunuCoz(Etkinlik etkinlik) {
        if (etkinlik.getEtkinlikTuru() == Etkinlik.EtkinlikTuru.CEVRIMICI) {
            return bosuNullYap(etkinlik.getCevrimiciPlatform()) != null ? etkinlik.getCevrimiciPlatform().trim() : "Online";
        }
        if (bosuNullYap(etkinlik.getKonumAdi()) != null) {
            return etkinlik.getKonumAdi().trim();
        }
        if (bosuNullYap(etkinlik.getKonum()) != null) {
            return etkinlik.getKonum().trim();
        }
        return "Konum belirtilmedi";
    }

    private EtkinlikDegisiklikIstegi degisiklikIstegiOlustur(Etkinlik etkinlik, String kullaniciId, EtkinlikGuncellemeTalebi talep) {
        return EtkinlikDegisiklikIstegi.builder()
                .etkinlik(etkinlik)
                .talepEden(kullaniciId)
                .baslik(talep.getBaslik())
                .aciklama(talep.getAciklama())
                .baslangicTarihi(talep.getBaslangicTarihi())
                .bitisTarihi(talep.getBitisTarihi())
                .konum(eskiKonumuCoz(talep))
                .etkinlikTuru(talep.getEtkinlikTuru() != null ? talep.getEtkinlikTuru() : Etkinlik.EtkinlikTuru.YUZ_YUZE)
                .cevrimiciPlatform(bosuNullYap(talep.getCevrimiciPlatform()))
                .cevrimiciToplantiUrl(bosuNullYap(talep.getCevrimiciToplantiUrl()))
                .konumAdi(bosuNullYap(talep.getKonumAdi()))
                .konumDetayi(bosuNullYap(talep.getKonumDetayi()))
                .enlem(talep.getEnlem())
                .boylam(talep.getBoylam())
                .afisResmiUrl(bosuNullYap(talep.getAfisResmiUrl()))
                .kontenjanSiniriVar(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()))
                .kontenjan(talep.getKontenjan())
                .kontenjanSinirli(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()))
                .yedekListesiSiniriVar(false)
                .yedekListesiKontenjani(0)
                .qrGirisEtkin(talep.isQrGirisEtkin())
                .sertifikaEtkin(talep.isSertifikaEtkin())
                .sertifikaBasligi(talep.getSertifikaBasligi())
                .ucretli(talep.isUcretli())
                .ucretTutari(talep.getUcretTutari())
                .iban(bosuNullYap(talep.getIban()))
                .odemeTalimatlari(bosuNullYap(talep.getOdemeTalimatlari()))
                .hatirlaticiEtkin(talep.isHatirlaticiEtkin())
                .hatirlatmaZamanlariDakika(hatirlatmaDakikalariniNormalizeEt(talep.getHatirlatmaZamanlariDakika()))
                .durum(EtkinlikDegisiklikIstegi.DegisiklikDurumu.SKS_ONAYI_BEKLIYOR)
                .build();
    }

    private void guncellemeyiUygula(Etkinlik etkinlik, EtkinlikGuncellemeTalebi talep) {
        etkinlik.setBaslik(talep.getBaslik());
        etkinlik.setAciklama(talep.getAciklama());
        etkinlik.setBaslangicTarihi(talep.getBaslangicTarihi());
        etkinlik.setBitisTarihi(talep.getBitisTarihi());
        etkinlik.setKonum(eskiKonumuCoz(talep));
        etkinlik.setEtkinlikTuru(talep.getEtkinlikTuru() != null ? talep.getEtkinlikTuru() : Etkinlik.EtkinlikTuru.YUZ_YUZE);
        etkinlik.setCevrimiciPlatform(bosuNullYap(talep.getCevrimiciPlatform()));
        etkinlik.setCevrimiciToplantiUrl(bosuNullYap(talep.getCevrimiciToplantiUrl()));
        etkinlik.setKonumAdi(bosuNullYap(talep.getKonumAdi()));
        etkinlik.setKonumDetayi(bosuNullYap(talep.getKonumDetayi()));
        etkinlik.setEnlem(talep.getEnlem());
        etkinlik.setBoylam(talep.getBoylam());
        etkinlik.setAfisResmiUrl(bosuNullYap(talep.getAfisResmiUrl()));
        etkinlik.setKontenjanSiniriVar(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()));
        etkinlik.setKontenjanSinirli(kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()));
        etkinlik.setKontenjan(talep.getKontenjan());
        etkinlik.setYedekListesiSiniriVar(false);
        etkinlik.setYedekListesiKontenjani(0);
        etkinlik.setQrGirisEtkin(talep.isQrGirisEtkin());
        etkinlik.setSertifikaEtkin(talep.isSertifikaEtkin());
        etkinlik.setSertifikaBasligi(talep.getSertifikaBasligi());
        etkinlik.setUcretli(talep.isUcretli());
        etkinlik.setUcretTutari(talep.getUcretTutari());
        etkinlik.setIban(bosuNullYap(talep.getIban()));
        etkinlik.setOdemeTalimatlari(bosuNullYap(talep.getOdemeTalimatlari()));
        etkinlik.setHatirlaticiEtkin(talep.isHatirlaticiEtkin());
        etkinlik.setHatirlatmaZamanlariDakika(hatirlatmaDakikalariniNormalizeEt(talep.getHatirlatmaZamanlariDakika()));
        etkinlik.setGonderilenHatirlatmaZamanlariDakika("");
    }

    private void degisiklikIsteginiUygula(Etkinlik etkinlik, EtkinlikDegisiklikIstegi degisiklikIstegi) {
        etkinlik.setBaslik(degisiklikIstegi.getBaslik());
        etkinlik.setAciklama(degisiklikIstegi.getAciklama());
        etkinlik.setBaslangicTarihi(degisiklikIstegi.getBaslangicTarihi());
        etkinlik.setBitisTarihi(degisiklikIstegi.getBitisTarihi());
        etkinlik.setKonum(degisiklikIstegi.getKonum());
        etkinlik.setEtkinlikTuru(degisiklikIstegi.getEtkinlikTuru());
        etkinlik.setCevrimiciPlatform(degisiklikIstegi.getCevrimiciPlatform());
        etkinlik.setCevrimiciToplantiUrl(degisiklikIstegi.getCevrimiciToplantiUrl());
        etkinlik.setKonumAdi(degisiklikIstegi.getKonumAdi());
        etkinlik.setKonumDetayi(degisiklikIstegi.getKonumDetayi());
        etkinlik.setEnlem(degisiklikIstegi.getEnlem());
        etkinlik.setBoylam(degisiklikIstegi.getBoylam());
        etkinlik.setAfisResmiUrl(degisiklikIstegi.getAfisResmiUrl());
        etkinlik.setKontenjanSiniriVar(degisiklikIstegi.isKontenjanSiniriVar());
        etkinlik.setKontenjanSinirli(degisiklikIstegi.isKontenjanSinirli());
        etkinlik.setKontenjan(degisiklikIstegi.getKontenjan());
        etkinlik.setYedekListesiSiniriVar(false);
        etkinlik.setYedekListesiKontenjani(0);
        etkinlik.setQrGirisEtkin(degisiklikIstegi.isQrGirisEtkin());
        etkinlik.setSertifikaEtkin(degisiklikIstegi.isSertifikaEtkin());
        etkinlik.setSertifikaBasligi(degisiklikIstegi.getSertifikaBasligi());
        etkinlik.setUcretli(degisiklikIstegi.isUcretli());
        etkinlik.setUcretTutari(degisiklikIstegi.getUcretTutari());
        etkinlik.setIban(degisiklikIstegi.getIban());
        etkinlik.setOdemeTalimatlari(degisiklikIstegi.getOdemeTalimatlari());
        etkinlik.setHatirlaticiEtkin(degisiklikIstegi.isHatirlaticiEtkin());
        etkinlik.setHatirlatmaZamanlariDakika(degisiklikIstegi.getHatirlatmaZamanlariDakika());
        etkinlik.setGonderilenHatirlatmaZamanlariDakika("");
    }

    private boolean kontenjanSinirliMi(boolean kontenjanSinirli, boolean kontenjanSiniriVar) {
        return kontenjanSinirli || kontenjanSiniriVar;
    }

    private void etkinlikTalebiniDogrula(EtkinlikOlusturmaTalebi talep) {
        temelEtkinlikAlanlariniDogrula(
                talep.getBaslik(),
                talep.getBaslangicTarihi(),
                talep.getBitisTarihi(),
                talep.getEtkinlikTuru(),
                talep.getCevrimiciToplantiUrl(),
                talep.getKonumAdi(),
                talep.getEnlem(),
                talep.getBoylam(),
                kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()),
                talep.getKontenjan(),
                talep.isUcretli(),
                talep.getIban(),
                talep.getAfisResmiUrl()
        );
    }

    private void etkinlikTalebiniDogrula(EtkinlikGuncellemeTalebi talep) {
        temelEtkinlikAlanlariniDogrula(
                talep.getBaslik(),
                talep.getBaslangicTarihi(),
                talep.getBitisTarihi(),
                talep.getEtkinlikTuru(),
                talep.getCevrimiciToplantiUrl(),
                talep.getKonumAdi(),
                talep.getEnlem(),
                talep.getBoylam(),
                kontenjanSinirliMi(talep.isKontenjanSinirli(), talep.isKontenjanSiniriVar()),
                talep.getKontenjan(),
                talep.isUcretli(),
                talep.getIban(),
                talep.getAfisResmiUrl()
        );
    }

    private void temelEtkinlikAlanlariniDogrula(String baslik,
                                                LocalDateTime baslangicTarihi,
                                                LocalDateTime bitisTarihi,
                                                Etkinlik.EtkinlikTuru etkinlikTuru,
                                                String cevrimiciToplantiUrl,
                                                String konumAdi,
                                                Double enlem,
                                                Double boylam,
                                                boolean kontenjanSinirli,
                                                int kontenjan,
                                                boolean ucretli,
                                                String iban,
                                                String afisResmiUrl) {
        if (baslik == null || baslik.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik başlığı zorunludur");
        }
        if (baslangicTarihi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik başlangıç zamanı zorunludur");
        }
        if (bitisTarihi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik bitiş zamanı zorunludur");
        }
        LocalDateTime mevcutDakika = LocalDateTime.now().withSecond(0).withNano(0);
        if (baslangicTarihi.isBefore(mevcutDakika)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik başlangıç zamanı geçmiş bir tarih olamaz");
        }
        if (!bitisTarihi.isAfter(baslangicTarihi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik bitiş zamanı başlangıç zamanından sonra olmalıdır");
        }
        Etkinlik.EtkinlikTuru belirlenenTur = etkinlikTuru != null ? etkinlikTuru : Etkinlik.EtkinlikTuru.YUZ_YUZE;
        if (belirlenenTur == Etkinlik.EtkinlikTuru.CEVRIMICI && (cevrimiciToplantiUrl == null || cevrimiciToplantiUrl.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Çevrimiçi etkinlikler için toplantı bağlantısı zorunludur");
        }
        if (belirlenenTur == Etkinlik.EtkinlikTuru.CEVRIMICI && !httpUrlMi(cevrimiciToplantiUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Toplantı bağlantısı http:// veya https:// ile başlamalıdır");
        }
        if (belirlenenTur == Etkinlik.EtkinlikTuru.YUZ_YUZE
                && (konumAdi == null || konumAdi.isBlank() || enlem == null || boylam == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yüz yüze etkinlikler için konum adı ve harita koordinatları zorunludur");
        }
        if (kontenjanSinirli && kontenjan <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sınırlı kontenjan sıfırdan büyük olmalıdır");
        }
        if (ucretli && (iban == null || iban.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ücretli etkinlikler için IBAN zorunludur");
        }
        afisResminiDogrula(afisResmiUrl);
    }

    private String eskiKonumuCoz(EtkinlikOlusturmaTalebi talep) {
        String konumAdi = bosuNullYap(talep.getKonumAdi());
        return konumAdi != null ? konumAdi : bosuNullYap(talep.getKonum());
    }

    private String eskiKonumuCoz(EtkinlikGuncellemeTalebi talep) {
        String konumAdi = bosuNullYap(talep.getKonumAdi());
        return konumAdi != null ? konumAdi : bosuNullYap(talep.getKonum());
    }

    private String bosuNullYap(String deger) {
        return deger == null || deger.isBlank() ? null : deger.trim();
    }

    private boolean httpUrlMi(String deger) {
        try {
            URI uri = new URI(deger.trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (URISyntaxException | NullPointerException ex) {
            return false;
        }
    }

    private void afisResminiDogrula(String afisResmiUrl) {
        String deger = bosuNullYap(afisResmiUrl);
        if (deger == null) {
            return;
        }
        if (deger.startsWith("data:image/png") || deger.startsWith("data:image/jpeg")) {
            return;
        }
        if (deger.startsWith("data:")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etkinlik afişi PNG veya JPG formatında olmalıdır");
        }
    }

    private String hatirlatmaDakikalariniNormalizeEt(List<Integer> dakikalar) {
        if (dakikalar == null) {
            return "";
        }
        return dakikalar.stream()
                .filter(deger -> deger != null && deger > 0)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .limit(8)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private boolean gecmisEtkinlikMi(Etkinlik etkinlik) {
        LocalDateTime sınır = etkinlik.getBitisTarihi() != null ? etkinlik.getBitisTarihi() : etkinlik.getBaslangicTarihi();
        return sınır != null && sınır.isBefore(LocalDateTime.now());
    }
}
