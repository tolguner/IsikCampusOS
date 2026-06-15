package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.*;
import com.isik.kampusos.yolculuk.model.*;
import com.isik.kampusos.yolculuk.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class YolculukServisi {

    private static final double DURAK_ESIK_KM = 3.0;
    /** Yolcunun rotaya kattığı azami ek süre (dakika) — bunun üstü "yol üstünde değil". */
    private static final int MAKS_SAPMA_DK = 15;
    /** Aramada ilanın listelenmesi için: aranan biniş VE iniş, sürücü koridoruna bu km içinde olmalı. */
    private static final double ARAMA_KAPSAM_KM = 6.0;

    private final YolculukIlaniDeposu ilanDeposu;
    private final YolculukTalebiDeposu talepDeposu;
    private final SurucuDogrulamaDeposu dogrulamaDeposu;
    private final YolculukPuaniDeposu puanDeposu;
    private final YolculukSikayetiDeposu sikayetDeposu;
    private final RotaIstemcisi rotaIstemcisi;
    private final PopulerNoktaServisi populerNoktaServisi;
    private final AracDeposu aracDeposu;
    private final YolculukLogServisi logServisi;
    private final com.isik.kampusos.yolculuk.messaging.BildirimYayinlayici bildirimYayinlayici;
    private final KullaniciOzetIstemcisi kullaniciOzetIstemcisi;

    public List<YolculukIlani> ilanAra(YolculukAramaTalebi arama) {
        LocalDateTime baslangicZaman;
        LocalDateTime bitisZaman;
        if (arama.getTarih() != null) {
            baslangicZaman = arama.getTarih().atStartOfDay();
            bitisZaman = arama.getTarih().plusDays(1).atStartOfDay().minusNanos(1);
        } else {
            // Tarih seçilmediyse: şu andan itibaren tüm gelecekteki ilanlar (tarihsel yakınlık sırası).
            baslangicZaman = LocalDateTime.now();
            bitisZaman = LocalDateTime.now().plusYears(5);
        }
        List<YolculukIlani> ilanlar = ilanDeposu.findByKalkisZamaniBetweenAndDurumInOrderByKalkisZamaniAsc(
                baslangicZaman, bitisZaman,
                List.of(YolculukIlani.IlanDurumu.AKTIF, YolculukIlani.IlanDurumu.DOLU));

        // Biniş+iniş verildiyse koridor (rota yakınlığı) araması; verilmediyse tüm ilanlar listelenir.
        boolean koridorAramasi = arama.getBaslangicEnlem() != null && arama.getBaslangicBoylam() != null
                && arama.getVarisEnlem() != null && arama.getVarisBoylam() != null;

        var akis = ilanlar.stream()
                .filter(i -> i.bosKoltukSayisi() > 0)
                .filter(i -> arama.getSadeceUcretsiz() == null || !arama.getSadeceUcretsiz()
                        || i.getUcretTipi() == YolculukIlani.UcretTipi.UCRETSIZ)
                .filter(i -> arama.getMaksimumUcret() == null || i.getKisiBasiUcret() == null
                        || i.getKisiBasiUcret().compareTo(arama.getMaksimumUcret()) <= 0)
                .filter(i -> arama.getSadeceAraDurakKabulEdenler() == null || !arama.getSadeceAraDurakKabulEdenler()
                        || i.isAraDurakKabulEdilir())
                // BlaBlaCar mantığı: aranan biniş+iniş verildiyse, sürücünün rotası bu yolculuğu
                // makul mesafede kapsamıyorsa ilan listelenmez (alakasız şehir/bölge elenir).
                .filter(i -> aramaKapsiyorMu(i, arama))
                .peek(i -> i.setUygunlukSkoru(skorla(i, arama)));

        // Koridor araması: uygunluk skoruna göre; aksi halde tarihsel yakınlığa göre (en yakın önce).
        return (koridorAramasi
                ? akis.sorted(Comparator.comparingInt(YolculukIlani::getUygunlukSkoru).reversed()
                        .thenComparing(YolculukIlani::getKalkisZamani))
                : akis.sorted(Comparator.comparing(YolculukIlani::getKalkisZamani)))
                .toList();
    }

    @Transactional
    public YolculukIlani ilanOlustur(String surucuId, YolculukIlaniTalebi talep) {
        if (!dogrulamaDeposu.existsByKullaniciIdAndDurum(surucuId, SurucuDogrulama.DogrulamaDurumu.ONAYLANDI)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "İlan açmak için ehliyet doğrulamanız onaylanmalıdır.");
        }
        // İlan yalnızca sürücüye ait ve ONAYLANDI bir araçla açılabilir.
        Arac arac = (talep.getAracId() == null ? java.util.Optional.<Arac>empty()
                : aracDeposu.findByIdAndKullaniciId(talep.getAracId(), surucuId))
                .filter(a -> a.getDurum() == Arac.AracDurumu.ONAYLANDI)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "İlan açmak için onaylanmış bir araç seçmelisiniz. Araçlarınızı Ayarlar'dan ekleyip onaylatın."));
        zorunluNokta(talep.getBaslangic(), "Başlangıç noktası");
        zorunluNokta(talep.getVaris(), "Varış noktası");
        // Aynı / çok yakın iki nokta arasında ilan açılamaz: en az 1 km gerekir.
        double anaNoktaMesafesi = mesafeKm(
                talep.getBaslangic().getEnlem(), talep.getBaslangic().getBoylam(),
                talep.getVaris().getEnlem(), talep.getVaris().getBoylam());
        if (anaNoktaMesafesi < 1.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Başlangıç ve varış noktaları arasında en az 1 km mesafe olmalıdır.");
        }
        if (talep.getKalkisZamani() == null || talep.getKalkisZamani().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kalkış zamanı gelecekte olmalıdır.");
        }
        // Koltuk sayısı verilmemişse aracın kapasitesinden varsayılır.
        int koltukSayisi = talep.getKoltukSayisi();
        if (koltukSayisi < 1 && arac.getKoltukKapasitesi() != null) koltukSayisi = arac.getKoltukKapasitesi();
        if (koltukSayisi < 1 || koltukSayisi > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Koltuk sayısı 1-8 arasında olmalıdır.");
        }

        YolculukIlani.UcretTipi ucretTipi = enumCoz(talep.getUcretTipi(), YolculukIlani.UcretTipi.class, YolculukIlani.UcretTipi.UCRETSIZ);
        YolculukIlani.OdemeYontemi odeme = enumCoz(talep.getOdemeYontemi(), YolculukIlani.OdemeYontemi.class,
                ucretTipi == YolculukIlani.UcretTipi.UCRETSIZ ? YolculukIlani.OdemeYontemi.YOK : YolculukIlani.OdemeYontemi.NAKIT);
        if (ucretTipi == YolculukIlani.UcretTipi.UCRETLI
                && (talep.getKisiBasiUcret() == null || talep.getKisiBasiUcret().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ücretli ilanda kişi başı ücret girilmelidir.");
        }

        YolculukIlani ilan = YolculukIlani.builder()
                .surucuKullaniciId(surucuId)
                .aracId(arac.getId())
                .baslangicBasligi(talep.getBaslangic().getAd())
                .baslangicEnlem(talep.getBaslangic().getEnlem())
                .baslangicBoylam(talep.getBaslangic().getBoylam())
                .varisBasligi(talep.getVaris().getAd())
                .varisEnlem(talep.getVaris().getEnlem())
                .varisBoylam(talep.getVaris().getBoylam())
                .kalkisZamani(talep.getKalkisZamani())
                .koltukSayisi(koltukSayisi)
                .ucretTipi(ucretTipi)
                .odemeYontemi(odeme)
                .kisiBasiUcret(ucretTipi == YolculukIlani.UcretTipi.UCRETSIZ ? BigDecimal.ZERO : talep.getKisiBasiUcret())
                .iban(talep.getIban())
                .aciklama(talep.getAciklama())
                .araDurakKabulEdilir(talep.isAraDurakKabulEdilir())
                .rotaPolyline(talep.getRotaPolyline())
                .tahminiToplamDakika(talep.getTahminiToplamDakika())
                .tahminiMesafeKm(talep.getTahminiMesafeKm())
                .build();

        ilan.getDuraklar().add(RotaDuragi.builder()
                .ad(talep.getBaslangic().getAd())
                .enlem(talep.getBaslangic().getEnlem())
                .boylam(talep.getBaslangic().getBoylam())
                .sira(0)
                .tahminiDakika(0)
                .build());
        int sira = 1;
        for (RotaDuragiTalebi d : talep.getDuraklar()) {
            if (d.getAd() == null || d.getAd().isBlank()) continue;
            ilan.getDuraklar().add(RotaDuragi.builder()
                    .ad(d.getAd())
                    .enlem(d.getEnlem())
                    .boylam(d.getBoylam())
                    .sira(sira++)
                    .tahminiDakika(Math.max(0, d.getTahminiDakika()))
                    .build());
        }
        ilan.getDuraklar().add(RotaDuragi.builder()
                .ad(talep.getVaris().getAd())
                .enlem(talep.getVaris().getEnlem())
                .boylam(talep.getVaris().getBoylam())
                .sira(sira)
                .tahminiDakika(0)
                .build());

        // Durak kümülatif dakikaları için OSRM'in en iyi rotasını hesapla.
        List<double[]> noktalar = ilan.getDuraklar().stream()
                .sorted(Comparator.comparingInt(RotaDuragi::getSira))
                .map(d -> new double[]{d.getEnlem(), d.getBoylam()})
                .toList();
        RotaIstemcisi.RotaSonucu rota = rotaIstemcisi.rotaHesapla(noktalar);
        // Sürücü haritadan bir rota seçtiyse (alternatiflerden biri) ANA rota odur; aksi halde
        // OSRM'in en iyi rotası kullanılır. Koridor-eşleşmesi de saklanan polyline'a göre işler.
        boolean secilenVar = talep.getRotaPolyline() != null && !talep.getRotaPolyline().isBlank()
                && talep.getTahminiToplamDakika() != null;
        ilan.setRotaPolyline(secilenVar ? talep.getRotaPolyline() : rota.getPolyline());
        ilan.setTahminiToplamDakika(secilenVar ? talep.getTahminiToplamDakika() : rota.getToplamDakika());
        ilan.setTahminiMesafeKm(secilenVar && talep.getTahminiMesafeKm() != null
                ? talep.getTahminiMesafeKm() : rota.getMesafeKm());
        List<RotaDuragi> sirali = ilan.getDuraklar().stream()
                .sorted(Comparator.comparingInt(RotaDuragi::getSira)).toList();
        for (int i = 0; i < sirali.size(); i++) {
            int dk = i < rota.getKumulatifDakika().size() ? rota.getKumulatifDakika().get(i) : i * 15;
            sirali.get(i).setTahminiDakika(dk);
        }
        // Başlangıç/varış noktalarını popüler-nokta sayacına işle.
        populerNoktaServisi.kullanimArttir(talep.getBaslangic());
        populerNoktaServisi.kullanimArttir(talep.getVaris());
        YolculukIlani saved = ilanDeposu.save(ilan);

        logServisi.logEkle(
                surucuId,
                "ILAN_OLUSTURULDU",
                saved.getId(),
                talep.getBaslangic().getAd() + " -> " + talep.getVaris().getAd() + " (" + koltukSayisi + " koltuk)"
        );

        return saved;
    }

    /**
     * Form haritası için: sıralı noktalardan gerçek yol-ağı rotaları. İlk sıradaki en iyi (ana)
     * rota; varsa alternatifler sürücüye öneri olarak sunulur (en çok 3).
     */
    public List<RotaIstemcisi.RotaSonucu> rotaOnizle(RotaOnizlemeTalebi talep) {
        if (talep.getNoktalar() == null || talep.getNoktalar().size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "En az başlangıç ve varış noktası gerekli.");
        }
        List<double[]> noktalar = talep.getNoktalar().stream()
                .map(n -> new double[]{n.getEnlem(), n.getBoylam()}).toList();
        return rotaIstemcisi.rotaAlternatifleri(noktalar, 3);
    }

    public List<YolculukIlani> benimIlanlarim(String surucuId) {
        return ilanDeposu.findBySurucuKullaniciIdOrderByKalkisZamaniDesc(surucuId);
    }

    @Transactional
    public YolculukIlani ilanIptal(String surucuId, String ilanId) {
        YolculukIlani ilan = ilanSahiplikle(surucuId, ilanId);
        if (ilan.getDurum() == YolculukIlani.IlanDurumu.TAMAMLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tamamlanmış ilan iptal edilemez.");
        }
        ilan.setDurum(YolculukIlani.IlanDurumu.IPTAL);
        ilan.setIptalTarihi(LocalDateTime.now());
        YolculukIlani saved = ilanDeposu.save(ilan);

        // Aktif yolcuların (kabul edilmiş + bekleyen) taleplerini iptal et ve her birine bildir.
        List<YolculukTalebi> etkilenenler = talepDeposu.findByIlanIdAndDurumIn(saved.getId(),
                List.of(YolculukTalebi.TalepDurumu.KABUL_EDILDI, YolculukTalebi.TalepDurumu.BEKLEMEDE));
        for (YolculukTalebi talep : etkilenenler) {
            talep.setDurum(YolculukTalebi.TalepDurumu.IPTAL);
            talep.setRedNedeni("Sürücü ilanı iptal etti.");
            talep.setIptalTarihi(LocalDateTime.now());
            talepDeposu.save(talep);
            bildirimYayinlayici.kullaniciyaBildir(
                    talep.getYolcuKullaniciId(),
                    "Yolculuk iptal edildi",
                    saved.getBaslangicBasligi() + " → " + saved.getVarisBasligi()
                            + " yolculuğu sürücü tarafından iptal edildi.");
        }

        logServisi.logEkle(
                surucuId,
                "ILAN_IPTAL_EDILDI",
                saved.getId(),
                "İlan iptal edildi. Bilgilendirilen yolcu sayısı: " + etkilenenler.size()
        );

        return saved;
    }

    @Transactional
    public YolculukTalebi katil(String yolcuId, String ilanId, YolculukKatilimTalebi talep) {
        YolculukIlani ilan = ilanDeposu.findById(ilanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yolculuk ilanı bulunamadı."));
        if (ilan.getSurucuKullaniciId().equals(yolcuId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kendi yolculuk ilanınıza katılım isteği gönderemezsiniz.");
        }
        if (!YolculukEslesmeServisi.kabulEdilebilirMi(ilan)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu ilanda boş koltuk yok.");
        }
        talepDeposu.findByIlanIdAndYolcuKullaniciIdAndDurumIn(ilanId, yolcuId,
                List.of(YolculukTalebi.TalepDurumu.BEKLEMEDE, YolculukTalebi.TalepDurumu.KABUL_EDILDI))
                .ifPresent(t -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu ilana zaten aktif bir başvurunuz var.");
                });
        zorunluNokta(talep.getBinis(), "Biniş noktası");
        zorunluNokta(talep.getInis(), "İniş noktası");

        // Coğrafi eşleşme (BlaBlaCar mantığı): yolcu biniş/iniş noktası sürücünün rotasına yakın
        // ve sıralı olmalı. Sapma (sürücünün katlanacağı ek süre) eşiğin altındaysa uygun.
        List<double[]> surucuNoktalari = ilan.getDuraklar().stream()
                .sorted(Comparator.comparingInt(RotaDuragi::getSira))
                .map(d -> new double[]{d.getEnlem(), d.getBoylam()}).toList();
        double[] binisK = {talep.getBinis().getEnlem(), talep.getBinis().getBoylam()};
        double[] inisK = {talep.getInis().getEnlem(), talep.getInis().getBoylam()};
        if (ilan.isAraDurakKabulEdilir()) {
            int sapma = rotaIstemcisi.sapmaDakika(surucuNoktalari, binisK, inisK);
            if (sapma > MAKS_SAPMA_DK) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Biniş/iniş noktalarınız sürücünün rotasından çok sapıyor (~+" + sapma + " dk). Rotaya daha yakın noktalar seçin.");
            }
        } else if (!durakaYakin(ilan.getDuraklar(), binisK) || !durakaYakin(ilan.getDuraklar(), inisK)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu ilan yalnızca tanımlı duraklarından başvuru kabul ediyor; biniş/iniş noktalarınızı duraklara yakın seçin.");
        }
        populerNoktaServisi.kullanimArttir(talep.getBinis());
        populerNoktaServisi.kullanimArttir(talep.getInis());

        YolculukTalebi kayit = YolculukTalebi.builder()
                .ilanId(ilanId)
                .yolcuKullaniciId(yolcuId)
                .binisBasligi(talep.getBinis().getAd())
                .binisEnlem(talep.getBinis().getEnlem())
                .binisBoylam(talep.getBinis().getBoylam())
                .inisBasligi(talep.getInis().getAd())
                .inisEnlem(talep.getInis().getEnlem())
                .inisBoylam(talep.getInis().getBoylam())
                .koltukSayisi(Math.max(1, talep.getKoltukSayisi()))
                .tahminiBinisDakika(enYakinDurakDakika(ilan.getDuraklar(), binisK))
                .tahminiInisDakika(enYakinDurakDakika(ilan.getDuraklar(), inisK))
                .mesaj(talep.getMesaj())
                .build();
        YolculukTalebi saved = talepDeposu.save(kayit);
        bildirimYayinlayici.kullaniciyaBildir(ilan.getSurucuKullaniciId(),
                "Yeni yolcu talebi",
                rotaEtiketi(ilan) + " ilanınıza yeni bir katılım isteği geldi.");
        return saved;
    }

    private String rotaEtiketi(YolculukIlani ilan) {
        return ilan.getBaslangicBasligi() + " → " + ilan.getVarisBasligi();
    }

    public List<YolculukTalebi> taleplerim(String yolcuId) {
        return talepDeposu.findByYolcuKullaniciIdOrderByOlusturulmaTarihiDesc(yolcuId);
    }

    public List<YolculukTalebi> surucuTalepleri(String surucuId) {
        List<YolculukIlani> ilanlar = ilanDeposu.findBySurucuKullaniciIdOrderByKalkisZamaniDesc(surucuId);
        if (ilanlar.isEmpty()) return List.of();
        java.util.Map<String, YolculukIlani> ilanHaritasi = ilanlar.stream()
                .collect(java.util.stream.Collectors.toMap(YolculukIlani::getId, i -> i, (a, b) -> a));

        List<YolculukTalebi> talepler = talepDeposu.findByIlanIdInOrderByOlusturulmaTarihiDesc(ilanHaritasi.keySet());

        // Talebi gönderen yolcuların ad-soyad/öğrenci no bilgisini auth-service'ten çöz.
        var ozetler = kullaniciOzetIstemcisi.ozetler(
                talepler.stream().map(YolculukTalebi::getYolcuKullaniciId).toList());
        talepler.forEach(t -> {
            var o = ozetler.get(t.getYolcuKullaniciId());
            if (o != null) { t.setYolcuAdSoyad(o.adSoyad()); t.setYolcuOgrenciNo(o.ogrenciNumarasi()); }
            YolculukIlani ilan = ilanHaritasi.get(t.getIlanId());
            if (ilan != null) {
                t.setIlanBaslangicBasligi(ilan.getBaslangicBasligi());
                t.setIlanVarisBasligi(ilan.getVarisBasligi());
                t.setIlanKalkisZamani(ilan.getKalkisZamani());
            }
        });
        return talepler;
    }

    @Transactional
    public YolculukTalebi talepKabul(String surucuId, String talepId) {
        YolculukTalebi talep = talepBul(talepId);
        YolculukIlani ilan = ilanSahiplikle(surucuId, talep.getIlanId());
        YolculukEslesmeServisi.talebiKabulEt(ilan, talep);
        talep.setCevapTarihi(LocalDateTime.now());
        ilanDeposu.save(ilan);
        YolculukTalebi saved = talepDeposu.save(talep);
        bildirimYayinlayici.kullaniciyaBildir(talep.getYolcuKullaniciId(),
                "Talebiniz kabul edildi",
                rotaEtiketi(ilan) + " yolculuğuna katılım talebiniz kabul edildi.");
        return saved;
    }

    @Transactional
    public YolculukTalebi talepReddet(String surucuId, String talepId, String neden) {
        YolculukTalebi talep = talepBul(talepId);
        YolculukIlani ilan = ilanSahiplikle(surucuId, talep.getIlanId());
        if (talep.getDurum() != YolculukTalebi.TalepDurumu.BEKLEMEDE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yalnızca bekleyen talepler reddedilebilir.");
        }
        talep.setDurum(YolculukTalebi.TalepDurumu.REDDEDILDI);
        talep.setRedNedeni(neden);
        talep.setCevapTarihi(LocalDateTime.now());
        YolculukTalebi saved = talepDeposu.save(talep);
        bildirimYayinlayici.kullaniciyaBildir(talep.getYolcuKullaniciId(),
                "Talebiniz reddedildi",
                rotaEtiketi(ilan) + " yolculuğuna katılım talebiniz reddedildi."
                        + (neden != null && !neden.isBlank() ? " Neden: " + neden : ""));
        return saved;
    }

    @Transactional
    public YolculukTalebi talepIptal(String yolcuId, String talepId) {
        YolculukTalebi talep = talepBul(talepId);
        if (!talep.getYolcuKullaniciId().equals(yolcuId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu talep size ait değil.");
        }
        YolculukIlani ilan = ilanDeposu.findById(talep.getIlanId()).orElse(null);
        if (talep.getDurum() == YolculukTalebi.TalepDurumu.KABUL_EDILDI && ilan != null) {
            ilan.setKabulEdilenKoltukSayisi(Math.max(0, ilan.getKabulEdilenKoltukSayisi() - talep.getKoltukSayisi()));
            if (ilan.getDurum() == YolculukIlani.IlanDurumu.DOLU) ilan.setDurum(YolculukIlani.IlanDurumu.AKTIF);
            ilanDeposu.save(ilan);
        }
        talep.setDurum(YolculukTalebi.TalepDurumu.IPTAL);
        talep.setIptalTarihi(LocalDateTime.now());
        YolculukTalebi saved = talepDeposu.save(talep);
        if (ilan != null) {
            bildirimYayinlayici.kullaniciyaBildir(ilan.getSurucuKullaniciId(),
                    "Yolcu talebini iptal etti",
                    rotaEtiketi(ilan) + " ilanınızdaki bir yolcu katılım talebini iptal etti.");
        }
        return saved;
    }

    @Transactional
    public YolculukTalebi talepTamamla(String kullaniciId, String talepId) {
        YolculukTalebi talep = talepBul(talepId);
        YolculukIlani ilan = ilanDeposu.findById(talep.getIlanId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yolculuk ilanı bulunamadı."));
        if (!talep.getYolcuKullaniciId().equals(kullaniciId) && !ilan.getSurucuKullaniciId().equals(kullaniciId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu yolculuğu tamamlama yetkiniz yok.");
        }
        if (talep.getDurum() != YolculukTalebi.TalepDurumu.KABUL_EDILDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yalnızca kabul edilmiş yolculuk tamamlanabilir.");
        }
        talep.setDurum(YolculukTalebi.TalepDurumu.TAMAMLANDI);
        talep.setTamamlanmaTarihi(LocalDateTime.now());
        YolculukTalebi saved = talepDeposu.save(talep);
        // Tamamlamayı yapan dışındaki karşı tarafa bildir.
        String digerKullanici = kullaniciId.equals(talep.getYolcuKullaniciId())
                ? ilan.getSurucuKullaniciId() : talep.getYolcuKullaniciId();
        bildirimYayinlayici.kullaniciyaBildir(digerKullanici,
                "Yolculuk tamamlandı",
                rotaEtiketi(ilan) + " yolculuğu tamamlandı olarak işaretlendi.");
        return saved;
    }

    @Transactional
    public YolculukPuani puanla(String verenId, String talepId, PuanlamaTalebi talep) {
        YolculukTalebi yolculukTalebi = talepBul(talepId);
        YolculukIlani ilan = ilanDeposu.findById(yolculukTalebi.getIlanId()).orElseThrow();
        if (yolculukTalebi.getDurum() != YolculukTalebi.TalepDurumu.TAMAMLANDI) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Puanlama için yolculuk tamamlanmış olmalıdır.");
        }
        String alanId = karsiTaraf(verenId, yolculukTalebi, ilan);
        if (puanDeposu.existsByTalepIdAndVerenKullaniciId(talepId, verenId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu yolculuğu zaten puanladınız.");
        }
        if (talep.getPuan() < 1 || talep.getPuan() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Puan 1-5 arasında olmalıdır.");
        }
        return puanDeposu.save(YolculukPuani.builder()
                .talepId(talepId)
                .verenKullaniciId(verenId)
                .alanKullaniciId(alanId)
                .puan(talep.getPuan())
                .yorum(talep.getYorum())
                .build());
    }

    @Transactional
    public YolculukSikayeti sikayetEt(String sikayetciId, String talepId, SikayetTalebi talep) {
        YolculukTalebi yolculukTalebi = talepBul(talepId);
        YolculukIlani ilan = ilanDeposu.findById(yolculukTalebi.getIlanId()).orElseThrow();
        String hedefId = karsiTaraf(sikayetciId, yolculukTalebi, ilan);
        return sikayetDeposu.save(YolculukSikayeti.builder()
                .talepId(talepId)
                .sikayetciKullaniciId(sikayetciId)
                .hedefKullaniciId(hedefId)
                .neden(enumCoz(talep.getNeden(), YolculukSikayeti.SikayetNedeni.class, YolculukSikayeti.SikayetNedeni.DIGER))
                .aciklama(talep.getAciklama())
                .build());
    }

    private int skorla(YolculukIlani ilan, YolculukAramaTalebi arama) {
        int skor = 0;
        List<double[]> koridor = rotaKoridoru(ilan);
        // Rota, aranan başlangıç VE varış noktalarının ikisine de yakın geçiyorsa güçlü eşleşme.
        if (arama.getBaslangicEnlem() != null && arama.getVarisEnlem() != null
                && koridoraYakinMi(koridor, arama.getBaslangicEnlem(), arama.getBaslangicBoylam())
                && koridoraYakinMi(koridor, arama.getVarisEnlem(), arama.getVarisBoylam())) {
            skor += 50;
        }
        if (arama.getBaslangicEnlem() != null && arama.getBaslangicBoylam() != null) {
            skor += yakinlikSkoru(koridor, arama.getBaslangicEnlem(), arama.getBaslangicBoylam());
        }
        if (arama.getVarisEnlem() != null && arama.getVarisBoylam() != null) {
            skor += yakinlikSkoru(koridor, arama.getVarisEnlem(), arama.getVarisBoylam());
        }
        if (ilan.getUcretTipi() == YolculukIlani.UcretTipi.UCRETSIZ) skor += 10;
        if (dogrulamaDeposu.existsByKullaniciIdAndDurum(ilan.getSurucuKullaniciId(), SurucuDogrulama.DogrulamaDurumu.ONAYLANDI)) skor += 15;
        return skor;
    }

    /**
     * İlan, aranan biniş→iniş yolculuğunu kapsıyor mu? Her iki uç da sürücü koridoruna
     * {@link #ARAMA_KAPSAM_KM} içinde olmalı. Arama koordinatı verilmemişse (serbest gezinme) kapsar.
     */
    private boolean aramaKapsiyorMu(YolculukIlani ilan, YolculukAramaTalebi arama) {
        if (arama.getBaslangicEnlem() == null || arama.getBaslangicBoylam() == null
                || arama.getVarisEnlem() == null || arama.getVarisBoylam() == null) {
            return true;
        }
        List<double[]> koridor = rotaKoridoru(ilan);
        return koridoraUzaklikKm(koridor, arama.getBaslangicEnlem(), arama.getBaslangicBoylam()) <= ARAMA_KAPSAM_KM
                && koridoraUzaklikKm(koridor, arama.getVarisEnlem(), arama.getVarisBoylam()) <= ARAMA_KAPSAM_KM;
    }

    /** İlanın yol-ağı koridoru: OSRM polyline çözülür; yoksa durak koordinatlarına düşer. */
    private List<double[]> rotaKoridoru(YolculukIlani ilan) {
        List<double[]> cizgi = RotaIstemcisi.polylineCoz(ilan.getRotaPolyline());
        if (!cizgi.isEmpty()) return cizgi;
        return ilan.getDuraklar().stream().map(d -> new double[]{d.getEnlem(), d.getBoylam()}).toList();
    }

    private double koridoraUzaklikKm(List<double[]> koridor, double enlem, double boylam) {
        double[] p = {enlem, boylam};
        return koridor.stream().mapToDouble(k -> RotaIstemcisi.haversineKm(p, k)).min().orElse(999);
    }

    private boolean koridoraYakinMi(List<double[]> koridor, double enlem, double boylam) {
        return koridoraUzaklikKm(koridor, enlem, boylam) <= DURAK_ESIK_KM;
    }

    private int yakinlikSkoru(List<double[]> koridor, double enlem, double boylam) {
        double min = koridoraUzaklikKm(koridor, enlem, boylam);
        if (min <= 1.0) return 20;
        if (min <= DURAK_ESIK_KM) return 12;
        if (min <= 8.0) return 4;
        return 0;
    }

    /** Nokta, ilanın duraklarından herhangi birine yakın mı (ara durak kabul etmeyen ilanlar için). */
    private boolean durakaYakin(List<RotaDuragi> duraklar, double[] nokta) {
        return duraklar.stream().anyMatch(d -> mesafeKm(nokta[0], nokta[1], d.getEnlem(), d.getBoylam()) <= 0.8);
    }

    /** Noktaya en yakın durağın başlangıçtan itibaren tahmini dakikası. */
    private Integer enYakinDurakDakika(List<RotaDuragi> duraklar, double[] nokta) {
        return duraklar.stream()
                .min(Comparator.comparingDouble(d -> mesafeKm(nokta[0], nokta[1], d.getEnlem(), d.getBoylam())))
                .map(RotaDuragi::getTahminiDakika).orElse(null);
    }

    private double mesafeKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private YolculukIlani ilanSahiplikle(String surucuId, String ilanId) {
        YolculukIlani ilan = ilanDeposu.findById(ilanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yolculuk ilanı bulunamadı."));
        if (!ilan.getSurucuKullaniciId().equals(surucuId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu ilan size ait değil.");
        }
        return ilan;
    }

    private YolculukTalebi talepBul(String talepId) {
        return talepDeposu.findById(talepId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yolculuk talebi bulunamadı."));
    }

    private String karsiTaraf(String kullaniciId, YolculukTalebi talep, YolculukIlani ilan) {
        if (talep.getYolcuKullaniciId().equals(kullaniciId)) return ilan.getSurucuKullaniciId();
        if (ilan.getSurucuKullaniciId().equals(kullaniciId)) return talep.getYolcuKullaniciId();
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu yolculuğun tarafı değilsiniz.");
    }

    private void zorunluNokta(NoktaTalebi nokta, String alan) {
        if (nokta == null || nokta.getAd() == null || nokta.getAd().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, alan + " zorunludur.");
        }
    }

    private <E extends Enum<E>> E enumCoz(String deger, Class<E> enumTipi, E varsayilan) {
        if (deger == null || deger.isBlank()) return varsayilan;
        try {
            return Enum.valueOf(enumTipi, deger.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz değer: " + deger);
        }
    }
}
