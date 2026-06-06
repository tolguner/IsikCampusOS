package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.EtkinlikGeriBildirimTalebi;
import com.isik.kampusos.etkinlik.dto.KulupProfilDegisiklikIstegiYaniti;
import com.isik.kampusos.etkinlik.dto.KulupProfilGuncellemeTalebi;
import com.isik.kampusos.etkinlik.bildirim.BildirimYayinlayici;
import com.isik.kampusos.etkinlik.bildirim.BildirimTuru;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupProfilDegisiklikIstegi;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.KulupProfilDegisiklikIstegiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Kulüp profil güncelleme talep akışı: başkanın talep oluşturması, SKS yöneticisinin
 * kuyruğu görüntülemesi ve talebi onaylama/revizyon isteme/reddetmesi.
 */
@Service
@RequiredArgsConstructor
public class KulupProfilTalepServisi {

    private final KulupDeposu kulupDeposu;
    private final KulupProfilDegisiklikIstegiDeposu kulupProfilDegisiklikIstegiDeposu;
    private final BildirimYayinlayici bildirimYayinlayici;
    private final DenetimGunluguServisi denetimGunluguServisi;
    private final KulupYanitFabrikasi kulupYanitFabrikasi;
    private final KulupDogrulayici kulupDogrulayici;

    @Transactional
    public KulupProfilDegisiklikIstegiYaniti profilGuncellemeTalepEt(String kullaniciId, String kulupId,
            KulupProfilGuncellemeTalebi talep) {
        Kulup kulup = kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulüp bulunamadı"));

        if (!kullaniciId.trim().equalsIgnoreCase(kulup.getYoneticiKullaniciId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sadece kulüp başkanı profil güncelleme talebinde bulunabilir");
        }

        kulupDogrulayici.kulupProfilIcerikAlanlariniDogrula(
                talep.getAd(),
                talep.getKisaAciklama(),
                kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()));

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
                        .vizyon(kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()).trim())
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
                kulupDogrulayici.vizyonCoz(talep.getVizyon(), talep.getAciklama()),
                talep.getLogoUrl() == null || talep.getLogoUrl().isBlank() ? "Değişiklik yok / boş"
                        : talep.getLogoUrl());

        bildirimYayinlayici.sksProfilOnayTalebiBilgilendir(
                "Kulüp profil güncelleme talebi",
                bildirimMesaji.trim(),
                kullaniciId,
                kulup.getAd());

        return kulupYanitFabrikasi.profilTalepYaniti(degisiklikIstegi, kullaniciId);
    }

    public List<KulupProfilDegisiklikIstegiYaniti> profilDegisiklikKuyrugunuGetir(String mevcutKullaniciId) {
        return kulupProfilDegisiklikIstegiDeposu.findByDurumInOrderByOlusturulmaTarihiDesc(List.of(
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE,
                KulupProfilDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI)).stream()
                .map(request -> kulupYanitFabrikasi.profilTalepYaniti(request, mevcutKullaniciId))
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
        istek.setIncelemeTarihi(LocalDateTime.now());
        KulupProfilDegisiklikIstegi kaydedilen = kulupProfilDegisiklikIstegiDeposu.save(istek);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulup.getId(), "PROFILE_UPDATE_APPROVED", inceleyen, "SKS",
                kulup.getAd() + " kulübü profil güncellemesi onaylandı.");

        bildirimYayinlayici.kullaniciyiTurIleBilgilendir(
                kulup.getYoneticiKullaniciId(),
                "Kulüp profil talebi onaylandı",
                kulup.getAd() + " kulübü profil güncellemesi SKS tarafından onaylandı.",
                kulup.getId(),
                BildirimTuru.PROFIL_ONAY_TALEBI);

        return kulupYanitFabrikasi.profilTalepYaniti(kaydedilen, inceleyen);
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
        istek.setIncelemeTarihi(LocalDateTime.now());
        KulupProfilDegisiklikIstegi kaydedilen = kulupProfilDegisiklikIstegiDeposu.save(istek);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kaydedilen.getKulup().getId(),
                sonrakiDurum == KulupProfilDegisiklikIstegi.DegisiklikDurumu.REDDEDILDI
                        ? "PROFILE_UPDATE_REJECTED"
                        : "PROFILE_UPDATE_REVISION_REQUESTED",
                inceleyen, "SKS",
                kaydedilen.getKulup().getAd() + " kulübü profil talebi için SKS notu: " + kaydedilen.getGeriBildirim());

        bildirimYayinlayici.kullaniciyiTurIleBilgilendir(
                kaydedilen.getKulup().getYoneticiKullaniciId(),
                baslik,
                kaydedilen.getKulup().getAd() + " kulübü profil talebi için SKS notu: " + kaydedilen.getGeriBildirim(),
                kaydedilen.getKulup().getId(),
                BildirimTuru.PROFIL_ONAY_TALEBI);

        return kulupYanitFabrikasi.profilTalepYaniti(kaydedilen, inceleyen);
    }
}
