package com.isik.kampusos.kimlik.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kimlik.dto.KullaniciDenetimYaniti;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimGuncellemeTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDenetimGunlugu;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.KullaniciDenetimGunluguDeposu;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Sistem yöneticisi (ROLE_ADMIN) için PERSONEL kullanıcıları/rolleri üzerinde CRUD.
 * Öğrenciler kapsam DIŞIDIR — öğrenci CRUD'u ROLE_REGISTRAR'a (Öğrenci İşleri) aittir.
 * Tüm işlemler denetim günlüğüne (auth_db) yazılır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KullaniciYonetimServisi {

    /** Sistem yöneticisinin yönetebildiği roller — öğrenci HARİÇ. */
    private static final Set<String> IZINLI_ROLLER = Set.of(
            "ROLE_ADMIN", "ROLE_SKS_ADMIN", "ROLE_FACILITY_ADMIN", "ROLE_REGISTRAR");
    /** Personel için izinli durumlar — MEZUN/ILISIGI_KESILMIS yalnızca öğrencilere özgüdür. */
    private static final Set<KullaniciDurumu> IZINLI_DURUMLAR = Set.of(KullaniciDurumu.AKTIF, KullaniciDurumu.PASIF);

    private final KullaniciDeposu kullaniciDeposu;
    private final KullaniciDenetimGunluguDeposu denetimDeposu;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public Page<KullaniciYonetimYaniti> listele(int sayfa, int boyut, String arama, String durum, String rol) {
        String aramaNorm = (arama != null && !arama.isBlank()) ? arama.trim().toLowerCase() : null;
        String rolNorm = (rol != null && !rol.isBlank()) ? rol.trim() : null;
        KullaniciDurumu durumEnum = durumCozumle(durum);

        Specification<Kullanici> spec = (root, query, cb) -> {
            // Öğrenciler hariç (personel paneli)
            var predicate = cb.notLike(root.get("roller"), "%ROLE_STUDENT%");
            if (aramaNorm != null) {
                String desen = "%" + aramaNorm + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("ad")), desen),
                        cb.like(cb.lower(root.get("soyad")), desen),
                        cb.like(cb.lower(root.get("eposta")), desen)));
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
        return yanitOlustur(personelBul(id));
    }

    @Transactional
    public KullaniciYonetimYaniti olustur(KullaniciYonetimOlusturmaTalebi talep, String yapanId) {
        if (talep.getEposta() == null || talep.getEposta().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-posta zorunludur.");
        }
        rolDogrula(talep.getRoller());
        tcDogrula(talep.getTcKimlikNo());

        String eposta = talep.getEposta().trim().toLowerCase();
        if (kullaniciDeposu.existsByEposta(eposta)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu e-posta ile bir hesap zaten mevcut.");
        }

        Kullanici kullanici = Kullanici.builder()
                .eposta(eposta)
                .sifre(passwordEncoder.encode(talep.getTcKimlikNo()))   // varsayılan şifre = TC
                .roller(talep.getRoller().trim())
                .ad(talep.getAd())
                .soyad(talep.getSoyad())
                .fakulte(talep.getFakulte())
                .bolum(talep.getBolum())
                .tcKimlikMaskeli(tcKimlikMaskele(talep.getTcKimlikNo()))
                .durum(KullaniciDurumu.AKTIF)
                .epostaDogrulandi(true)
                .sifreDegistirmeli(true)
                .build();

        Kullanici kaydedilen = kullaniciDeposu.save(kullanici);
        profilOlusturmaOlayiYayinla(kaydedilen);
        denetimKaydet(kaydedilen.getId(), "KULLANICI_OLUSTURULDU", yapanId,
                "Yeni kullanıcı oluşturuldu: " + kaydedilen.getEposta() + " (" + kaydedilen.getRoller() + ")");
        log.info("Yönetici yeni personel oluşturdu: {} ({})", kaydedilen.getEposta(), kaydedilen.getRoller());
        return yanitOlustur(kaydedilen);
    }

    @Transactional
    public KullaniciYonetimYaniti guncelle(String id, KullaniciYonetimGuncellemeTalebi talep, String yapanId) {
        Kullanici kullanici = personelBul(id);
        StringBuilder degisiklik = new StringBuilder();

        if (talep.getRoller() != null && !talep.getRoller().isBlank()) {
            rolDogrula(talep.getRoller());
            if (kullanici.getRoller() != null && kullanici.getRoller().contains("ROLE_ADMIN")
                    && !talep.getRoller().contains("ROLE_ADMIN")) {
                sonAktifAdminKorumasi(kullanici);
            }
            if (!talep.getRoller().trim().equals(kullanici.getRoller())) {
                degisiklik.append("rol: ").append(kullanici.getRoller()).append("→").append(talep.getRoller().trim()).append("; ");
            }
            kullanici.setRoller(talep.getRoller().trim());
        }
        if (talep.getAd() != null) kullanici.setAd(talep.getAd());
        if (talep.getSoyad() != null) kullanici.setSoyad(talep.getSoyad());
        if (talep.getFakulte() != null) kullanici.setFakulte(talep.getFakulte());
        if (talep.getBolum() != null) kullanici.setBolum(talep.getBolum());
        if (talep.getDurum() != null && !talep.getDurum().isBlank()) {
            KullaniciDurumu yeniDurum = durumCozumle(talep.getDurum());
            if (!IZINLI_DURUMLAR.contains(yeniDurum)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Personel durumu yalnızca AKTIF veya PASIF olabilir. Diğer durumlar öğrencilere özgüdür.");
            }
            if (yeniDurum != KullaniciDurumu.AKTIF) {
                sonAktifAdminKorumasi(kullanici);
            }
            if (yeniDurum != kullanici.getDurum()) {
                degisiklik.append("durum: ").append(kullanici.getDurum()).append("→").append(yeniDurum).append("; ");
            }
            kullanici.setDurum(yeniDurum);
        }

        Kullanici kaydedilen = kullaniciDeposu.save(kullanici);
        denetimKaydet(kaydedilen.getId(), "KULLANICI_GUNCELLENDI", yapanId,
                kaydedilen.getEposta() + " güncellendi" + (degisiklik.length() > 0 ? " [" + degisiklik.toString().trim() + "]" : ""));
        return yanitOlustur(kaydedilen);
    }

    @Transactional
    public Map<String, String> sifreSifirla(String id, String tcKimlikNo, String yapanId) {
        Kullanici kullanici = personelBul(id);
        tcDogrula(tcKimlikNo);
        kullanici.setSifre(passwordEncoder.encode(tcKimlikNo));   // şifre = TC
        kullanici.setTcKimlikMaskeli(tcKimlikMaskele(tcKimlikNo));
        kullanici.setSifreDegistirmeli(true);
        kullaniciDeposu.save(kullanici);
        denetimKaydet(kullanici.getId(), "SIFRE_SIFIRLANDI", yapanId,
                kullanici.getEposta() + " şifresi TC Kimlik numarasına sıfırlandı.");
        return Map.of("mesaj", "Şifre TC Kimlik numarasına sıfırlandı. Kullanıcı ilk girişte değiştirecek.");
    }

    @Transactional
    public void sil(String id, String yapanId) {
        Kullanici kullanici = personelBul(id);
        sonAktifAdminKorumasi(kullanici);
        String eposta = kullanici.getEposta();
        String roller = kullanici.getRoller();
        kullaniciDeposu.delete(kullanici);
        denetimKaydet(id, "KULLANICI_SILINDI", yapanId, "Kullanıcı silindi: " + eposta + " (" + roller + ")");
        log.info("Yönetici kullanıcıyı sildi: {} ({})", eposta, roller);
    }

    public List<KullaniciDenetimYaniti> denetimGunlukleriniGetir() {
        return denetimDeposu.findTop500ByOrderByOlusturulmaTarihiDesc().stream()
                .map(d -> KullaniciDenetimYaniti.builder()
                        .id(d.getId())
                        .varlikTuru(d.getVarlikTuru())
                        .varlikId(d.getVarlikId())
                        .islem(d.getIslem())
                        .islemYapanId(d.getYapanId())
                        .islemYapanRol(d.getYapanRol())
                        .mesaj(d.getMesaj())
                        .olusturulmaTarihi(d.getOlusturulmaTarihi())
                        .build())
                .toList();
    }

    // --- yardımcılar ---

    private void denetimKaydet(String varlikId, String islem, String yapanId, String mesaj) {
        denetimDeposu.save(KullaniciDenetimGunlugu.builder()
                .varlikTuru("KULLANICI")
                .varlikId(varlikId)
                .islem(islem)
                .yapanId(yapanId != null ? yapanId : "SISTEM")
                .yapanRol("ROLE_ADMIN")
                .mesaj(mesaj)
                .build());
    }

    /** Sadece personel (öğrenci olmayan) kullanıcıyı bulur. */
    private Kullanici personelBul(String id) {
        Kullanici k = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));
        if (k.getRoller() != null && k.getRoller().contains("ROLE_STUDENT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Öğrenci hesapları sistem yöneticisi panelinden yönetilemez (Öğrenci İşleri'ne aittir).");
        }
        return k;
    }

    private void rolDogrula(String roller) {
        if (roller == null || roller.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol zorunludur.");
        }
        for (String rol : roller.split(",")) {
            if (!IZINLI_ROLLER.contains(rol.trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Geçersiz veya yetki dışı rol: " + rol.trim() + " (öğrenci rolü buradan atanamaz).");
            }
        }
    }

    private void tcDogrula(String tc) {
        if (tc == null || !tc.matches("\\d{11}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "TC Kimlik No 11 haneli olmalıdır (şifre sıfırlama için zorunludur).");
        }
    }

    private void sonAktifAdminKorumasi(Kullanici hedef) {
        if (hedef.getRoller() == null || !hedef.getRoller().contains("ROLE_ADMIN")) return;
        long aktifAdmin = kullaniciDeposu.countByRollerContainingAndDurum("ROLE_ADMIN", KullaniciDurumu.AKTIF);
        if (aktifAdmin <= 1) {
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

    private String tcKimlikMaskele(String tc) {
        return (tc == null || tc.length() < 5) ? null : tc.substring(0, 5) + "******";
    }

    private void profilOlusturmaOlayiYayinla(Kullanici kullanici) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("kullaniciId", kullanici.getId());
            payload.put("eposta", kullanici.getEposta());
            payload.put("ad", kullanici.getAd());
            payload.put("soyad", kullanici.getSoyad());
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
