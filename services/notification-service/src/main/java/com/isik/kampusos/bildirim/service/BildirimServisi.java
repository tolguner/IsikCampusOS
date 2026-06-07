package com.isik.kampusos.bildirim.service;

import com.isik.kampusos.bildirim.dto.BildirimOlayi;
import com.isik.kampusos.bildirim.dto.BildirimYaniti;
import com.isik.kampusos.bildirim.model.Bildirim;
import com.isik.kampusos.bildirim.model.BildirimOkuma;
import com.isik.kampusos.bildirim.repository.BildirimDeposu;
import com.isik.kampusos.bildirim.repository.BildirimOkumaDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Bildirim persistance ve okuma servisi.
 *
 * <p>Bildirimler artık yalnızca {@code bildirim.olustur} Kafka olayı üzerinden oluşturulur
 * (üretici: club-service). Görünürlük, isteği yapan kullanıcının JWT rollerinden çözülür;
 * bu servisin başka servislerin (örn. kulüp) veritabanına erişimi yoktur — kulüp başkanına
 * özel duyurular üretici tarafında tek tek alıcıya (KULLANICI) fan-out edilir.
 */
@Service
@RequiredArgsConstructor
public class BildirimServisi {

    private final BildirimDeposu bildirimDeposu;
    private final BildirimOkumaDeposu bildirimOkumaDeposu;
    private final com.isik.kampusos.bildirim.messaging.BildirimAkisYoneticisi akisYoneticisi;

    /** Kafka olayından bildirim oluşturur (tüketici tarafından çağrılır). */
    public Bildirim olaydanOlustur(BildirimOlayi olay) {
        Bildirim bildirim = Bildirim.builder()
                .baslik(olay.getBaslik())
                .mesaj(olay.getMesaj())
                .baglantiUrl(olay.getBaglantiUrl())
                .baglantiEtiketi(olay.getBaglantiEtiketi())
                .resimUrl(olay.getResimUrl())
                .tur(turCoz(olay.getTur()))
                .hedefKitle(hedefKitleCoz(olay.getHedefKitle()))
                .aliciKullaniciId(olay.getAliciKullaniciId())
                .ilgiliEtkinlikId(olay.getIlgiliEtkinlikId())
                .olusturan(olay.getOlusturan())
                .olusturanAdi(olay.getOlusturanAdi())
                .build();
        Bildirim kaydedilen = bildirimDeposu.save(bildirim);
        akisYoneticisi.yayinla(kaydedilen);   // anlık (SSE) push
        return kaydedilen;
    }

    /**
     * İdari rollerin tüm öğrencilere gönderdiği toplu duyuruyu kalıcılaştırır.
     * Gönderenin kurumsal kimliği (olusturanAdi) öğrenciye gösterilir.
     */
    public Bildirim topluDuyuruOlustur(String baslik, String mesaj, String baglantiUrl,
                                       String baglantiEtiketi, String resimUrl,
                                       Bildirim.HedefKitle hedefKitle,
                                       String olusturanId, String olusturanAdi) {
        if (baslik == null || baslik.isBlank() || mesaj == null || mesaj.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başlık ve mesaj zorunludur.");
        }
        Bildirim bildirim = Bildirim.builder()
                .baslik(baslik.trim())
                .mesaj(mesaj.trim())
                .baglantiUrl(baglantiUrl)
                .baglantiEtiketi(baglantiEtiketi)
                .resimUrl(resimUrl)
                .tur(Bildirim.BildirimTuru.DUYURU)
                .hedefKitle(hedefKitle)
                .olusturan(olusturanId)
                .olusturanAdi(olusturanAdi)
                .build();
        Bildirim kaydedilen = bildirimDeposu.save(bildirim);
        akisYoneticisi.yayinla(kaydedilen);   // anlık (SSE) push
        return kaydedilen;
    }

    public List<BildirimYaniti> gorunurBildirimleriListele(String kullaniciId, String yetkiler) {
        List<Bildirim.HedefKitle> kitleler = gorunurKitleler(yetkiler);

        return bildirimDeposu
                .findByAliciKullaniciIdOrHedefKitleInOrderByOlusturulmaTarihiDesc(kullaniciId, kitleler)
                .stream()
                .map(bildirim -> yanitaDonustur(bildirim, kullaniciTarafindanOkunduMu(bildirim, kullaniciId)))
                .toList();
    }

    public BildirimYaniti okunduOlarakIsaretle(String kullaniciId, String yetkiler, String bildirimId) {
        Bildirim bildirim = bildirimDeposu.findById(bildirimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bildirim bulunamadi"));

        if (!kullaniciTarafindanGorunurMu(bildirim, kullaniciId, gorunurKitleler(yetkiler))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu bildirime erisim izniniz yok");
        }

        bildirimOkumaDeposu.findByBildirimIdAndKullaniciId(bildirimId, kullaniciId)
                .orElseGet(() -> bildirimOkumaDeposu.save(BildirimOkuma.builder()
                        .bildirimId(bildirimId)
                        .kullaniciId(kullaniciId)
                        .build()));

        return yanitaDonustur(bildirim, true);
    }

    private List<Bildirim.HedefKitle> gorunurKitleler(String yetkiler) {
        List<Bildirim.HedefKitle> kitleler = new ArrayList<>();
        // Tüm kimliği doğrulanmış kullanıcılar "tüm kullanıcılar" duyurularını görür.
        kitleler.add(Bildirim.HedefKitle.TUM_KULLANICILAR);
        if (yetkiler != null && yetkiler.contains("ROLE_STUDENT")) {
            kitleler.add(Bildirim.HedefKitle.TUM_OGRENCILER);
        }
        if (yetkiler != null && (yetkiler.contains("ROLE_SKS_ADMIN") || yetkiler.contains("ROLE_ADMIN"))) {
            kitleler.add(Bildirim.HedefKitle.SKS_YONETICILERI);
        }
        return kitleler;
    }

    private boolean kullaniciTarafindanGorunurMu(Bildirim bildirim, String kullaniciId, List<Bildirim.HedefKitle> kitleler) {
        return kullaniciId.equals(bildirim.getAliciKullaniciId()) || kitleler.contains(bildirim.getHedefKitle());
    }

    private boolean kullaniciTarafindanOkunduMu(Bildirim bildirim, String kullaniciId) {
        return bildirimOkumaDeposu.existsByBildirimIdAndKullaniciId(bildirim.getId(), kullaniciId);
    }

    private Bildirim.BildirimTuru turCoz(String deger) {
        try {
            return Bildirim.BildirimTuru.valueOf(deger);
        } catch (Exception e) {
            return Bildirim.BildirimTuru.DUYURU;
        }
    }

    private Bildirim.HedefKitle hedefKitleCoz(String deger) {
        try {
            return Bildirim.HedefKitle.valueOf(deger);
        } catch (Exception e) {
            return Bildirim.HedefKitle.KULLANICI;
        }
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
}
