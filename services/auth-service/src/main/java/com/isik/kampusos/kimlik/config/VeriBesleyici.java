package com.isik.kampusos.kimlik.config;
 
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
 
@Component
@Profile("dev")  // Yalnızca 'dev' profilinde çalışır
@RequiredArgsConstructor
@Slf4j
public class VeriBesleyici implements CommandLineRunner {
 
    private final KullaniciDeposu kullaniciDeposu;
    private final PasswordEncoder passwordEncoder;
 
    @Override
    public void run(String... args) {
        // Öğrenci İşleri hesabı
        if (!kullaniciDeposu.existsByEposta("ogrenci.isleri@isikun.edu.tr")) {
            Kullanici registrar = Kullanici.builder()
                    .eposta("ogrenci.isleri@isikun.edu.tr")
                    .sifre(passwordEncoder.encode("Admin123!"))
                    .roller("ROLE_REGISTRAR")
                    .ad("Öğrenci")
                    .soyad("İşleri")
                    .durum(KullaniciDurumu.AKTIF)
                    .epostaDogrulandi(true)
                    .sifreDegistirmeli(false)
                    .build();
            kullaniciDeposu.save(registrar);
            log.info("✅ Seed: Öğrenci İşleri hesabı oluşturuldu — ogrenci.isleri@isikun.edu.tr / Admin123!");
        }
 
        // Sistem Admin hesabı
        if (!kullaniciDeposu.existsByEposta("admin@isikun.edu.tr")) {
            Kullanici admin = Kullanici.builder()
                    .eposta("admin@isikun.edu.tr")
                    .sifre(passwordEncoder.encode("Admin123!"))
                    .roller("ROLE_ADMIN")
                    .ad("Sistem")
                    .soyad("Yöneticisi")
                    .durum(KullaniciDurumu.AKTIF)
                    .epostaDogrulandi(true)
                    .sifreDegistirmeli(false)
                    .build();
            kullaniciDeposu.save(admin);
            log.info("✅ Seed: Sistem Admin hesabı oluşturuldu — admin@isikun.edu.tr / Admin123!");
        }
 
        // SKS yöneticisi hesabı
        kullaniciDeposu.findByEposta("odul.celep@isik.edu.tr").ifPresent(wrongDomainUser -> {
            wrongDomainUser.setEposta("odul.celep@isikun.edu.tr");
            wrongDomainUser.setSifre(passwordEncoder.encode("odul.celep"));
            wrongDomainUser.setRoller("ROLE_SKS_ADMIN");
            wrongDomainUser.setAd("Ödül");
            wrongDomainUser.setSoyad("Celep");
            wrongDomainUser.setDurum(KullaniciDurumu.AKTIF);
            wrongDomainUser.setEpostaDogrulandi(true);
            wrongDomainUser.setSifreDegistirmeli(false);
            kullaniciDeposu.save(wrongDomainUser);
            log.info("✅ Seed: SKS yöneticisi e-postası personel formatına taşındı — odul.celep@isikun.edu.tr");
        });
 
        if (!kullaniciDeposu.existsByEposta("odul.celep@isikun.edu.tr")) {
            Kullanici sksAdmin = Kullanici.builder()
                    .eposta("odul.celep@isikun.edu.tr")
                    .sifre(passwordEncoder.encode("odul.celep"))
                    .roller("ROLE_SKS_ADMIN")
                    .ad("Ödül")
                    .soyad("Celep")
                    .durum(KullaniciDurumu.AKTIF)
                    .epostaDogrulandi(true)
                    .sifreDegistirmeli(false)
                    .build();
            kullaniciDeposu.save(sksAdmin);
            log.info("✅ Seed: SKS yöneticisi hesabı oluşturuldu — odul.celep@isikun.edu.tr / odul.celep");
        }
 
        // Spor Müdürü — spor tesisleri rezervasyon yönetimi için gerçek görevli hesabı.
        kullaniciDeposu.findByEposta("tesis.yonetimi@isikun.edu.tr").ifPresent(legacyFacilityAdmin -> {
            if (!kullaniciDeposu.existsByEposta("atakan.cetiner@isikun.edu.tr")) {
                legacyFacilityAdmin.setEposta("atakan.cetiner@isikun.edu.tr");
                legacyFacilityAdmin.setSifre(passwordEncoder.encode("atakan.cetiner"));
                legacyFacilityAdmin.setRoller("ROLE_FACILITY_ADMIN");
                legacyFacilityAdmin.setAd("Atakan");
                legacyFacilityAdmin.setSoyad("Çetiner");
                legacyFacilityAdmin.setFakulte("İdari Birimler");
                legacyFacilityAdmin.setBolum("Spor Müdürlüğü");
                legacyFacilityAdmin.setDurum(KullaniciDurumu.AKTIF);
                legacyFacilityAdmin.setEpostaDogrulandi(true);
                legacyFacilityAdmin.setSifreDegistirmeli(false);
                kullaniciDeposu.save(legacyFacilityAdmin);
                log.info("✅ Seed: Tesis yöneticisi hesabı Spor Müdürü Atakan Çetiner'e taşındı — atakan.cetiner@isikun.edu.tr");
            }
        });
 
        if (!kullaniciDeposu.existsByEposta("atakan.cetiner@isikun.edu.tr")) {
            Kullanici facilityAdmin = Kullanici.builder()
                    .eposta("atakan.cetiner@isikun.edu.tr")
                    .sifre(passwordEncoder.encode("atakan.cetiner"))
                    .roller("ROLE_FACILITY_ADMIN")
                    .ad("Atakan")
                    .soyad("Çetiner")
                    .fakulte("İdari Birimler")
                    .bolum("Spor Müdürlüğü")
                    .durum(KullaniciDurumu.AKTIF)
                    .epostaDogrulandi(true)
                    .sifreDegistirmeli(false)
                    .build();
            kullaniciDeposu.save(facilityAdmin);
            log.info("✅ Seed: Spor Müdürü hesabı oluşturuldu — atakan.cetiner@isikun.edu.tr / atakan.cetiner");
        }
 
 
        // Özlem Ak — Öğrenci İşleri Daire Başkanlığı personeli
        if (!kullaniciDeposu.existsByEposta("ozlem.ak@isikun.edu.tr")) {
            Kullanici ozlemAk = Kullanici.builder()
                    .eposta("ozlem.ak@isikun.edu.tr")
                    .sifre(passwordEncoder.encode("12345678901")) // TC Kimlik No
                    .roller("ROLE_REGISTRAR")
                    .ad("Özlem")
                    .soyad("Ak")
                    .durum(KullaniciDurumu.AKTIF)
                    .epostaDogrulandi(true)
                    .sifreDegistirmeli(true)
                    .build();
            kullaniciDeposu.save(ozlemAk);
            log.info("✅ Seed: Özlem Ak hesabı oluşturuldu — ozlem.ak@isikun.edu.tr / TC: 12345678901");
        }
    }
}
