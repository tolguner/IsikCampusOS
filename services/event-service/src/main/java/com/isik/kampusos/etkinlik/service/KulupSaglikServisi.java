package com.isik.kampusos.etkinlik.service;

import com.isik.kampusos.etkinlik.dto.KulupSaglikIslemTalebi;
import com.isik.kampusos.etkinlik.dto.KulupSaglikYaniti;
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import com.isik.kampusos.etkinlik.model.Kulup;
import com.isik.kampusos.etkinlik.model.KulupSaglikKaydi;
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import com.isik.kampusos.etkinlik.model.KulupProfilDegisiklikIstegi;
import com.isik.kampusos.etkinlik.model.Etkinlik;
import com.isik.kampusos.etkinlik.repository.KulupDuyurusuDeposu;
import com.isik.kampusos.etkinlik.repository.KulupSaglikKaydiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupUyesiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupProfilDegisiklikIstegiDeposu;
import com.isik.kampusos.etkinlik.repository.KulupDeposu;
import com.isik.kampusos.etkinlik.repository.EtkinlikDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KulupSaglikServisi {
    private static final List<KulupUyesi.UyeDurumu> AKTIF_BENZERI_UYE_DURUMLARI = List.of(
            KulupUyesi.UyeDurumu.AKTIF,
            KulupUyesi.UyeDurumu.BEKLEMEDE);

    private final KulupDeposu kulupDeposu;
    private final KulupUyesiDeposu kulupUyesiDeposu;
    private final EtkinlikDeposu etkinlikDeposu;
    private final KulupDuyurusuDeposu kulupDuyurusuDeposu;
    private final KulupProfilDegisiklikIstegiDeposu profilDegisiklikIstegiDeposu;
    private final KulupSaglikKaydiDeposu kulupSaglikKaydiDeposu;
    private final BildirimServisi bildirimServisi;
    private final DenetimGunluguServisi denetimGunluguServisi;

    public List<KulupSaglikYaniti> saglikListele() {
        return kulupDeposu.findAllBySilindiFalseOrderByAdAsc().stream()
                .map(this::saglikYanitinaDonustur)
                .toList();
    }

    @Transactional
    public KulupSaglikYaniti notEkle(String kulupId, String yapanId, KulupSaglikIslemTalebi talep) {
        Kulup kulup = kulupGetir(kulupId);
        String mesaj = zorunluMesaj(talep);
        KulupSaglikKaydi kayit = kayitBulVeyaOlustur(kulupId);
        kayit.setSonNot(mesaj);
        kayit.setSonNotuYazan(yapanId);
        kayit.setSonNotTarihi(LocalDateTime.now());
        kulupSaglikKaydiDeposu.save(kayit);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "HEALTH_NOTE_ADDED", yapanId, "SKS",
                "SKS kulüp sağlık notu ekledi: " + mesaj);
        return saglikYanitinaDonustur(kulup);
    }

    @Transactional
    public KulupSaglikYaniti gozlemListesineAl(String kulupId, String yapanId, KulupSaglikIslemTalebi talep) {
        Kulup kulup = kulupGetir(kulupId);
        String mesaj = istegeBagliMesaj(talep, "Kulüp SKS takip listesine alındı.");
        KulupSaglikKaydi kayit = kayitBulVeyaOlustur(kulupId);
        kayit.setGozlemListesinde(true);
        kayit.setSonNot(mesaj);
        kayit.setSonNotuYazan(yapanId);
        kayit.setSonNotTarihi(LocalDateTime.now());
        kulupSaglikKaydiDeposu.save(kayit);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "WATCHLISTED", yapanId, "SKS", mesaj);
        bildirimServisi.kullaniciDuyurusuBilgilendir(
                kulup.getYoneticiKullaniciId(),
                "Kulübün SKS takip listesine alındı",
                mesaj,
                "/kulup-yonetimi",
                "Kulüp yönetimini aç",
                null,
                yapanId,
                "SKS Yönetimi");
        return saglikYanitinaDonustur(kulup);
    }

    @Transactional
    public KulupSaglikYaniti aksiyonTalepEt(String kulupId, String yapanId, KulupSaglikIslemTalebi talep) {
        Kulup kulup = kulupGetir(kulupId);
        String mesaj = zorunluMesaj(talep);
        denetimGunluguServisi.kaydet(DenetimGunlugu.VarlikTuru.KULUP, kulupId, "ACTION_REQUESTED", yapanId, "SKS", mesaj);
        bildirimServisi.kullaniciDuyurusuBilgilendir(
                kulup.getYoneticiKullaniciId(),
                "SKS kulübünden aksiyon bekliyor",
                mesaj,
                "/kulup-yonetimi",
                "Kulüp yönetimini aç",
                null,
                yapanId,
                "SKS Yönetimi");
        return saglikYanitinaDonustur(kulup);
    }

    private KulupSaglikYaniti saglikYanitinaDonustur(Kulup kulup) {
        String kulupId = kulup.getId();
        List<Etkinlik> etkinlikler = etkinlikDeposu.findByKulup_Id(kulupId);
        LocalDateTime simdi = LocalDateTime.now();
        long uyeSayisi = kulupUyesiDeposu.countByKulupIdAndDurumIn(kulupId, AKTIF_BENZERI_UYE_DURUMLARI);
        long aktifEtkinlikler = etkinlikler.stream().filter(etkinlik -> etkinlik.getDurum() == Etkinlik.EtkinlikDurumu.YAYINLANDI).count();
        long gelecekEtkinlikler = etkinlikler.stream()
                .filter(etkinlik -> etkinlik.getDurum() == Etkinlik.EtkinlikDurumu.YAYINLANDI)
                .filter(etkinlik -> etkinlik.getBaslangicTarihi() != null && !etkinlik.getBaslangicTarihi().isBefore(simdi))
                .count();
        long onayBekleyenEtkinlikler = etkinlikler.stream().filter(etkinlik -> etkinlik.getDurum() == Etkinlik.EtkinlikDurumu.SKS_ONAYI_BEKLIYOR).count();
        long onayBekleyenProfiller = profilDegisiklikIstegiDeposu.findByDurumInOrderByOlusturulmaTarihiDesc(List.of(
                        KulupProfilDegisiklikIstegi.DegisiklikDurumu.BEKLEMEDE,
                        KulupProfilDegisiklikIstegi.DegisiklikDurumu.REVIZYON_TALEP_EDILDI))
                .stream()
                .filter(request -> request.getKulup().getId().equals(kulupId))
                .count();
        LocalDateTime sonEtkinlikTarihi = etkinlikler.stream()
                .map(Etkinlik::getBaslangicTarihi)
                .filter(value -> value != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
        LocalDateTime sonDuyuruTarihi = kulupDuyurusuDeposu.findByKulupIdOrderByOlusturulmaTarihiDesc(kulupId)
                .stream()
                .map(announcement -> announcement.getOlusturulmaTarihi())
                .findFirst()
                .orElse(null);
        double katilimOrtalamasi = etkinlikler.stream()
                .filter(etkinlik -> etkinlik.getMevcutRsvpSayisi() > 0)
                .mapToDouble(etkinlik -> etkinlik.getMevcutRsvpSayisi())
                .average()
                .orElse(0);
        KulupSaglikKaydi kayit = kulupSaglikKaydiDeposu.findByKulupId(kulupId).orElse(null);
        boolean gozlemListesinde = kayit != null && kayit.isGozlemListesinde();
        String saglikDurumu = saglikDurumunuCoz(kulup, uyeSayisi, gelecekEtkinlikler, sonEtkinlikTarihi, gozlemListesinde);

        return KulupSaglikYaniti.builder()
                .kulupId(kulupId)
                .kulupAdi(kulup.getAd())
                .aktif(kulup.isAktif())
                .uyeSayisi(uyeSayisi)
                .aktifEtkinlikSayisi(aktifEtkinlikler)
                .gelecekEtkinlikSayisi(gelecekEtkinlikler)
                .onayBekleyenEtkinlikSayisi(onayBekleyenEtkinlikler)
                .onayBekleyenProfilTalebiSayisi(onayBekleyenProfiller)
                .sonEtkinlikTarihi(sonEtkinlikTarihi)
                .sonDuyuruTarihi(sonDuyuruTarihi)
                .katilimOrtalamasi(katilimOrtalamasi)
                .saglikDurumu(saglikDurumu)
                .gozetimAltinda(gozlemListesinde)
                .sonNot(kayit != null ? kayit.getSonNot() : null)
                .sonNotuYazan(kayit != null ? kayit.getSonNotuYazan() : null)
                .sonNotTarihi(kayit != null ? kayit.getSonNotTarihi() : null)
                .build();
    }

    private String saglikDurumunuCoz(Kulup kulup, long uyeSayisi, long gelecekEtkinlikler, LocalDateTime sonEtkinlikTarihi, boolean gozlemListesinde) {
        if (!kulup.isAktif()) {
            return "Pasifleşmeye Aday";
        }
        if (gozlemListesinde || uyeSayisi < 5) {
            return "Riskli";
        }
        if (gelecekEtkinlikler == 0 || sonEtkinlikTarihi == null || sonEtkinlikTarihi.isBefore(LocalDateTime.now().minusMonths(3))) {
            return "Takip Edilmeli";
        }
        return "Sağlıklı";
    }

    private Kulup kulupGetir(String kulupId) {
        return kulupDeposu.findByIdAndSilindiFalse(kulupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kulup bulunamadi"));
    }

    private KulupSaglikKaydi kayitBulVeyaOlustur(String kulupId) {
        return kulupSaglikKaydiDeposu.findByKulupId(kulupId)
                .orElseGet(() -> KulupSaglikKaydi.builder().kulupId(kulupId).build());
    }

    private String zorunluMesaj(KulupSaglikIslemTalebi talep) {
        String mesaj = talep == null ? null : talep.getMesaj();
        if (mesaj == null || mesaj.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mesaj zorunludur");
        }
        return mesaj.trim();
    }

    private String istegeBagliMesaj(KulupSaglikIslemTalebi talep, String varsayilan) {
        String mesaj = talep == null ? null : talep.getMesaj();
        return mesaj == null || mesaj.isBlank() ? varsayilan : mesaj.trim();
    }
}
