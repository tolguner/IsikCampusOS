package com.isik.kampusos.tesis.service;

import com.isik.kampusos.tesis.dto.*;
import com.isik.kampusos.tesis.model.Tesis;
import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import com.isik.kampusos.tesis.model.TesisPolitikasi;
import com.isik.kampusos.tesis.model.TesisKaynagi;
import com.isik.kampusos.tesis.repository.TesisKullanilabilirlikKuraliDeposu;
import com.isik.kampusos.tesis.repository.TesisPolitikasiDeposu;
import com.isik.kampusos.tesis.repository.TesisDeposu;
import com.isik.kampusos.tesis.repository.TesisKaynagiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.isik.kampusos.tesis.model.TesisRezervasyon;
import com.isik.kampusos.tesis.repository.TesisRezervasyonDeposu;

@Service
@RequiredArgsConstructor
public class TesisServisi {

    private final TesisDeposu tesisDeposu;
    private final TesisKaynagiDeposu tesisKaynagiDeposu;
    private final TesisPolitikasiDeposu tesisPolitikasiDeposu;
    private final TesisKullanilabilirlikKuraliDeposu tesisKullanilabilirlikKuraliDeposu;
    private final TesisRezervasyonDeposu tesisRezervasyonDeposu;

    public List<TesisYaniti> listFacilities() {
        return tesisDeposu.findBySilinmeTarihiIsNullOrderByAdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public TesisYaniti getFacility(String tesisId) {
        return toResponse(requireFacility(tesisId));
    }

    public Tesis createFacility(String actorId, TesisTalebi talep) {
        Tesis tesis = Tesis.builder()
                .ad(required(talep.getAd(), "Tesis adı zorunludur."))
                .tesisTuru(parseFacilityType(talep.getTesisTuru()))
                .aciklama(talep.getAciklama())
                .konumMetni(talep.getKonumMetni())
                .kapasite(requirePositive(talep.getKapasite(), "Kapasite 0'dan büyük olmalıdır."))
                .durum(parseFacilityStatusOrDefault(talep.getDurum(), Tesis.TesisDurumu.AKTIF))
                .olusturan(actorId)
                .guncelleyen(actorId)
                .build();
        Tesis saved = tesisDeposu.save(tesis);

        // Arka planda otomatik bir kaynak oluştur
        TesisKaynagi kaynak = TesisKaynagi.builder()
                .tesis(saved)
                .kaynakKodu("DEFAULT_" + saved.getId().substring(0, 8).toUpperCase())
                .ad(saved.getAd() + " Sahası / Birimi")
                .kaynakTuru(mapFacilityTypeToResourceType(saved.getTesisTuru()))
                .kapasite(saved.getKapasite())
                .rezervasyonYapilabilir(true)
                .durum(TesisKaynagi.KaynakDurumu.AKTIF)
                .olusturan(actorId)
                .guncelleyen(actorId)
                .build();
        tesisKaynagiDeposu.save(kaynak);

        return saved;
    }

    public Tesis updateFacility(String actorId, String tesisId, TesisTalebi talep) {
        Tesis tesis = requireFacility(tesisId);
        tesis.setAd(required(talep.getAd(), "Tesis adı zorunludur."));
        tesis.setTesisTuru(parseFacilityType(talep.getTesisTuru()));
        tesis.setAciklama(talep.getAciklama());
        tesis.setKonumMetni(talep.getKonumMetni());
        tesis.setKapasite(requirePositive(talep.getKapasite(), "Kapasite 0'dan büyük olmalıdır."));
        tesis.setDurum(parseFacilityStatusOrDefault(talep.getDurum(), tesis.getDurum()));
        tesis.setGuncelleyen(actorId);
        Tesis saved = tesisDeposu.save(tesis);

        // Arka planda ilişkili varsayılan kaynağı güncelle
        List<TesisKaynagi> kaynaklar = tesisKaynagiDeposu.findByTesisIdAndSilinmeTarihiIsNullOrderByAdAsc(tesisId);
        if (!kaynaklar.isEmpty()) {
            TesisKaynagi varsayilanKaynak = kaynaklar.get(0);
            varsayilanKaynak.setAd(saved.getAd() + " Sahası / Birimi");
            varsayilanKaynak.setKapasite(saved.getKapasite());
            varsayilanKaynak.setKaynakTuru(mapFacilityTypeToResourceType(saved.getTesisTuru()));
            varsayilanKaynak.setGuncelleyen(actorId);
            tesisKaynagiDeposu.save(varsayilanKaynak);
        }

        return saved;
    }

    @Transactional
    public void deleteFacility(String actorId, String tesisId) {
        Tesis tesis = requireFacility(tesisId);
        LocalDateTime now = LocalDateTime.now();
        tesis.setSilinmeTarihi(now);
        tesis.setGuncelleyen(actorId);
        tesisDeposu.save(tesis);

        // İlişkili tüm kaynakları bul ve sil
        List<TesisKaynagi> kaynaklar = tesisKaynagiDeposu.findByTesisIdAndSilinmeTarihiIsNullOrderByAdAsc(tesisId);
        for (TesisKaynagi kaynak : kaynaklar) {
            kaynak.setSilinmeTarihi(now);
            kaynak.setGuncelleyen(actorId);
            tesisKaynagiDeposu.save(kaynak);

            // İlişkili aktif tüm rezervasyonları bul ve iptal et
            List<TesisRezervasyon> aktifRezervasyonlar = tesisRezervasyonDeposu.findByKaynakIdAndDurumIn(
                    kaynak.getId(),
                    List.of(
                            TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE,
                            TesisRezervasyon.RezervasyonDurumu.ONAYLANDI,
                            TesisRezervasyon.RezervasyonDurumu.BLOKE
                    )
            );
            for (TesisRezervasyon rezervasyon : aktifRezervasyonlar) {
                rezervasyon.setDurum(TesisRezervasyon.RezervasyonDurumu.IPTAL_EDILDI);
                rezervasyon.setIptalNedeni("Tesis kullanımdan kaldırıldı.");
                tesisRezervasyonDeposu.save(rezervasyon);
            }
        }

        // İlişkili politikayı sil
        tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull(tesisId).ifPresent(politika -> {
            politika.setSilinmeTarihi(now);
            politika.setGuncelleyen(actorId);
            tesisPolitikasiDeposu.save(politika);
        });
    }

    public TesisKaynagi createResource(String actorId, String tesisId, TesisKaynakTalebi talep) {
        Tesis tesis = requireFacility(tesisId);
        String kaynakKodu = required(talep.getKaynakKodu(), "Kaynak kodu zorunludur.").trim().toUpperCase();
        if (tesisKaynagiDeposu.existsByTesisIdAndKaynakKoduAndSilinmeTarihiIsNull(tesisId, kaynakKodu)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu tesis içinde aynı kaynak kodu zaten kullanılıyor.");
        }

        TesisKaynagi kaynak = TesisKaynagi.builder()
                .tesis(tesis)
                .kaynakKodu(kaynakKodu)
                .ad(required(talep.getAd(), "Kaynak adı zorunludur."))
                .kaynakTuru(parseResourceType(talep.getKaynakTuru()))
                .kapasite(requirePositive(talep.getKapasite(), "Kaynak kapasitesi 0'dan büyük olmalıdır."))
                .rezervasyonYapilabilir(talep.isRezervasyonYapilabilir())
                .durum(parseResourceStatusOrDefault(talep.getDurum(), TesisKaynagi.KaynakDurumu.AKTIF))
                .olusturan(actorId)
                .guncelleyen(actorId)
                .build();
        return tesisKaynagiDeposu.save(kaynak);
    }

    public TesisKaynagi updateResource(String actorId, String kaynakId, TesisKaynakTalebi talep) {
        TesisKaynagi kaynak = requireResource(kaynakId);
        String kaynakKodu = required(talep.getKaynakKodu(), "Kaynak kodu zorunludur.").trim().toUpperCase();
        boolean kodDegisti = !kaynakKodu.equals(kaynak.getKaynakKodu());
        if (kodDegisti && tesisKaynagiDeposu.existsByTesisIdAndKaynakKoduAndSilinmeTarihiIsNull(kaynak.getTesis().getId(), kaynakKodu)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu tesis içinde aynı kaynak kodu zaten kullanılıyor.");
        }

        kaynak.setKaynakKodu(kaynakKodu);
        kaynak.setAd(required(talep.getAd(), "Kaynak adı zorunludur."));
        kaynak.setKaynakTuru(parseResourceType(talep.getKaynakTuru()));
        kaynak.setKapasite(requirePositive(talep.getKapasite(), "Kaynak kapasitesi 0'dan büyük olmalıdır."));
        kaynak.setRezervasyonYapilabilir(talep.isRezervasyonYapilabilir());
        kaynak.setDurum(parseResourceStatusOrDefault(talep.getDurum(), kaynak.getDurum()));
        kaynak.setGuncelleyen(actorId);
        return tesisKaynagiDeposu.save(kaynak);
    }

    public TesisPolitikasi upsertPolicy(String actorId, String tesisId, TesisPolitikasiTalebi talep) {
        Tesis tesis = requireFacility(tesisId);
        TesisPolitikasi politika = tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull(tesisId)
                .orElseGet(() -> TesisPolitikasi.builder()
                        .tesis(tesis)
                        .durum(TesisPolitikasi.PolitikaDurumu.AKTIF)
                        .build());

        politika.setRezervasyonPenceresiGun(requirePositive(talep.getRezervasyonPenceresiGun(), "Rezervasyon penceresi 0'dan büyük olmalıdır."));
        politika.setMinimumBildirimDakika(requireNonNegative(talep.getMinimumBildirimDakika(), "Minimum ön süre negatif olamaz."));
        politika.setIptalLimitDakika(requireNonNegative(talep.getIptalLimitDakika(), "İptal süresi negatif olamaz."));
        politika.setYoklamaZorunlu(talep.isYoklamaZorunlu());
        politika.setOtomatikGelmemeDakika(requireNonNegative(talep.getOtomatikGelmemeDakika(), "No-show süresi negatif olamaz."));
        politika.setMaksimumRezervasyonSureDakika(requirePositive(talep.getMaksimumRezervasyonSureDakika(), "Maksimum rezervasyon süresi 0'dan büyük olmalıdır."));
        politika.setGuncelleyen(actorId);
        return tesisPolitikasiDeposu.save(politika);
    }

    @Transactional
    public List<TesisKullanilabilirlikKurali> replaceAvailabilityRules(String actorId, String kaynakId, List<KullanilabilirlikKuraliTalebi> talepler) {
        TesisKaynagi kaynak = requireResource(kaynakId);
        List<TesisKullanilabilirlikKurali> kurallar = talepler.stream()
                .map(talep -> toRule(actorId, kaynak, talep))
                .toList();

        tesisKullanilabilirlikKuraliDeposu.deleteByKaynakId(kaynakId);
        return tesisKullanilabilirlikKuraliDeposu.saveAll(kurallar);
    }

    private TesisYaniti toResponse(Tesis tesis) {
        TesisPolitikasiYaniti politikaYaniti = tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull(tesis.getId())
                .map(TesisPolitikasiYaniti::from)
                .orElse(null);

        List<TesisKaynagi> kaynaklar = tesisKaynagiDeposu.findByTesisIdAndSilinmeTarihiIsNullOrderByAdAsc(tesis.getId());
        if (kaynaklar.isEmpty()) {
            // Otomatik varsayılan kaynak oluştur
            TesisKaynagi varsayilanKaynak = TesisKaynagi.builder()
                    .tesis(tesis)
                    .kaynakKodu("DEFAULT_" + tesis.getId().substring(0, 8).toUpperCase())
                    .ad(tesis.getAd() + " Sahası / Birimi")
                    .kaynakTuru(mapFacilityTypeToResourceType(tesis.getTesisTuru()))
                    .kapasite(tesis.getKapasite())
                    .rezervasyonYapilabilir(true)
                    .durum(TesisKaynagi.KaynakDurumu.AKTIF)
                    .olusturan(tesis.getOlusturan())
                    .guncelleyen(tesis.getGuncelleyen())
                    .build();
            varsayilanKaynak = tesisKaynagiDeposu.save(varsayilanKaynak);
            kaynaklar = List.of(varsayilanKaynak);
        }

        List<TesisKaynagiYaniti> kaynakYanitlari = kaynaklar.stream()
                .map(kaynak -> TesisKaynagiYaniti.from(
                        kaynak,
                        tesisKullanilabilirlikKuraliDeposu.findByKaynakIdOrderByHaftaninGunuAscBaslangicSaatiAsc(kaynak.getId())))
                .toList();

        return TesisYaniti.from(tesis, politikaYaniti, kaynakYanitlari);
    }

    private TesisKullanilabilirlikKurali toRule(String actorId, TesisKaynagi kaynak, KullanilabilirlikKuraliTalebi talep) {
        if (talep.getHaftaninGunu() < 1 || talep.getHaftaninGunu() > 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Haftanın günü 1 ile 7 arasında olmalıdır.");
        }
        LocalTime baslangic = talep.getBaslangicSaati();
        LocalTime bitis = talep.getBitisSaati();
        if (baslangic == null || bitis == null || !baslangic.isBefore(bitis)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başlangıç saati bitiş saatinden önce olmalıdır.");
        }
        if (talep.getGecerlilikBaslangici() != null && talep.getGecerlilikBitisi() != null && talep.getGecerlilikBaslangici().isAfter(talep.getGecerlilikBitisi())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçerlilik başlangıcı bitişten sonra olamaz.");
        }

        return TesisKullanilabilirlikKurali.builder()
                .kaynak(kaynak)
                .haftaninGunu(talep.getHaftaninGunu())
                .baslangicSaati(baslangic)
                .bitisSaati(bitis)
                .gecerlilikBaslangici(talep.getGecerlilikBaslangici())
                .gecerlilikBitisi(talep.getGecerlilikBitisi())
                .durum(parseRuleStatusOrDefault(talep.getDurum(), TesisKullanilabilirlikKurali.KuralDurumu.AKTIF))
                .guncelleyen(actorId)
                .build();
    }

    private Tesis requireFacility(String tesisId) {
        return tesisDeposu.findByIdAndSilinmeTarihiIsNull(tesisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tesis bulunamadı."));
    }

    private TesisKaynagi requireResource(String kaynakId) {
        return tesisKaynagiDeposu.findByIdAndSilinmeTarihiIsNull(kaynakId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kaynak bulunamadı."));
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private int requirePositive(int value, String message) {
        if (value <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private int requireNonNegative(int value, String message) {
        if (value < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private Tesis.TesisTuru parseFacilityType(String value) {
        try {
            return Tesis.TesisTuru.valueOf(required(value, "Tesis tipi zorunludur.").toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz tesis tipi.");
        }
    }

    private TesisKaynagi.KaynakTuru parseResourceType(String value) {
        try {
            return TesisKaynagi.KaynakTuru.valueOf(required(value, "Kaynak tipi zorunludur.").toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz kaynak tipi.");
        }
    }

    private Tesis.TesisDurumu parseFacilityStatusOrDefault(String value, Tesis.TesisDurumu fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Tesis.TesisDurumu.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz tesis durumu.");
        }
    }

    private TesisKaynagi.KaynakDurumu parseResourceStatusOrDefault(String value, TesisKaynagi.KaynakDurumu fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return TesisKaynagi.KaynakDurumu.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz kaynak durumu.");
        }
    }

    private TesisKullanilabilirlikKurali.KuralDurumu parseRuleStatusOrDefault(String value, TesisKullanilabilirlikKurali.KuralDurumu fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return TesisKullanilabilirlikKurali.KuralDurumu.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz uygunluk kuralı durumu.");
        }
    }

    private TesisKaynagi.KaynakTuru mapFacilityTypeToResourceType(Tesis.TesisTuru type) {
        if (type == null) return TesisKaynagi.KaynakTuru.DIGER;
        switch (type) {
            case SPOR_ALANI: return TesisKaynagi.KaynakTuru.SPOR_ALANI;
            case CALISMA_ODASI: return TesisKaynagi.KaynakTuru.CALISMA_ODASI;
            case TOPLANTI_ODASI: return TesisKaynagi.KaynakTuru.TOPLANTI_ODASI;
            case LABORATUVAR: return TesisKaynagi.KaynakTuru.LABORATUVAR;
            default: return TesisKaynagi.KaynakTuru.DIGER;
        }
    }
}
