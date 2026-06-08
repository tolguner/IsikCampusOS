package com.isik.kampusos.kimlik.service;
 
import com.isik.kampusos.kimlik.dto.*;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.model.DogrulamaKodu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import com.isik.kampusos.kimlik.repository.DogrulamaKoduDeposu;
import com.isik.kampusos.kimlik.util.JwtSaglayici;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
 
import java.time.LocalDateTime;
import java.util.Random;
 
@Service
@RequiredArgsConstructor
public class KimlikServisi {
 
    private final KullaniciDeposu kullaniciDeposu;
    private final DogrulamaKoduDeposu dogrulamaKoduDeposu;
    private final PasswordEncoder passwordEncoder;
    private final JwtSaglayici jwtSaglayici;
    private final EpostaServisi epostaServisi;
 
    public KimlikYaniti girisYap(GirisIstegi request) {
        Kullanici kullanici = kullaniciDeposu.findByEposta(request.getEposta())
                .orElseThrow(() -> new RuntimeException("Geçersiz e-posta veya şifre."));
 
        if (kullanici.getDurum() != KullaniciDurumu.AKTIF) {
            String mesaj = switch (kullanici.getDurum()) {
                case PASIF -> "Hesabınız geçici olarak askıya alınmıştır. Öğrenci İşleri ile iletişime geçin.";
                case MEZUN -> "Mezuniyet durumunuz nedeniyle hesabınız kapatılmıştır.";
                case ILISIGI_KESILMIS -> "Hesabınız ilişiği kesme nedeniyle kapatılmıştır.";
                default -> "Hesabınız aktif değil.";
            };
            throw new RuntimeException(mesaj);
        }
 
        if (!passwordEncoder.matches(request.getSifre(), kullanici.getSifre())) {
            throw new RuntimeException("Geçersiz e-posta veya şifre.");
        }
 
        kullanici.setSonGirisTarihi(LocalDateTime.now());
        kullaniciDeposu.save(kullanici);
 
        String token = jwtSaglayici.tokenUret(kullanici);
 
        return new KimlikYaniti(
                token,
                kullanici.getId(),
                kullanici.getEposta(),
                kullanici.getRoller(),
                kullanici.getTamAd(),
                kullanici.getAd(),
                kullanici.getSoyad(),
                kullanici.getFakulte(),
                kullanici.getBolum(),
                kullanici.getKayitYili(),
                kullanici.getOgrenciNumarasi(),
                kullanici.getTcKimlikMaskeli(),
                kullanici.isSifreDegistirmeli(),
                kullanici.isEpostaDogrulandi(),
                kullanici.getDurum().name()
        );
    }
 
    @Transactional
    public void sifreDegistir(String kullaniciId, SifreDegistirmeIstegi request) {
        Kullanici kullanici = kullaniciDeposu.findById(kullaniciId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
 
        if (!passwordEncoder.matches(request.getEskiSifre(), kullanici.getSifre())) {
            throw new RuntimeException("Mevcut şifreniz hatalı.");
        }
 
        if (request.getYeniSifre().length() < 6) {
            throw new RuntimeException("Yeni şifre en az 6 karakter olmalıdır.");
        }
 
        kullanici.setSifre(passwordEncoder.encode(request.getYeniSifre()));
        kullanici.setSifreDegistirmeli(false);
        kullaniciDeposu.save(kullanici);
    }
 
    @Transactional
    public void sifremiUnuttum(SifremiUnuttumIstegi request) {
        Kullanici kullanici = kullaniciDeposu.findByEposta(request.getEposta())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı."));

        String kod = kodUret();
 
        DogrulamaKodu dk = DogrulamaKodu.builder()
                .kullaniciId(kullanici.getId())
                .eposta(kullanici.getEposta())
                .kod(kod)
                .kodTuru("PASSWORD_RESET")
                .sonKullanmaTarihi(LocalDateTime.now().plusMinutes(15))
                .kullanildi(false)
                .build();
 
        dogrulamaKoduDeposu.save(dk);
        epostaServisi.sifreSifirlamaKoduGonder(kullanici.getEposta(), kod, 15);
    }
 
    @Transactional
    public void sifreSifirla(SifreSifirlamaIstegi request) {
        DogrulamaKodu dk = dogrulamaKoduDeposu
                .findByEpostaAndKodAndKodTuruAndKullanildiFalse(request.getEposta(), request.getKod(), "PASSWORD_RESET")
                .orElseThrow(() -> new RuntimeException("Geçersiz veya süresi dolmuş kod."));
 
        if (dk.getSonKullanmaTarihi().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kodun süresi dolmuş. Lütfen yeni bir kod talep edin.");
        }
 
        if (request.getYeniSifre().length() < 6) {
            throw new RuntimeException("Yeni şifre en az 6 karakter olmalıdır.");
        }
 
        Kullanici kullanici = kullaniciDeposu.findByEposta(request.getEposta())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
 
        kullanici.setSifre(passwordEncoder.encode(request.getYeniSifre()));
        kullanici.setSifreDegistirmeli(false);
        kullaniciDeposu.save(kullanici);
 
        dk.setKullanildi(true);
        dogrulamaKoduDeposu.save(dk);
    }
 
    @Transactional
    public void dogrulamaKoduGonder(String kullaniciId) {
        Kullanici kullanici = kullaniciDeposu.findById(kullaniciId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
 
        if (kullanici.isEpostaDogrulandi()) {
            throw new RuntimeException("E-posta zaten doğrulanmış.");
        }
 
        // Son 1 dakika içinde gönderilmiş aktif bir kod var mı kontrol et (çift mail/spam engelleme)
        java.util.Optional<DogrulamaKodu> sonKodOpt = dogrulamaKoduDeposu
                .findFirstByKullaniciIdAndKodTuruAndKullanildiFalseOrderByOlusturulmaTarihiDesc(
                        kullanici.getId(), "EMAIL_VERIFICATION");

        if (sonKodOpt.isPresent()) {
            DogrulamaKodu sonKod = sonKodOpt.get();
            LocalDateTime olusturulma = sonKod.getOlusturulmaTarihi();
            if (olusturulma != null && olusturulma.isAfter(LocalDateTime.now().minusMinutes(1))) {
                // Son 1 dakika içinde kod zaten gönderilmiş, yeni kod üretme ve gönderme
                return;
            }
        }

        String kod = kodUret();
 
        DogrulamaKodu dk = DogrulamaKodu.builder()
                .kullaniciId(kullanici.getId())
                .eposta(kullanici.getEposta())
                .kod(kod)
                .kodTuru("EMAIL_VERIFICATION")
                .sonKullanmaTarihi(LocalDateTime.now().plusMinutes(10))
                .kullanildi(false)
                .build();
 
        dogrulamaKoduDeposu.save(dk);
        epostaServisi.epostaDogrulamaKoduGonder(kullanici.getEposta(), kod, 10);
    }
 
    @Transactional
    public void epostaDogrula(EpostaDogrulamaIstegi request) {
        DogrulamaKodu dk = dogrulamaKoduDeposu
                .findByEpostaAndKodAndKodTuruAndKullanildiFalse(request.getEposta(), request.getKod(), "EMAIL_VERIFICATION")
                .orElseThrow(() -> new RuntimeException("Geçersiz veya süresi dolmuş doğrulama kodu."));
 
        if (dk.getSonKullanmaTarihi().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin.");
        }
 
        Kullanici kullanici = kullaniciDeposu.findByEposta(request.getEposta())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
 
        kullanici.setEpostaDogrulandi(true);
        kullaniciDeposu.save(kullanici);
 
        dk.setKullanildi(true);
        dogrulamaKoduDeposu.save(dk);
    }
 
    private String kodUret() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
