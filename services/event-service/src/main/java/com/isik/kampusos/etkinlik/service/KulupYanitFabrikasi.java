package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.KulupProfilDegisiklikIstegiYaniti;
import com.isik.kampusos.etkinlik.dto.KulupYaniti;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupProfilDegisiklikIstegi;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Kulüp varlıklarını DTO yanıtlarına dönüştüren ortak fabrika.
 * Hem {@link KulupServisi} hem {@link KulupProfilTalepServisi} tarafından paylaşılır;
 * yaprak bileşen olduğu için servisler arasında döngüsel bağımlılık oluşmaz.
 */
@Component
@RequiredArgsConstructor
public class KulupYanitFabrikasi {

    static final List<KulupUyesi.UyeDurumu> AKTIF_BENZERI_UYE_DURUMLARI = List.of(
            KulupUyesi.UyeDurumu.AKTIF,
            KulupUyesi.UyeDurumu.BEKLEMEDE);

    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final EtkinlikDeposu etkinlikDeposu;

    public KulupYaniti kulupYanitiOlustur(Kulup kulup, String mevcutKullaniciId) {
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

    public KulupProfilDegisiklikIstegiYaniti profilTalepYaniti(
            KulupProfilDegisiklikIstegi request,
            String mevcutKullaniciId) {
        return KulupProfilDegisiklikIstegiYaniti.builder()
                .id(request.getId())
                .kulup(kulupYanitiOlustur(request.getKulup(), mevcutKullaniciId))
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

    public boolean kulupYoneticisiMi(Kulup kulup, String kullaniciId) {
        return kulup.getYoneticiKullaniciId() != null && kullaniciId != null
                && kulup.getYoneticiKullaniciId().trim().equalsIgnoreCase(kullaniciId.trim());
    }

    public boolean sistemYoneticisiMi(String yetkiler) {
        return yetkiler != null && (yetkiler.contains("ROLE_SKS_ADMIN") || yetkiler.contains("ROLE_ADMIN"));
    }
}
