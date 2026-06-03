package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.KulupBaskaniAtamaTalebi;
import com.isik.kampusos.etkinlik.dto.KulupDuyuruTalebi;
import com.isik.kampusos.etkinlik.dto.KulupProfilDegisiklikIstegiYaniti;
import com.isik.kampusos.etkinlik.dto.KulupYaniti;
import com.isik.kampusos.etkinlik.dto.KulupDurumTalebi;
import com.isik.kampusos.etkinlik.dto.KulupOlusturmaTalebi;
import com.isik.kampusos.etkinlik.dto.EtkinlikGeriBildirimTalebi;
import com.isik.kampusos.etkinlik.dto.KulupProfilGuncellemeTalebi;
import com.isik.kampusos.etkinlik.dto.KulupUyeYaniti;
import com.isik.kampusos.etkinlik.dto.KulupDuyuruYaniti;
import com.isik.kampusos.etkinlik.dto.KulupUyeRolGuncellemeTalebi;
import com.isik.kampusos.etkinlik.dto.KulupUyeDurumGuncellemeTalebi;
import com.isik.kampusos.etkinlik.model.AkademikKadro;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.model.KulupProfilDegisiklikIstegi;
import com.isik.kampusos.etkinlik.model.Bildirim;
import com.isik.kampusos.etkinlik.model.KulupDuyurusu;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupProfilDegisiklikIstegiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDuyurusuDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KulupServisi {
    private static final int KISA_ACIKLAMA_MIN_UZUNLUK = 20;
    private static final int KISA_ACIKLAMA_MAX_UZUNLUK = 180;
    private static final int VIZYON_MIN_UZUNLUK = 80;
    private static final int VIZYON_MAX_UZUNLUK = 3000;
    private static final List<KulupUyesi.UyeDurumu> AKTIF_BENZERI_UYE_DURUMLARI = List.of(
            KulupUyesi.UyeDurumu.AKTIF,
            KulupUyesi.UyeDurumu.BEKLEMEDE);

    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final KulupProfilDegisiklikIstegiDeposu kulupProfilDegisiklikIstegiDeposu;
    private final EtkinlikDeposu etkinlikDeposu;
    private final KulupDuyurusuDeposu kulupDuyurusuDeposu;
    private final BildirimServisi bildirimServisi;
    private final AkademikKadroServisi akademikKadroServisi;
    private final DenetimGunluguServisi denetimGunluguServisi;

    public List<KulupYaniti> aktifKulupleriListele(String kullaniciId) {
        return kulupDeposu.findByAktifTrueAndSilindiFalseOrderByAdAsc().stream()
                .map(kulup -> yanitaDonustur(kulup, kullaniciId))
                .toList();
    }

    public List<KulupYaniti> tumKulupleriListele(String kullaniciId) {
        return kulupDeposu.findAllBySilindiFalseOrderByAdAsc().stream()
                .map(kulup -> yanitaDonustur(kulup, kullaniciId))
                .toList();
    }

    public List<KulupYaniti> yonetilenKulupleriListele(String kullaniciId) {
        return kulupDeposu.findByYoneticiKullaniciIdAndSilindiFalse(kullaniciId).stream()
                .map(kulup -> yanitaDonustur(kulup, kullaniciId))
                .toList();
    }

    public KulupYaniti kulupGetir(String kullaniciId, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif() && !kulupYoneticisiMi(kulup, kullaniciId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kulüp aktif değil");
        }
        return yanitaDonustur(kulup, kullaniciId);
    }

    public KulupYaniti yoneticiVeyaBaskanIcinKulupGetir(String kullaniciId, String yetkiler, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif() && !kulupYoneticisiMi(kulup, kullaniciId) && !sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kulüp aktif değil");
        }
        return yanitaDonustur(kulup, kullaniciId);
    }

    @Transactional
    public KulupYaniti kulupOlustur(KulupOlusturmaTalebi talep) {
        DanismanBilgisi danisman = danismanCoz(
                talep.getDanismanAkademikKadroId(),
                talep.getDanismanUnvani(),
                talep.getDanismanAdSoyad(),
                talep.getDanismanEposta(),
                talep.getDanismanBolumu());

        profilAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                vizyonCoz(talep.getVizyon(), talep.getAciklama()),
                danisman.adSoyad(),
                danisman.eposta(),
                danisman.bolum());
        if (talep.getYoneticiKullaniciId() == null || talep.getYoneticiKullaniciId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp başkanı öğrenci numarası zorunludur");
        }
        if (talep.getBaskanAdSoyad() == null || talep.getBaskanAdSoyad().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp başkanı adı soyadı zorunludur");
        }
        if (talep.getBaskanEposta() == null || talep.getBaskanEposta().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp başkanı e-postası zorunludur");
        }
        if (kulupDeposu.existsByAdIgnoreCaseAndSilindiFalse(talep.getAd())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu isimde bir kulüp zaten mevcut");
        }
        baskanKullanilabilirMiDogrula(talep.getYoneticiKullaniciId(), null);
        danismanKullanilabilirMiDogrula(danisman.akademikStaffId(), null);

        String vizyon = vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim();

        Kulup kulup = kulupDeposu.save(Kulup.builder()
                .ad(talep.getAd().trim())
                .kisaAciklama(talep.getKisaAciklama().trim())
                .aciklama(vizyon)
                .yoneticiKullaniciId(talep.getYoneticiKullaniciId().trim())
                .baskanTamAdi(talep.getBaskanAdSoyad().trim())
                .baskanEpostasi(talep.getBaskanEposta().trim())
                .logoUrl(talep.getLogoUrl() != null ? talep.getLogoUrl().trim() : null)
                .danismanAkademikPersonelId(danisman.akademikStaffId())
                .danismanUnvani(danisman.title())
                .danismanTamAdi(danisman.adSoyad())
                .danismanEpostasi(danisman.eposta())
                .danismanBolumu(danisman.bolum())
                .aktif(true)
                .onayGerektirir(false)
                .silindi(false)
                .build());

        KulupUyesi yoneticiUyeligi = KulupUyesi.builder()
                .kulupId(kulup.getId())
                .kullaniciId(kulup.getYoneticiKullaniciId())
                .rol(KulupUyesi.UyeRolu.YONETICI)
                .durum(KulupUyesi.UyeDurumu.AKTIF)
                .build();
        kulupUyesiDeposu.save(yoneticiUyeligi);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulup.getId(), "CLUB_CREATED", kulup.getYoneticiKullaniciId(), "SKS",
                kulup.getAd() + " kulübü oluşturuldu.");

        return yanitaDonustur(kulup, kulup.getYoneticiKullaniciId());
    }

    @Transactional
    public KulupYaniti kulupProfiliniGuncelle(String kulupId, KulupProfilGuncellemeTalebi talep, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        DanismanBilgisi danisman = danismanCoz(
                talep.getDanismanAkademikKadroId(),
                talep.getDanismanUnvani(),
                talep.getDanismanAdSoyad(),
                talep.getDanismanEposta(),
                talep.getDanismanBolumu());

        profilAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                vizyonCoz(talep.getVizyon(), talep.getAciklama()),
                danisman.adSoyad(),
                danisman.eposta(),
                danisman.bolum());
        if (kulupDeposu.existsByAdIgnoreCaseAndSilindiFalseAndIdNot(talep.getAd(), kulupId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu isimde bir kulüp zaten mevcut");
        }
        danismanKullanilabilirMiDogrula(danisman.akademikStaffId(), kulupId);
        if (talep.getYoneticiKullaniciId() != null && !talep.getYoneticiKullaniciId().isBlank()) {
            baskanAlanlariniDogrula(talep.getYoneticiKullaniciId(), talep.getBaskanAdSoyad(),
                    talep.getBaskanEposta());
            baskanKullanilabilirMiDogrula(talep.getYoneticiKullaniciId(), kulupId);
        }

        String vizyon = vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim();

        kulup.setAd(talep.getAd().trim());
        kulup.setKisaAciklama(talep.getKisaAciklama().trim());
        kulup.setAciklama(vizyon);
        kulup.setLogoUrl(talep.getLogoUrl() != null ? talep.getLogoUrl().trim() : null);
        kulup.setOnayGerektirir(false);
        kulup.setDanismanAkademikPersonelId(danisman.akademikStaffId());
        kulup.setDanismanUnvani(danisman.title());
        kulup.setDanismanTamAdi(danisman.adSoyad());
        kulup.setDanismanEpostasi(danisman.eposta());
        kulup.setDanismanBolumu(danisman.bolum());
        if (talep.getYoneticiKullaniciId() != null && !talep.getYoneticiKullaniciId().isBlank()) {
            yoneticiyiGuncelle(kulup, talep.getYoneticiKullaniciId(), talep.getBaskanAdSoyad(),
                    talep.getBaskanEposta());
        }

        return yanitaDonustur(kulupDeposu.save(kulup), mevcutKullaniciId);
    }

    @Transactional
    public KulupYaniti kulupDurumunuDegistir(String kulupId, KulupDurumTalebi talep, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        kulup.setAktif(talep.isAktif());
        Kulup kaydedilen = kulupDeposu.save(kulup);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId,
                talep.isAktif() ? "CLUB_ACTIVATED" : "CLUB_DEACTIVATED",
                mevcutKullaniciId, "SKS",
                kaydedilen.getAd() + " kulübü " + (talep.isAktif() ? "aktif" : "pasif") + " duruma alındı.");
        return yanitaDonustur(kaydedilen, mevcutKullaniciId);
    }

    @Transactional
    public KulupYaniti baskanAta(String kulupId, KulupBaskaniAtamaTalebi talep, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        baskanAlanlariniDogrula(talep.getOgrenciId(), talep.getAdSoyad(), talep.getEposta());
        String yeniBaskanId = talep.getOgrenciId().trim();
        baskanKullanilabilirMiDogrula(yeniBaskanId, kulupId);
        yoneticiyiGuncelle(kulup, yeniBaskanId, talep.getAdSoyad(), talep.getEposta());

        Kulup kaydedilen = kulupDeposu.save(kulup);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "PRESIDENT_ASSIGNED", mevcutKullaniciId, "SKS",
                kaydedilen.getAd() + " kulübü başkanı güncellendi.");
        return yanitaDonustur(kaydedilen, mevcutKullaniciId);
    }

    @Transactional
    public KulupUyesi kulupeKatil(String kullaniciId, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Aktif olmayan kulüplere yeni üye kabul edilemez");
        }

        KulupUyesi mevcutUyelik = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, kullaniciId).orElse(null);
        if (mevcutUyelik != null) {
            if (mevcutUyelik.getDurum() != KulupUyesi.UyeDurumu.AKTIF
                    && mevcutUyelik.getRol() != KulupUyesi.UyeRolu.YONETICI) {
                mevcutUyelik.setDurum(KulupUyesi.UyeDurumu.AKTIF);
                return kulupUyesiDeposu.save(mevcutUyelik);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kullanıcı zaten bu kulübün üyesi");
        }

        KulupUyesi uyelik = KulupUyesi.builder()
                .kulupId(kulupId)
                .kullaniciId(kullaniciId)
                .rol(KulupUyesi.UyeRolu.UYE)
                .durum(KulupUyesi.UyeDurumu.AKTIF)
                .build();

        return kulupUyesiDeposu.save(uyelik);
    }

    @Transactional
    public void kuluptenAyril(String kullaniciId, String kulupId) {
        KulupUyesi uyelik = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp üyeliği bulunamadı"));

        if (uyelik.getRol() == KulupUyesi.UyeRolu.YONETICI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kulüp başkanı başka bir başkan atamadan kulüpten ayrılamaz");
        }

        kulupUyesiDeposu.delete(uyelik);
    }

    @Transactional
    public KulupProfilDegisiklikIstegiYaniti profilGuncellemeTalepEt(String kullaniciId, String kulupId,
            KulupProfilGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        if (!kullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece kulüp başkanı profil güncelleme talebinde bulunabilir");
        }

        kulupProfilIcerikAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                vizyonCoz(talep.getVizyon(), talep.getAciklama()));

        kulupProfilDegisiklikIstegiDeposu.findFirstByKulup_IdAndDurumOrderByOlusturulmaTarihiDesc(
                kulupId,
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE).ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Bu kulüp için zaten onay bekleyen bir profil güncelleme talebi var");
                });

        KulupProfilDegisiklikIstegi degisiklikIstegi = kulupProfilDegisiklikIstegiDeposu.save(
                KulupProfilDegisiklikIstegi.builder()
                        .kulup(kulup)
                        .talepEden(kullaniciId)
                        .ad(talep.getAd().trim())
                        .kisaAciklama(talep.getKisaAciklama().trim())
                        .vizyon(vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim())
                        .logoUrl(talep.getLogoUrl() != null ? talep.getLogoUrl().trim() : null)
                        .durum(KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE)
                        .build());
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "PROFILE_UPDATE_REQUESTED", kullaniciId, "CLUB_ADMIN",
                kulup.getAd() + " kulübü için profil güncelleme talebi oluşturuldu.");

        String bildirimMesaji = String.format("""
                %s kulübü için profil güncelleme talebi oluşturuldu.
 
                Yeni ad: %s
                Kısa açıklama: %s
                Vizyon: %s
                Logo: %s
                """,
                kulup.getAd(),
                talep.getAd(),
                talep.getKisaAciklama(),
                vizyonCoz(talep.getVizyon(), talep.getAciklama()),
                talep.getLogoUrl() == null || talep.getLogoUrl().isBlank() ? "Değişiklik yok / boş"
                        : talep.getLogoUrl());

        bildirimServisi.sksProfilOnayTalebiBilgilendir(
                "Kulüp profil güncelleme talebi",
                bildirimMesaji.trim(),
                kullaniciId,
                kulup.getAd());

        return profilDegisiklikIstegiYanitinaDonustur(degisiklikIstegi, kullaniciId);
    }

    public List<KulupProfilDegisiklikIstegiYaniti> profilDegisiklikKuyrugunuGetir(String mevcutKullaniciId) {
        return kulupProfilDegisiklikIstegiDeposu.findByDurumInOrderByOlusturulmaTarihiDesc(List.of(
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE,
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI)).stream()
                .map(request -> profilDegisiklikIstegiYanitinaDonustur(request, mevcutKullaniciId))
                .toList();
    }

    @Transactional
    public KulupProfilDegisiklikIstegiYaniti profilDegisikliginiOnayla(String degisiklikIstegiId, String inceleyen) {
        KulupProfilDegisiklikIstegi istek = kulupProfilDegisiklikIstegiDeposu.findById(degisiklikIstegiId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil değişiklik talebi bulunamadı"));
        if (istek.getDurum() != KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profil değişiklik talebi onay bekleyen durumda değil");
        }

        Kulup kulup = istek.getKulup();
        if (kulupDeposu.existsByAdIgnoreCaseAndSilindiFalseAndIdNot(istek.getAd(), kulup.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu isimde bir kulüp zaten mevcut");
        }

        kulup.setAd(istek.getAd().trim());
        kulup.setKisaAciklama(istek.getKisaAciklama().trim());
        kulup.setAciklama(istek.getVizyon().trim());
        kulup.setLogoUrl(istek.getLogoUrl() != null ? istek.getLogoUrl().trim() : null);
        kulupDeposu.save(kulup);

        istek.setDurum(KulupProfilDegisiklikIstegi.DegisiklikDurumu.ONAYLANDI);
        istek.setInceleyen(inceleyen);
        istek.setIncelemeTarihi(java.time.LocalDateTime.now());
        KulupProfilDegisiklikIstegi kaydedilen = kulupProfilDegisiklikIstegiDeposu.save(istek);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulup.getId(), "PROFILE_UPDATE_APPROVED", inceleyen, "SKS",
                kulup.getAd() + " kulübü profil güncellemesi onaylandı.");

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                kulup.getYoneticiKullaniciId(),
                "Kulüp profil talebi onaylandı",
                kulup.getAd() + " kulübü profil güncellemesi SKS tarafından onaylandı.",
                kulup.getId(),
                Bildirim.BildirimTuru.PROFIL_ONAY_TALEBI);

        return profilDegisiklikIstegiYanitinaDonustur(kaydedilen, inceleyen);
    }

    @Transactional
    public KulupProfilDegisiklikIstegiYaniti profilDegisikligiIcinRevizyonIste(
            String degisiklikIstegiId,
            String inceleyen,
            EtkinlikGeriBildirimTalebi geriBildirimTalebi) {
        return profilDegisikliginiIncele(degisiklikIstegiId, inceleyen, geriBildirimTalebi,
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI,
                "Kulüp profil talebi için düzenleme istendi");
    }

    @Transactional
    public KulupProfilDegisiklikIstegiYaniti profilDegisikliginiReddet(
            String degisiklikIstegiId,
            String inceleyen,
            EtkinlikGeriBildirimTalebi geriBildirimTalebi) {
        return profilDegisikliginiIncele(degisiklikIstegiId, inceleyen, geriBildirimTalebi,
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.REDDEDILDI,
                "Kulüp profil talebi reddedildi");
    }

    public void kulupDuyurusuOlustur(String kullaniciId, String kulupId, KulupDuyuruTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        if (!kullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece kulüp başkanı duyuru oluşturabilir");
        }
        if (talep.getBaslik() == null || talep.getBaslik().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru başlığı zorunludur");
        }
        if (talep.getMesaj() == null || talep.getMesaj().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duyuru mesajı zorunludur");
        }
        if (talep.getBaglantiEtiketi() != null && !talep.getBaglantiEtiketi().isBlank()
                && (talep.getBaglantiUrl() == null || talep.getBaglantiUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bağlantı etiketi verildiğinde bağlantı URL'i zorunludur");
        }

        List<KulupUyesi> uyeler = kulupUyesiDeposu.findByKulupId(kulupId);
        if (uyeler.isEmpty()) {
            bildirimServisi.kullaniciDuyurusuBilgilendir(
                    kullaniciId,
                    talep.getBaslik().trim(),
                    talep.getMesaj().trim(),
                    talep.getBaglantiUrl(),
                    talep.getBaglantiEtiketi(),
                    talep.getResimUrl(),
                    kullaniciId,
                    kulup.getAd());
            return;
        }

        uyeler.forEach(uye -> bildirimServisi.kullaniciDuyurusuBilgilendir(
                uye.getKullaniciId(),
                talep.getBaslik().trim(),
                talep.getMesaj().trim(),
                talep.getBaglantiUrl(),
                talep.getBaglantiEtiketi(),
                talep.getResimUrl(),
                kullaniciId,
                kulup.getAd()));
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "ANNOUNCEMENT_SENT", kullaniciId, "CLUB_ADMIN",
                kulup.getAd() + " kulübü duyuru gönderdi: " + talep.getBaslik().trim());
    }

    private KulupYaniti yanitaDonustur(Kulup kulup, String mevcutKullaniciId) {
        KulupUyesi uyelik = mevcutKullaniciId == null ? null
                : kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulup.getId(), mevcutKullaniciId).orElse(null);

        return KulupYaniti.builder()
                .id(kulup.getId())
                .ad(kulup.getAd())
                .kisaAciklama(kulup.getKisaAciklama())
                .vizyon(kulup.getAciklama())
                .aciklama(kulup.getAciklama())
                .yoneticiKullaniciId(kulup.getYoneticiKullaniciId())
                .baskanAdSoyad(kulup.getBaskanTamAdi())
                .baskanEposta(kulup.getBaskanEpostasi())
                .logoUrl(kulup.getLogoUrl())
                .danismanAkademikKadroId(kulup.getDanismanAkademikPersonelId())
                .danismanUnvani(kulup.getDanismanUnvani())
                .danismanAdSoyad(kulup.getDanismanTamAdi())
                .danismanEposta(kulup.getDanismanEpostasi())
                .danismanBolumu(kulup.getDanismanBolumu())
                .aktif(kulup.isAktif())
                .onayGerektirir(false)
                .uyeSayisi(kulupUyesiDeposu.countByKulupIdAndDurumIn(kulup.getId(), AKTIF_BENZERI_UYE_DURUMLARI))
                .etkinlikSayisi(etkinlikDeposu.countByKulup_Id(kulup.getId()))
                .mevcutKullaniciUyeMi(uyelik != null && (uyelik.getDurum() == KulupUyesi.UyeDurumu.AKTIF
                        || uyelik.getDurum() == KulupUyesi.UyeDurumu.BEKLEMEDE))
                .mevcutKullaniciRol(uyelik != null ? uyelik.getRol().name() : null)
                .mevcutKullaniciDurum(uyelik != null && uyelik.getDurum() == KulupUyesi.UyeDurumu.BEKLEMEDE
                        ? KulupUyesi.UyeDurumu.AKTIF.name()
                        : uyelik != null ? uyelik.getDurum().name() : null)
                .build();
    }

    private KulupProfilDegisiklikIstegiYaniti profilProfilDegisiklikIstegiYanitinaDonustur(
            KulupProfilDegisiklikIstegi request,
            String mevcutKullaniciId) {
        // Wait, the method signature previously had profilDegisiklikIstegiYanitinaDonustur. Let's make sure it matches.
        return profilDegisiklikIstegiYanitinaDonustur(request, mevcutKullaniciId);
    }

    private KulupProfilDegisiklikIstegiYaniti profilDegisiklikIstegiYanitinaDonustur(
            KulupProfilDegisiklikIstegi request,
            String mevcutKullaniciId) {
        return KulupProfilDegisiklikIstegiYaniti.builder()
                .id(request.getId())
                .kulup(yanitaDonustur(request.getKulup(), mevcutKullaniciId))
                .talepEden(request.getTalepEden())
                .ad(request.getAd())
                .kisaAciklama(request.getKisaAciklama())
                .vizyon(request.getVizyon())
                .logoUrl(request.getLogoUrl())
                .durum(request.getDurum())
                .geriBildirim(request.getGeriBildirim())
                .inceleyen(request.getInceleyen())
                .incelemeTarihi(request.getIncelemeTarihi())
                .olusturulmaTarihi(request.getOlusturulmaTarihi())
                .guncellenmeTarihi(request.getGuncellenmeTarihi())
                .build();
    }

    private KulupProfilDegisiklikIstegiYaniti profilDegisikliginiIncele(
            String degisiklikIstegiId,
            String inceleyen,
            EtkinlikGeriBildirimTalebi geriBildirimTalebi,
            KulupProfilDegisiklikIstegi.DegisiklikDurumu sonrakiDurum,
            String baslik) {
        KulupProfilDegisiklikIstegi istek = kulupProfilDegisiklikIstegiDeposu.findById(degisiklikIstegiId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil değişiklik talebi bulunamadı"));
        if (istek.getDurum() != KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE
                && istek.getDurum() != KulupProfilDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profil değişiklik talebi bu durumda incelenemez");
        }
        if (geriBildirimTalebi == null || geriBildirimTalebi.getGeriBildirim() == null
                || geriBildirimTalebi.getGeriBildirim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geri bildirim gereklidir");
        }

        istek.setDurum(sonrakiDurum);
        istek.setGeriBildirim(geriBildirimTalebi.getGeriBildirim().trim());
        istek.setInceleyen(inceleyen);
        istek.setIncelemeTarihi(java.time.LocalDateTime.now());
        KulupProfilDegisiklikIstegi kaydedilen = kulupProfilDegisiklikIstegiDeposu.save(istek);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kaydedilen.getKulup().getId(),
                sonrakiDurum == KulupProfilDegisiklikIstegi.DegisiklikDurumu.REDDEDILDI
                        ? "PROFILE_UPDATE_REJECTED"
                        : "PROFILE_UPDATE_REVISION_REQUESTED",
                inceleyen, "SKS",
                kaydedilen.getKulup().getAd() + " kulübü profil talebi için SKS notu: " + kaydedilen.getGeriBildirim());

        bildirimServisi.kullaniciyiTurIleBilgilendir(
                kaydedilen.getKulup().getYoneticiKullaniciId(),
                baslik,
                kaydedilen.getKulup().getAd() + " kulübü profil talebi için SKS notu: " + kaydedilen.getGeriBildirim(),
                kaydedilen.getKulup().getId(),
                Bildirim.BildirimTuru.PROFIL_ONAY_TALEBI);

        return profilDegisiklikIstegiYanitinaDonustur(kaydedilen, inceleyen);
    }


    private boolean kulupYoneticisiMi(Kulup kulup, String kullaniciId) {
        return kulup.getYoneticiKullaniciId() != null && kullaniciId != null
                && kulup.getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim());
    }

    private boolean sistemYoneticisiMi(String yetkiler) {
        return yetkiler != null && (yetkiler.contains("ROLE_SKS_ADMIN") || yetkiler.contains("ROLE_ADMIN"));
    }

    private void profilAlanlariniDogrula(
            String ad,
            String kisaAciklama,
            String vizyon,
            String danismanAdSoyad,
            String danismanEposta,
            String danismanBolumu) {
        kulupProfilIcerikAlanlariniDogrula(ad, kisaAciklama, vizyon);
        danismanAlanlariniDogrula(danismanAdSoyad, danismanEposta, danismanBolumu);
    }

    private void kulupProfilIcerikAlanlariniDogrula(String ad, String kisaAciklama, String vizyon) {
        if (ad == null || ad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp adı zorunludur");
        }
        if (kisaAciklama == null || kisaAciklama.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp kısa açıklaması zorunludur");
        }
        metinUzunlugunuDogrula(
                kisaAciklama.trim(),
                KISA_ACIKLAMA_MIN_UZUNLUK,
                KISA_ACIKLAMA_MAX_UZUNLUK,
                "Kulüp kısa açıklaması");
        if (vizyon == null || vizyon.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp vizyonu zorunludur");
        }
        metinUzunlugunuDogrula(
                vizyon.trim(),
                VIZYON_MIN_UZUNLUK,
                VIZYON_MAX_UZUNLUK,
                "Kulüp vizyonu");
    }

    private void danismanAlanlariniDogrula(String danismanAdSoyad, String danismanEposta, String danismanBolumu) {
        if (danismanAdSoyad == null || danismanAdSoyad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman adı soyadı zorunludur");
        }
        if (danismanEposta == null || danismanEposta.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman e-postası zorunludur");
        }
        if (!danismanEposta.trim().toLowerCase().endsWith("@isikun.edu.tr")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman e-postası @isikun.edu.tr ile bitmelidir");
        }
        if (danismanBolumu == null || danismanBolumu.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danışman bölümü zorunludur");
        }
    }

    private void metinUzunlugunuDogrula(String deger, int minUzunluk, int maxUzunluk, String alanAdi) {
        if (deger.length() < minUzunluk || deger.length() > maxUzunluk) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    alanAdi + " en az " + minUzunluk + " ve en fazla " + maxUzunluk + " karakter olmalıdır");
        }
    }

    private String vizyonCoz(String vizyon, String aciklama) {
        if (vizyon != null && !vizyon.isBlank()) {
            return vizyon;
        }
        return aciklama;
    }

    private DanismanBilgisi danismanCoz(
            String akademikKadroId,
            String danismanUnvani,
            String danismanAdSoyad,
            String danismanEposta,
            String danismanBolumu) {
        if (akademikKadroId != null && !akademikKadroId.isBlank()) {
            AkademikKadro kadro = akademikKadroServisi.idIleAktifBul(akademikKadroId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Seçilen akademik danışman bulunamadı"));
            return new DanismanBilgisi(
                    kadro.getId(),
                    bosuTemizle(kadro.getAkademikUnvan()),
                    bosuTemizle(kadro.getTamAd()),
                    bosuTemizle(kadro.getEposta()),
                    bosuTemizle(kadro.getBolum()));
        }

        return new DanismanBilgisi(
                null,
                bosuTemizle(danismanUnvani),
                bosuTemizle(danismanAdSoyad),
                bosuTemizle(danismanEposta),
                bosuTemizle(danismanBolumu));
    }

    private void baskanKullanilabilirMiDogrula(String ogrenciId, String mevcutKulupId) {
        if (ogrenciId == null || ogrenciId.isBlank()) {
            return;
        }

        boolean zatenBaskan = mevcutKulupId == null
                ? kulupDeposu.existsByYoneticiKullaniciIdAndSilindiFalse(ogrenciId.trim())
                : kulupDeposu.existsByYoneticiKullaniciIdAndSilindiFalseAndIdNot(ogrenciId.trim(), mevcutKulupId);
        if (zatenBaskan) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu öğrenci zaten başka bir kulübün başkanı");
        }
    }

    private void baskanAlanlariniDogrula(String ogrenciId, String adSoyad, String eposta) {
        if (ogrenciId == null || ogrenciId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Öğrenci numarası zorunludur");
        }
        if (adSoyad == null || adSoyad.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başkan adı soyadı zorunludur");
        }
        if (eposta == null || eposta.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başkan e-postası zorunludur");
        }
    }

    private void yoneticiyiGuncelle(Kulup kulup, String ogrenciId, String adSoyad, String eposta) {
        String yeniYoneticiId = ogrenciId.trim();
        String eskiYoneticiId = kulup.getYoneticiKullaniciId();

        if (eskiYoneticiId != null && !eskiYoneticiId.trim().equalsIgnoreCase(yeniYoneticiId.trim())) {
            kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulup.getId(), eskiYoneticiId)
                    .ifPresent(eskiUyelik -> {
                        eskiUyelik.setRol(KulupUyesi.UyeRolu.UYE);
                        kulupUyesiDeposu.save(eskiUyelik);
                    });
        }

        KulupUyesi baskanUyeligi = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulup.getId(), yeniYoneticiId)
                .orElse(KulupUyesi.builder()
                        .kulupId(kulup.getId())
                        .kullaniciId(yeniYoneticiId)
                        .build());
        baskanUyeligi.setRol(KulupUyesi.UyeRolu.YONETICI);
        baskanUyeligi.setDurum(KulupUyesi.UyeDurumu.AKTIF);
        kulupUyesiDeposu.save(baskanUyeligi);

        kulup.setYoneticiKullaniciId(yeniYoneticiId);
        kulup.setBaskanTamAdi(adSoyad.trim());
        kulup.setBaskanEpostasi(eposta.trim());
    }

    private void danismanKullanilabilirMiDogrula(String akademikStaffId, String mevcutKulupId) {
        if (akademikStaffId == null || akademikStaffId.isBlank()) {
            return;
        }

        boolean zatenDanisman = mevcutKulupId == null
                ? kulupDeposu.existsByDanismanAkademikPersonelIdAndSilindiFalse(akademikStaffId.trim())
                : kulupDeposu.existsByDanismanAkademikPersonelIdAndSilindiFalseAndIdNot(akademikStaffId.trim(),
                        mevcutKulupId);
        if (zatenDanisman) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu akademik danışman zaten başka bir kulübe atanmış");
        }
    }

    private String bosuTemizle(String deger) {
        return deger == null ? "" : deger.trim();
    }

    private record DanismanBilgisi(
            String akademikStaffId,
            String title,
            String adSoyad,
            String eposta,
            String bolum) {
    }

    public List<KulupDuyuruYaniti> kulupDuyurulariniGetir(String kulupId) {
        return kulupDuyurusuDeposu.findByKulupIdOrderByOlusturulmaTarihiDesc(kulupId)
                .stream()
                .map(a -> KulupDuyuruYaniti.builder()
                        .id(a.getId())
                        .kulupId(a.getKulupId())
                        .kulupAdi("")
                        .baslik(a.getBaslik())
                        .mesaj(a.getMesaj())
                        .baglantiUrl(a.getBaglantiUrl())
                        .baglantiEtiketi(a.getBaglantiEtiketi())
                        .resimUrl(a.getResimUrl())
                        .olusturanKullaniciId(a.getOlusturanKullaniciId())
                        .olusturulmaTarihi(a.getOlusturulmaTarihi())
                        .build())
                .toList();
    }

    public List<KulupUyeYaniti> kulupUyeleriniGetir(String kullaniciId, String yetkiler, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim()) && !sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Sadece kulüp yöneticisi veya SKS yöneticisi üye listesini görüntüleyebilir");
        }
        return kulupUyesiDeposu.findByKulupId(kulupId).stream()
                .map(m -> KulupUyeYaniti.builder()
                        .id(m.getId())
                        .kulupId(m.getKulupId())
                        .kullaniciId(m.getKullaniciId())
                        .adSoyad("") // Frontend enriches this from auth-service
                        .rol(m.getRol().name())
                        .durum(m.getDurum().name())
                        .katilmaTarihi(m.getKatilmaTarihi())
                        .build())
                .toList();
    }

    @Transactional
    public void uyeRolunuGuncelle(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId,
            KulupUyeRolGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üye rollerini değiştirebilir");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        KulupUyesi.UyeRolu talepEdilenRol = uyeRolunuCoz(talep.getRol());
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kulüp başkanı rolü buradan değiştirilemez");
        }
        if (talepEdilenRol == KulupUyesi.UyeRolu.YONETICI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kulüp başkanlığını devretmek için başkan atama akışını kullanın");
        }
        hedefUye.setRol(talepEdilenRol);
        kulupUyesiDeposu.save(hedefUye);
    }

    @Transactional
    public void uyeDurumunuGuncelle(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId,
            KulupUyeDurumGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üye durumlarını değiştirebilir");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        KulupUyesi.UyeDurumu talepEdilenDurum = uyeDurumunuCoz(talep.getDurum());
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kulüp başkanı durumu değiştirilemez");
        }
        hedefUye.setDurum(talepEdilenDurum);
        kulupUyesiDeposu.save(hedefUye);
    }

    private KulupUyesi.UyeRolu uyeRolunuCoz(String rol) {
        if (rol == null || rol.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üye rolü zorunludur");
        }
        try {
            return KulupUyesi.UyeRolu.valueOf(rol.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz üye rolü");
        }
    }

    private KulupUyesi.UyeDurumu uyeDurumunuCoz(String durum) {
        if (durum == null || durum.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üye durumu zorunludur");
        }
        try {
            return KulupUyesi.UyeDurumu.valueOf(durum.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz üye durumu");
        }
    }

    @Transactional
    public void uyeyiCikar(String mevcutKullaniciId, String yetkiler, String kulupId, String hedefKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece SKS yöneticisi üyeleri çıkarabilir");
        }
        if (hedefKullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kulüp başkanı çıkarılamaz");
        }
        KulupUyesi hedefUye = kulupUyesiDeposu.findByKulupIdAndKullaniciId(kulupId, hedefKullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Üye bulunamadı"));
        kulupUyesiDeposu.delete(hedefUye);
    }

    @Transactional
    public void kulupSil(String kulupId, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        kulup.setSilindi(true);
        kulup.setSilinmeTarihi(java.time.LocalDateTime.now());
        kulupDeposu.save(kulup);
    }
}
