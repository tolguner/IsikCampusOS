package com.isik.kampusos.tesis.service;

import com.isik.kampusos.tesis.dto.*;
import com.isik.kampusos.tesis.model.*;
import com.isik.kampusos.tesis.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TesisRezervasyonServisi {

    private final TesisRezervasyonDeposu tesisRezervasyonDeposu;
    private final TesisKaynagiDeposu tesisKaynagiDeposu;
    private final TesisPolitikasiDeposu tesisPolitikasiDeposu;
    private final TesisKullanilabilirlikKuraliDeposu tesisKullanilabilirlikKuraliDeposu;

    /**
     * İki zaman aralığının çakışıp çakışmadığını belirler (yarı-açık aralık mantığı:
     * bir aralığın bitişi diğerinin başlangıcına eşitse çakışma yoktur).
     * Birim testlerle doğrulanabilmesi için saf (yan etkisiz) tutulmuştur.
     */
    static boolean zamanlarCakisiyorMu(OffsetDateTime baslangic, OffsetDateTime bitis,
                                       OffsetDateTime mevcutBaslangic, OffsetDateTime mevcutBitis) {
        return baslangic.isBefore(mevcutBitis) && bitis.isAfter(mevcutBaslangic);
    }

    public List<TesisRezervasyonYaniti> listMyBookings(String kullaniciId) {
        return tesisRezervasyonDeposu.findByRezervasyonYapanKullaniciIdOrderByBaslangicTarihiDesc(kullaniciId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TesisRezervasyonYaniti> listAllBookings() {
        return tesisRezervasyonDeposu.findAllByOrderByBaslangicTarihiDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public TesisRezervasyonYaniti createBooking(String kullaniciId, TesisRezervasyonTalebi talep) {
        TesisKaynagi kaynak = tesisKaynagiDeposu.findByIdAndSilinmeTarihiIsNull(talep.getKaynakId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kaynak bulunamadı."));

        if (!kaynak.isRezervasyonYapilabilir() || kaynak.getDurum() != TesisKaynagi.KaynakDurumu.AKTIF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu kaynak şu anda rezervasyona açık değil.");
        }

        OffsetDateTime start = talep.getBaslangicTarihi();
        OffsetDateTime end = talep.getBitisTarihi();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başlangıç zamanı bitiş zamanından önce olmalıdır.");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (start.isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçmiş bir zaman dilimine rezervasyon yapılamaz.");
        }

        // Get policy or default
        TesisPolitikasi politika = tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull(kaynak.getTesis().getId())
                .orElse(getDefaultPolicy(kaynak.getTesis()));

        // 1. Booking window check (e.g. max 14 days in advance)
        OffsetDateTime maxAdvanceDate = now.plusDays(politika.getRezervasyonPenceresiGun());
        if (start.isAfter(maxAdvanceDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("En fazla %d gün önceden rezervasyon yapabilirsiniz.", politika.getRezervasyonPenceresiGun()));
        }

        // 2. Minimum notice check
        OffsetDateTime minNoticeDate = now.plusMinutes(politika.getMinimumBildirimDakika());
        if (start.isBefore(minNoticeDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("Rezervasyon başlangıcına en az %d dakika kala rezervasyon yapmalısınız.", politika.getMinimumBildirimDakika()));
        }

        // 3. Max booking duration check
        long durationMinutes = Duration.between(start, end).toMinutes();
        if (durationMinutes > politika.getMaksimumRezervasyonSureDakika()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("Tek seferde en fazla %d dakikalık rezervasyon yapabilirsiniz.", politika.getMaksimumRezervasyonSureDakika()));
        }

        // 5. Çalışma saatleri (müsaitlik kuralları) kontrolü
        List<TesisKullanilabilirlikKurali> kurallar = tesisKullanilabilirlikKuraliDeposu.findByKaynakIdOrderByHaftaninGunuAscBaslangicSaatiAsc(kaynak.getId());
        
        int bookingDayOfWeek = start.getDayOfWeek().getValue(); // Monday=1, Sunday=7
        java.time.LocalTime bookingStartLocal = start.toLocalTime();
        java.time.LocalTime bookingEndLocal = end.toLocalTime();

        List<TesisKullanilabilirlikKurali> gunKurallari = kurallar.stream()
                .filter(k -> k.getHaftaninGunu() == bookingDayOfWeek && k.getDurum() == TesisKullanilabilirlikKurali.KuralDurumu.AKTIF)
                .toList();

        if (gunKurallari.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tesis seçtiğiniz günde kapalıdır.");
        }

        boolean fitsInWorkingHours = gunKurallari.stream().anyMatch(kural -> 
                !bookingStartLocal.isBefore(kural.getBaslangicSaati()) && !bookingEndLocal.isAfter(kural.getBitisSaati()));

        if (!fitsInWorkingHours) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Seçtiğiniz saatler tesisin çalışma saatleri (müsaitlik aralığı) dışındadır.");
        }

        // 4. Overlap check
        List<TesisRezervasyon> aktifRezervasyonlar = tesisRezervasyonDeposu.findByKaynakIdAndDurumIn(
                kaynak.getId(), List.of(TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE, TesisRezervasyon.RezervasyonDurumu.ONAYLANDI, TesisRezervasyon.RezervasyonDurumu.BLOKE));
        
        boolean hasOverlap = aktifRezervasyonlar.stream().anyMatch(existing ->
                zamanlarCakisiyorMu(start, end, existing.getBaslangicTarihi(), existing.getBitisTarihi()));

        if (hasOverlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seçtiğiniz zaman diliminde kaynak zaten dolu.");
        }

        // 6. Maksimum aktif rezervasyon limiti (Aynı kullanıcının toplamda en fazla 3 aktif/bekleyen rezervasyonu olabilir)
        List<TesisRezervasyon.RezervasyonDurumu> aktifDurumlar = List.of(
                TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE,
                TesisRezervasyon.RezervasyonDurumu.ONAYLANDI
        );
        long toplamAktifSayisi = tesisRezervasyonDeposu.findByRezervasyonYapanKullaniciIdOrderByBaslangicTarihiDesc(kullaniciId).stream()
                .filter(r -> aktifDurumlar.contains(r.getDurum()))
                .count();

        if (toplamAktifSayisi >= 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Sistemde zaten 3 adet aktif veya onay bekleyen rezervasyonunuz bulunmaktadır. Yeni rezervasyon yapabilmek için mevcut rezervasyonlarınızın tamamlanmasını beklemeli veya iptal etmelisiniz.");
        }

        // 7. Günlük rezervasyon limiti (Bir öğrenci aynı gün içinde aynı kaynak için yalnızca 1 rezervasyon yapabilir)
        OffsetDateTime startOfDay = start.withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime endOfDay = start.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        long gunlukAyniKaynakRezervasyonSayisi = tesisRezervasyonDeposu.findByRezervasyonYapanKullaniciIdOrderByBaslangicTarihiDesc(kullaniciId).stream()
                .filter(r -> aktifDurumlar.contains(r.getDurum()) 
                        && r.getKaynak().getId().equals(kaynak.getId())
                        && !r.getBaslangicTarihi().isBefore(startOfDay)
                        && !r.getBaslangicTarihi().isAfter(endOfDay))
                .count();

        if (gunlukAyniKaynakRezervasyonSayisi >= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Bu tesis kaynağı için aynı gün içerisinde birden fazla rezervasyon yapamazsınız.");
        }

        TesisRezervasyon rezervasyon = TesisRezervasyon.builder()
                .kaynak(kaynak)
                .rezervasyonYapanKullaniciId(kullaniciId)
                .baslangicTarihi(start)
                .bitisTarihi(end)
                .amac(talep.getAmac())
                .katilimciSayisi(talep.getKatilimciSayisi() > 0 ? talep.getKatilimciSayisi() : 1)
                // Onay mekanizması: politika onay gerektiriyorsa BEKLEMEDE, aksi halde anında ONAYLANDI.
                .durum(politika.isOnayGerekli()
                        ? TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE
                        : TesisRezervasyon.RezervasyonDurumu.ONAYLANDI)
                .build();

        TesisRezervasyon saved = tesisRezervasyonDeposu.save(rezervasyon);
        return toResponse(saved);
    }

    public TesisRezervasyonYaniti cancelBooking(String kullaniciId, String roller, String rezervasyonId, String neden) {
        TesisRezervasyon rezervasyon = tesisRezervasyonDeposu.findById(rezervasyonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rezervasyon bulunamadı."));

        boolean isAdmin = roller != null && (roller.contains("ROLE_ADMIN") || roller.contains("ROLE_FACILITY_ADMIN"));
        boolean isOwner = rezervasyon.getRezervasyonYapanKullaniciId().equals(kullaniciId);

        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu rezervasyonu iptal etmeye yetkiniz yok.");
        }

        if (rezervasyon.getDurum() == TesisRezervasyon.RezervasyonDurumu.IPTAL_EDILDI) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rezervasyon zaten iptal edilmiş durumda.");
        }

        if (rezervasyon.getDurum() == TesisRezervasyon.RezervasyonDurumu.TAMAMLANDI || 
                rezervasyon.getDurum() == TesisRezervasyon.RezervasyonDurumu.GELMEDI) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tamamlanmış veya kullanılmamış rezervasyonlar iptal edilemez.");
        }

        TesisPolitikasi politika = tesisPolitikasiDeposu.findByTesisIdAndSilinmeTarihiIsNull(rezervasyon.getKaynak().getTesis().getId())
                .orElse(getDefaultPolicy(rezervasyon.getKaynak().getTesis()));

        OffsetDateTime now = OffsetDateTime.now();
        // Admin can bypass cancellation deadline policy
        if (!isAdmin) {
            OffsetDateTime cancellationDeadline = rezervasyon.getBaslangicTarihi().minusMinutes(politika.getIptalLimitDakika());
            if (now.isAfter(cancellationDeadline)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        String.format("İptal süresi dolmuştur. Rezervasyon başlangıcından en az %d dakika önce iptal etmelisiniz.", 
                                politika.getIptalLimitDakika()));
            }
        }

        rezervasyon.setDurum(TesisRezervasyon.RezervasyonDurumu.IPTAL_EDILDI);
        rezervasyon.setIptalEdilmeTarihi(now);
        rezervasyon.setIptalNedeni(neden != null && !neden.isBlank() ? neden : "Kullanıcı tarafından iptal edildi.");
        
        TesisRezervasyon saved = tesisRezervasyonDeposu.save(rezervasyon);
        return toResponse(saved);
    }

    public TesisRezervasyonYaniti updateBookingStatus(String actorId, String rezervasyonId, String durumStr) {
        TesisRezervasyon rezervasyon = tesisRezervasyonDeposu.findById(rezervasyonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rezervasyon bulunamadı."));

        TesisRezervasyon.RezervasyonDurumu durum;
        try {
            durum = TesisRezervasyon.RezervasyonDurumu.valueOf(durumStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz rezervasyon durumu.");
        }

        rezervasyon.setDurum(durum);
        if (durum == TesisRezervasyon.RezervasyonDurumu.GELMEDI) {
            rezervasyon.setGelmemeTarihi(OffsetDateTime.now());
        } else if (durum == TesisRezervasyon.RezervasyonDurumu.IPTAL_EDILDI) {
            rezervasyon.setIptalEdilmeTarihi(OffsetDateTime.now());
            rezervasyon.setIptalNedeni("Yönetici tarafından iptal edildi.");
        }

        TesisRezervasyon saved = tesisRezervasyonDeposu.save(rezervasyon);
        return toResponse(saved);
    }

    public List<TesisRezervasyonYaniti> listCalendarBookings(String kaynakId, OffsetDateTime start, OffsetDateTime end) {
        return tesisRezervasyonDeposu.findCalendarBookings(
                kaynakId, start, end,
                List.of(TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE, TesisRezervasyon.RezervasyonDurumu.ONAYLANDI, TesisRezervasyon.RezervasyonDurumu.BLOKE)
        ).stream()
                .map(this::toResponse)
                .toList();
    }

    public TesisRezervasyonYaniti createBlockedSlot(String actorId, TesisRezervasyonTalebi talep) {
        TesisKaynagi kaynak = tesisKaynagiDeposu.findByIdAndSilinmeTarihiIsNull(talep.getKaynakId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kaynak bulunamadı."));

        OffsetDateTime start = talep.getBaslangicTarihi();
        OffsetDateTime end = talep.getBitisTarihi();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başlangıç zamanı bitiş zamanından önce olmalıdır.");
        }

        if (start.isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçmiş bir zaman dilimine antrenman/bloke tanımlanamaz.");
        }

        // Overlap check
        List<TesisRezervasyon> activeBookings = tesisRezervasyonDeposu.findByKaynakIdAndDurumIn(
                kaynak.getId(), List.of(TesisRezervasyon.RezervasyonDurumu.BEKLEMEDE, TesisRezervasyon.RezervasyonDurumu.ONAYLANDI, TesisRezervasyon.RezervasyonDurumu.BLOKE));
        
        boolean hasOverlap = activeBookings.stream().anyMatch(existing -> 
                start.isBefore(existing.getBitisTarihi()) && end.isAfter(existing.getBaslangicTarihi()));

        if (hasOverlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seçtiğiniz zaman diliminde kaynak zaten dolu.");
        }

        TesisRezervasyon rezervasyon = TesisRezervasyon.builder()
                .kaynak(kaynak)
                .rezervasyonYapanKullaniciId(actorId)
                .baslangicTarihi(start)
                .bitisTarihi(end)
                .amac(talep.getAmac() != null ? talep.getAmac() : "Takım Antrenmanı / Bloke Saat")
                .katilimciSayisi(talep.getKatilimciSayisi() > 0 ? talep.getKatilimciSayisi() : 1)
                .durum(TesisRezervasyon.RezervasyonDurumu.BLOKE)
                .tekrarGrupId(talep.getTekrarGrupId())
                .build();

        TesisRezervasyon saved = tesisRezervasyonDeposu.save(rezervasyon);
        return toResponse(saved);
    }

    private TesisRezervasyonYaniti toResponse(TesisRezervasyon rezervasyon) {
        return TesisRezervasyonYaniti.from(rezervasyon);
    }

    private TesisPolitikasi getDefaultPolicy(Tesis tesis) {
        return TesisPolitikasi.builder()
                .tesis(tesis)
                .rezervasyonPenceresiGun(14)
                .minimumBildirimDakika(0)
                .iptalLimitDakika(30)
                .yoklamaZorunlu(false)
                .otomatikGelmemeDakika(0)
                .maksimumRezervasyonSureDakika(120)
                .onayGerekli(false)
                .durum(TesisPolitikasi.PolitikaDurumu.AKTIF)
                .build();
    }
}
