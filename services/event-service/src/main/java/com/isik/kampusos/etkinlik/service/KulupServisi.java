package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.KulupBaskaniAtamaTalebi;
import com.isik.kampusos.etkinlik.dto.KulupDuyuruTalebi;
import com.isik.kampusos.etkinlik.dto.KulupYaniti;
import com.isik.kampusos.etkinlik.dto.KulupDurumTalebi;
import com.isik.kampusos.etkinlik.dto.KulupOlusturmaTalebi;
import com.isik.kampusos.etkinlik.dto.KulupProfilGuncellemeTalebi;
import com.isik.kampusos.etkinlik.dto.KulupDuyuruYaniti;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDuyurusuDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Kulüp çekirdek işlemleri: listeleme/getirme, oluşturma, profil güncelleme (SKS doğrudan),
 * durum değiştirme, başkan atama, silme ve duyuru oluşturma/listeleme.
 *
 * <p>Üyelik işlemleri {@link KulupUyelikServisi}, profil değişiklik talep akışı
 * {@link KulupProfilTalepServisi} servislerine ayrılmıştır. Ortak yanıt üretimi
 * {@link KulupYanitFabrikasi}, doğrulama/danışman/başkan yardımcıları
 * {@link KulupDogrulayici} bileşenlerindedir.
 */
@Service
@RequiredArgsConstructor
public class KulupServisi {

    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final KulupDuyurusuDeposu kulupDuyurusuDeposu;
    private final BildirimServisi bildirimServisi;
    private final DenetimGunluguServisi denetimGunluguServisi;
    private final KulupYanitFabrikasi kulupYanitFabrikasi;
    private final KulupDogrulayici kulupDogrulayici;

    public List<KulupYaniti> aktifKulupleriListele(String kullaniciId) {
        return kulupDeposu.findByAktifTrueAndSilindiFalseOrderByAdAsc().stream()
                .map(kulup -> kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kullaniciId))
                .toList();
    }

    public List<KulupYaniti> tumKulupleriListele(String kullaniciId) {
        return kulupDeposu.findAllBySilindiFalseOrderByAdAsc().stream()
                .map(kulup -> kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kullaniciId))
                .toList();
    }

    public List<KulupYaniti> yonetilenKulupleriListele(String kullaniciId) {
        return kulupDeposu.findByYoneticiKullaniciIdAndSilindiFalse(kullaniciId).stream()
                .map(kulup -> kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kullaniciId))
                .toList();
    }

    public KulupYaniti kulupGetir(String kullaniciId, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif() && !kulupYanitFabrikasi.kulupYoneticisiMi(kulup, kullaniciId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kulüp aktif değil");
        }
        return kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kullaniciId);
    }

    public KulupYaniti yoneticiVeyaBaskanIcinKulupGetir(String kullaniciId, String yetkiler, String kulupId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        if (!kulup.isAktif() && !kulupYanitFabrikasi.kulupYoneticisiMi(kulup, kullaniciId)
                && !kulupYanitFabrikasi.sistemYoneticisiMi(yetkiler)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kulüp aktif değil");
        }
        return kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kullaniciId);
    }

    @Transactional
    public KulupYaniti kulupOlustur(KulupOlusturmaTalebi talep) {
        KulupDogrulayici.DanismanBilgisi danisman = kulupDogrulayici.danismanCoz(
                talep.getDanismanAkademikKadroId(),
                talep.getDanismanUnvani(),
                talep.getDanismanAdSoyad(),
                talep.getDanismanEposta(),
                talep.getDanismanBolumu());

        kulupDogrulayici.profilAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()),
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
        kulupDogrulayici.baskanKullanilabilirMiDogrula(talep.getYoneticiKullaniciId(), null);
        kulupDogrulayici.danismanKullanilabilirMiDogrula(danisman.akademikStaffId(), null);

        String vizyon = kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim();

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

        return kulupYanitFabrikasi.kulupYanitiOlustur(kulup, kulup.getYoneticiKullaniciId());
    }

    @Transactional
    public KulupYaniti kulupProfiliniGuncelle(String kulupId, KulupProfilGuncellemeTalebi talep, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        KulupDogrulayici.DanismanBilgisi danisman = kulupDogrulayici.danismanCoz(
                talep.getDanismanAkademikKadroId(),
                talep.getDanismanUnvani(),
                talep.getDanismanAdSoyad(),
                talep.getDanismanEposta(),
                talep.getDanismanBolumu());

        kulupDogrulayici.profilAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()),
                danisman.adSoyad(),
                danisman.eposta(),
                danisman.bolum());
        if (kulupDeposu.existsByAdIgnoreCaseAndSilindiFalseAndIdNot(talep.getAd(), kulupId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu isimde bir kulüp zaten mevcut");
        }
        kulupDogrulayici.danismanKullanilabilirMiDogrula(danisman.akademikStaffId(), kulupId);
        if (talep.getYoneticiKullaniciId() != null && !talep.getYoneticiKullaniciId().isBlank()) {
            kulupDogrulayici.baskanAlanlariniDogrula(talep.getYoneticiKullaniciId(), talep.getBaskanAdSoyad(),
                    talep.getBaskanEposta());
            kulupDogrulayici.baskanKullanilabilirMiDogrula(talep.getYoneticiKullaniciId(), kulupId);
        }

        String vizyon = kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim();

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
            kulupDogrulayici.yoneticiyiGuncelle(kulup, talep.getYoneticiKullaniciId(), talep.getBaskanAdSoyad(),
                    talep.getBaskanEposta());
        }

        return kulupYanitFabrikasi.kulupYanitiOlustur(kulupDeposu.save(kulup), mevcutKullaniciId);
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
        return kulupYanitFabrikasi.kulupYanitiOlustur(kaydedilen, mevcutKullaniciId);
    }

    @Transactional
    public KulupYaniti baskanAta(String kulupId, KulupBaskaniAtamaTalebi talep, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        kulupDogrulayici.baskanAlanlariniDogrula(talep.getOgrenciId(), talep.getAdSoyad(), talep.getEposta());
        String yeniBaskanId = talep.getOgrenciId().trim();
        kulupDogrulayici.baskanKullanilabilirMiDogrula(yeniBaskanId, kulupId);
        kulupDogrulayici.yoneticiyiGuncelle(kulup, yeniBaskanId, talep.getAdSoyad(), talep.getEposta());

        Kulup kaydedilen = kulupDeposu.save(kulup);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "PRESIDENT_ASSIGNED", mevcutKullaniciId, "SKS",
                kaydedilen.getAd() + " kulübü başkanı güncellendi.");
        return kulupYanitFabrikasi.kulupYanitiOlustur(kaydedilen, mevcutKullaniciId);
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

    @Transactional
    public void kulupSil(String kulupId, String mevcutKullaniciId) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));
        kulup.setSilindi(true);
        kulup.setSilinmeTarihi(java.time.LocalDateTime.now());
        kulupDeposu.save(kulup);
    }
}
