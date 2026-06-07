package com.isik.kampusos.kimlik.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimGuncellemeTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Sistem yöneticisi (ROLE_ADMIN) için tüm kullanıcılar/roller üzerinde CRUD.
 * Öğrenci-özel akıştan (OgrenciYonetimServisi) farklı olarak her role uygulanır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KullaniciYonetimServisi {

    private static final Set<String> IZINLI_ROLLER = Set.of(
            "ROLE_ADMIN", "ROLE_SKS_ADMIN", "ROLE_FACILITY_ADMIN", "ROLE_REGISTRAR", "ROLE_STUDENT");
    private static final SecureRandom RASTGELE = new SecureRandom();

    private final KullaniciDeposu kullaniciDeposu;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public Page<KullaniciYonetimYaniti> listele(int sayfa, int boyut, String arama, String durum, String rol) {
        String aramaNorm = (arama != null && !arama.isBlank()) ? arama.trim().toLowerCase() : null;
        String rolNorm = (rol != null && !rol.isBlank()) ? rol.trim() : null;

        KullaniciDurumu durumEnum = durumCozumle(durum);

        Specification<Kullanici> spec = (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (aramaNorm != null) {
                String desen = "%" + aramaNorm + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("ad")), desen),
                        cb.like(cb.lower(root.get("soyad")), desen),
                        cb.like(cb.lower(root.get("eposta")), desen),
                        cb.like(cb.lower(root.get("ogrenciNumarasi")), desen)));
            }
            if (durumEnum != null) {
                predicate = cb.and(predicate, cb.equal(root.get("durum"), durumEnum));
            }
            if (rolNorm != null) {
                predicate = cb.and(predicate, cb.like(root.get("roller"), "%" + rolNorm + "%"));
            }
            query.orderBy(cb.desc(root.get("olusturulmaTarihi")));
            return predicate;
        };

        return kullaniciDeposu.findAll(spec, PageRequest.of(sayfa, boyut)).map(this::yanitOlustur);
    }

    public KullaniciYonetimYaniti getir(String id) {
        return yanitOlustur(bul(id));
    }

    @Transactional
    public KullaniciYonetimYaniti olustur(KullaniciYonetimOlusturmaTalebi talep) {
        if (talep.getEposta() == null || talep.getEposta().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-posta zorunludur.");
        }
        String eposta = talep.getEposta().trim().toLowerCase();
        rolDogrula(talep.getRoller());
        if (kullaniciDeposu.existsByEposta(eposta)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu e-posta ile bir hesap zaten mevcut.");
        }

        boolean uretilmis = talep.getGeciciSifre() == null || talep.getGeciciSifre().isBlank();
        String geciciSifre = uretilmis ? geciciSifreUret() : talep.getGeciciSifre();

        Kullanici kullanici = Kullanici.builder()
                .eposta(eposta)
                .sifre(passwordEncoder.encode(geciciSifre))
                .roller(talep.getRoller().trim())
                .ad(talep.getAd())
                .soyad(talep.getSoyad())
                .fakulte(talep.getFakulte())
                .bolum(talep.getBolum())
                .durum(KullaniciDurumu.AKTIF)
                .epostaDogrulandi(true)   // yönetici tarafından oluşturulan hesap doğrulama akışını atlar
                .sifreDegistirmeli(true)  // ilk girişte şifre değiştirme zorunlu
                .build();

        Kullanici kaydedilen = kullaniciDeposu.save(kullanici);
        profilOlusturmaOlayiYayinla(kaydedilen);
        log.info("Yönetici yeni kullanıcı oluşturdu: {} ({})", kaydedilen.getEposta(), kaydedilen.getRoller());

        KullaniciYonetimYaniti yanit = yanitOlustur(kaydedilen);
        if (uretilmis) {
            yanit.setGeciciSifre(geciciSifre);
        }
        return yanit;
    }

    @Transactional
    public KullaniciYonetimYaniti guncelle(String id, KullaniciYonetimGuncellemeTalebi talep) {
        Kullanici kullanici = bul(id);

        if (talep.getRoller() != null && !talep.getRoller().isBlank()) {
            rolDogrula(talep.getRoller());
            // Son aktif admin'in admin rolü elinden alınamaz
            if (kullanici.getRoller() != null && kullanici.getRoller().contains("ROLE_ADMIN")
                    && !talep.getRoller().contains("ROLE_ADMIN")) {
                sonAktifAdminKorumasi(kullanici);
            }
            kullanici.setRoller(talep.getRoller().trim());
        }
        if (talep.getAd() != null) kullanici.setAd(talep.getAd());
        if (talep.getSoyad() != null) kullanici.setSoyad(talep.getSoyad());
        if (talep.getFakulte() != null) kullanici.setFakulte(talep.getFakulte());
        if (talep.getBolum() != null) kullanici.setBolum(talep.getBolum());
        if (talep.getDurum() != null && !talep.getDurum().isBlank()) {
            KullaniciDurumu yeniDurum = durumCozumle(talep.getDurum());
            if (yeniDurum != KullaniciDurumu.AKTIF) {
                sonAktifAdminKorumasi(kullanici);
            }
            kullanici.setDurum(yeniDurum);
        }

        return yanitOlustur(kullaniciDeposu.save(kullanici));
    }

    @Transactional
    public Map<String, String> sifreSifirla(String id) {
        Kullanici kullanici = bul(id);
        String yeniSifre = geciciSifreUret();
        kullanici.setSifre(passwordEncoder.encode(yeniSifre));
        kullanici.setSifreDegistirmeli(true);
        kullaniciDeposu.save(kullanici);
        return Map.of("geciciSifre", yeniSifre, "mesaj", "Şifre sıfırlandı. Kullanıcı ilk girişte değiştirecek.");
    }

    @Transactional
    public void sil(String id) {
        Kullanici kullanici = bul(id);
        sonAktifAdminKorumasi(kullanici);
        kullaniciDeposu.delete(kullanici);
        log.info("Yönetici kullanıcıyı sildi: {} ({})", kullanici.getEposta(), kullanici.getRoller());
    }

    // --- yardımcılar ---

    private Kullanici bul(String id) {
        return kullaniciDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));
    }

    private void rolDogrula(String roller) {
        if (roller == null || roller.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol zorunludur.");
        }
        for (String rol : roller.split(",")) {
            if (!IZINLI_ROLLER.contains(rol.trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz rol: " + rol.trim());
            }
        }
    }

    private void sonAktifAdminKorumasi(Kullanici hedef) {
        if (hedef.getRoller() == null || !hedef.getRoller().contains("ROLE_ADMIN")) {
            return;
        }
        long aktifAdminSayisi = kullaniciDeposu.countByRollerContainingAndDurum("ROLE_ADMIN", KullaniciDurumu.AKTIF);
        if (aktifAdminSayisi <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sistemdeki son aktif yöneticiyi silemez/pasifleştiremez veya rolünü değiştiremezsiniz.");
        }
    }

    private KullaniciDurumu durumCozumle(String durum) {
        if (durum == null || durum.isBlank()) return null;
        try {
            return KullaniciDurumu.valueOf(durum.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz durum: " + durum);
        }
    }

    private String geciciSifreUret() {
        String harfler = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
        String rakamlar = "23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) sb.append(harfler.charAt(RASTGELE.nextInt(harfler.length())));
        for (int i = 0; i < 3; i++) sb.append(rakamlar.charAt(RASTGELE.nextInt(rakamlar.length())));
        sb.append('!');
        return sb.toString();
    }

    private void profilOlusturmaOlayiYayinla(Kullanici kullanici) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("kullaniciId", kullanici.getId());
            payload.put("eposta", kullanici.getEposta());
            payload.put("ad", kullanici.getAd());
            payload.put("soyad", kullanici.getSoyad());
            payload.put("ogrenciNumarasi", kullanici.getOgrenciNumarasi());
            payload.put("tcKimlikMaskeli", kullanici.getTcKimlikMaskeli());
            kafkaTemplate.send("kullanici.kaydedildi", kullanici.getId(), objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.warn("Kafka event gönderilemedi (kullanici.kaydedildi): {}", e.getMessage());
        }
    }

    private KullaniciYonetimYaniti yanitOlustur(Kullanici k) {
        return KullaniciYonetimYaniti.builder()
                .id(k.getId())
                .eposta(k.getEposta())
                .roller(k.getRoller())
                .ad(k.getAd())
                .soyad(k.getSoyad())
                .ogrenciNumarasi(k.getOgrenciNumarasi())
                .fakulte(k.getFakulte())
                .bolum(k.getBolum())
                .kayitYili(k.getKayitYili())
                .tcKimlikMaskeli(k.getTcKimlikMaskeli())
                .durum(k.getDurum() != null ? k.getDurum().name() : null)
                .epostaDogrulandi(k.isEpostaDogrulandi())
                .sifreDegistirmeli(k.isSifreDegistirmeli())
                .sonGirisTarihi(k.getSonGirisTarihi())
                .olusturulmaTarihi(k.getOlusturulmaTarihi())
                .guncellenmeTarihi(k.getGuncellenmeTarihi())
                .build();
    }
}
