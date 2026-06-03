package com.isik.kampusos.kimlik.service;
 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kimlik.dto.*;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.util.Locale;
 
@Service
@RequiredArgsConstructor
@Slf4j
public class OgrenciYonetimServisi {
 
    private final KullaniciDeposu kullaniciDeposu;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
 
    /**
     * Yeni öğrenci oluştur.
     * E-posta: {öğrenciNo}@isik.edu.tr
     * Varsayılan şifre: TC Kimlik No (hash'lenerek saklanır, TC kendisi saklanmaz)
     */
    @Transactional
    public OgrenciYaniti ogrenciOlustur(OgrenciOlusturmaIstegi request) {
        // Validasyonlar
        if (request.getOgrenciNumarasi() == null || request.getOgrenciNumarasi().isBlank()) {
            throw new RuntimeException("Öğrenci numarası zorunludur.");
        }
        if (request.getTcKimlikNo() == null || request.getTcKimlikNo().length() != 11) {
            throw new RuntimeException("TC Kimlik No 11 haneli olmalıdır.");
        }
 
        // E-posta uretimi: ogrenci numarasi sadece ASCII local-part ile kullanilir.
        String normalizedStudentNumberForEmail = epostaIcinOgrenciNumarasiNormalizeEt(request.getOgrenciNumarasi());
        String eposta = normalizedStudentNumberForEmail + "@isik.edu.tr";
 
        if (kullaniciDeposu.existsByEposta(eposta)) {
            throw new RuntimeException("Bu öğrenci numarasına ait bir hesap zaten mevcut.");
        }
        if (kullaniciDeposu.existsByOgrenciNumarasi(request.getOgrenciNumarasi())) {
            throw new RuntimeException("Bu öğrenci numarası zaten kayıtlı.");
        }
 
        // Kullanıcı oluştur — varsayılan şifre: TC Kimlik No
        Kullanici kullanici = Kullanici.builder()
                .eposta(eposta)
                .sifre(passwordEncoder.encode(request.getTcKimlikNo()))
                .roller("ROLE_STUDENT")
                .ad(request.getAd())
                .soyad(request.getSoyad())
                .ogrenciNumarasi(request.getOgrenciNumarasi().toUpperCase(java.util.Locale.forLanguageTag("tr-TR")))
                .fakulte(request.getFakulte())
                .bolum(request.getBolum())
                .bolumKodu(request.getBolumKodu() != null ? request.getBolumKodu().toLowerCase(Locale.ROOT) : null)
                .kayitYili(request.getKayitYili())
                .tcKimlikMaskeli(tcKimlikMaskele(request.getTcKimlikNo()))
                .durum(KullaniciDurumu.AKTIF)
                .epostaDogrulandi(false)
                .sifreDegistirmeli(true)
                .build();
 
        Kullanici saved = kullaniciDeposu.save(kullanici);
 
        // Kafka event: profil servisi boş profil oluşsun
        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("kullaniciId", saved.getId());
            payloadMap.put("eposta", saved.getEposta());
            payloadMap.put("ad", saved.getAd());
            payloadMap.put("soyad", saved.getSoyad());
            payloadMap.put("ogrenciNumarasi", saved.getOgrenciNumarasi());
            payloadMap.put("tcKimlikMaskeli", saved.getTcKimlikMaskeli());
            payloadMap.put("telefonNumarasi", request.getTelefonNumarasi() != null ? request.getTelefonNumarasi() : "");
            payloadMap.put("ikametAdresi", request.getIkametAdresi() != null ? request.getIkametAdresi() : "");
            payloadMap.put("kanGrubu", request.getKanGrubu() != null ? request.getKanGrubu() : "");
            
            String payload = objectMapper.writeValueAsString(payloadMap);
            kafkaTemplate.send("kullanici.kaydedildi", saved.getId(), payload);
        } catch (Exception e) {
            log.warn("Kafka event gönderilemedi (kullanici.kaydedildi): {}", e.getMessage());
        }
 
        log.info("Yeni öğrenci oluşturuldu: {} - {} {}", saved.getOgrenciNumarasi(), saved.getAd(), saved.getSoyad());
 
        return yanitOlustur(saved);
    }
 
    /**
     * Öğrenci listesi — sayfalı, filtrelenebilir.
     */
    public Page<OgrenciYaniti> ogrencileriListele(int sayfa, int boyut, String arama, String durum, String fakulte) {
        String normalizedSearch = arama != null && !arama.isBlank() ? arama.trim().toLowerCase() : null;
        String normalizedFaculty = fakulte != null && !fakulte.isBlank() ? fakulte.trim() : null;
 
        KullaniciDurumu durumEnum = null;
        if (durum != null && !durum.isBlank()) {
            try {
                durumEnum = KullaniciDurumu.valueOf(durum.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Geçersiz durum filtresi: " + durum);
            }
        }
 
        KullaniciDurumu finalDurumEnum = durumEnum;
        Specification<Kullanici> specification = (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.like(root.get("roller"), "%ROLE_STUDENT%");
 
            if (normalizedSearch != null) {
                String pattern = "%" + normalizedSearch + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("ad")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("soyad")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("ogrenciNumarasi")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("eposta")), pattern)
                ));
            }
 
            if (finalDurumEnum != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("durum"), finalDurumEnum));
            }
 
            if (normalizedFaculty != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("fakulte"), normalizedFaculty));
            }
 
            query.orderBy(criteriaBuilder.desc(root.get("olusturulmaTarihi")));
            return predicate;
        };
 
        return kullaniciDeposu.findAll(specification, PageRequest.of(sayfa, boyut)).map(this::yanitOlustur);
    }
 
    /**
     * Tekil öğrenci detayı.
     */
    public OgrenciYaniti ogrenciGetir(String id) {
        Kullanici kullanici = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
        return yanitOlustur(kullanici);
    }
 
    /**
     * Öğrenci bilgilerini güncelle.
     */
    @Transactional
    public OgrenciYaniti ogrenciGuncelle(String id, OgrenciGuncellemeIstegi request) {
        Kullanici kullanici = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
 
        if (request.getAd() != null) kullanici.setAd(request.getAd());
        if (request.getSoyad() != null) kullanici.setSoyad(request.getSoyad());
        if (request.getFakulte() != null) kullanici.setFakulte(request.getFakulte());
        if (request.getBolum() != null) kullanici.setBolum(request.getBolum());

        Kullanici saved = kullaniciDeposu.save(kullanici);

        // Kafka event: profil servisi projeksiyonunu güncel tutsun (source-of-truth: kullanicilar)
        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("kullaniciId", saved.getId());
            payloadMap.put("eposta", saved.getEposta());
            payloadMap.put("ad", saved.getAd());
            payloadMap.put("soyad", saved.getSoyad());
            payloadMap.put("bolum", saved.getBolum());
            String payload = objectMapper.writeValueAsString(payloadMap);
            kafkaTemplate.send("kullanici.guncellendi", saved.getId(), payload);
        } catch (Exception e) {
            log.warn("Kafka event gönderilemedi (kullanici.guncellendi): {}", e.getMessage());
        }

        log.info("Öğrenci güncellendi: {} - {} {}", saved.getOgrenciNumarasi(), saved.getAd(), saved.getSoyad());
        return yanitOlustur(saved);
    }
 
    /**
     * Öğrenci durumunu değiştir.
     */
    @Transactional
    public OgrenciYaniti durumDegistir(String id, DurumDegistirmeIstegi request) {
        Kullanici kullanici = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
 
        KullaniciDurumu yeniDurum;
        try {
            yeniDurum = KullaniciDurumu.valueOf(request.getYeniDurum().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Geçersiz durum: " + request.getYeniDurum());
        }
 
        KullaniciDurumu currentStatus = kullanici.getDurum();
 
        // Durum geçiş kuralları
        boolean validTransition = switch (yeniDurum) {
            case AKTIF -> currentStatus == KullaniciDurumu.PASIF;
            case PASIF -> currentStatus == KullaniciDurumu.AKTIF;
            case MEZUN -> currentStatus == KullaniciDurumu.AKTIF || currentStatus == KullaniciDurumu.PASIF;
            case ILISIGI_KESILMIS -> currentStatus == KullaniciDurumu.AKTIF || currentStatus == KullaniciDurumu.PASIF;
        };
 
        if (!validTransition) {
            throw new RuntimeException(
                    String.format("'%s' durumundan '%s' durumuna geçiş yapılamaz.", currentStatus, yeniDurum));
        }
 
        kullanici.setDurum(yeniDurum);
        Kullanici saved = kullaniciDeposu.save(kullanici);
 
        log.info("Öğrenci durumu değiştirildi: {} → {} (Sebep: {})",
                saved.getOgrenciNumarasi(), yeniDurum, request.getNeden());
 
        return yanitOlustur(saved);
    }
 
    /**
     * Öğrenci şifresini TC Kimlik No'ya geri döndür.
     */
    @Transactional
    public void sifreSifirla(String id, String tcKimlikNo) {
        Kullanici kullanici = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
 
        if (tcKimlikNo == null || tcKimlikNo.length() != 11) {
            throw new RuntimeException("TC Kimlik No 11 haneli olmalıdır.");
        }
 
        kullanici.setSifre(passwordEncoder.encode(tcKimlikNo));
        kullanici.setTcKimlikMaskeli(tcKimlikMaskele(tcKimlikNo));
        kullanici.setSifreDegistirmeli(true);
        kullaniciDeposu.save(kullanici);
 
        log.info("Öğrenci şifresi sıfırlandı: {}", kullanici.getOgrenciNumarasi());
    }
 
    private OgrenciYaniti yanitOlustur(Kullanici kullanici) {
        return OgrenciYaniti.builder()
                .id(kullanici.getId())
                .eposta(kullanici.getEposta())
                .ad(kullanici.getAd())
                .soyad(kullanici.getSoyad())
                .tamAd(kullanici.getTamAd())
                .ogrenciNumarasi(kullanici.getOgrenciNumarasi())
                .tcKimlikMaskeli(kullanici.getTcKimlikMaskeli())
                .fakulte(kullanici.getFakulte())
                .bolum(kullanici.getBolum())
                .bolumKodu(kullanici.getBolumKodu())
                .kayitYili(kullanici.getKayitYili())
                .durum(kullanici.getDurum().name())
                .epostaDogrulandi(kullanici.isEpostaDogrulandi())
                .olusturulmaTarihi(kullanici.getOlusturulmaTarihi() != null ? kullanici.getOlusturulmaTarihi().toString() : null)
                .sonGirisTarihi(kullanici.getSonGirisTarihi() != null ? kullanici.getSonGirisTarihi().toString() : null)
                .build();
    }
 
    private String turkceKarakterleriTemizle(String input) {
        if (input == null) return null;
        return input.replace("\u011F", "g").replace("\u011E", "G") // ğ, Ğ
                    .replace("\u00FC", "u").replace("\u00DC", "U") // ü, Ü
                    .replace("\u015F", "s").replace("\u015E", "S") // ş, Ş
                    .replace("\u0131", "i").replace("\u0130", "I") // ı, İ
                    .replace("\u00F6", "o").replace("\u00D6", "O") // ö, Ö
                    .replace("\u00E7", "c").replace("\u00C7", "C"); // ç, Ç
    }
 
    private String epostaIcinOgrenciNumarasiNormalizeEt(String ogrenciNumarasi) {
        String normalized = turkceKarakterleriTemizle(ogrenciNumarasi)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
 
        if (normalized.isBlank()) {
            throw new RuntimeException("Öğrenci numarası e-posta için geçerli karakter içermiyor.");
        }
 
        return normalized;
    }
 
    private String tcKimlikMaskele(String tcKimlikNo) {
        if (tcKimlikNo == null || tcKimlikNo.length() < 5) {
            return null;
        }
        return tcKimlikNo.substring(0, 5) + "******";
    }

    /**
     * Öğrenciyi sistemden sil.
     */
    @Transactional
    public void ogrenciSil(String id) {
        Kullanici kullanici = kullaniciDeposu.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
        
        // Sadece öğrenci rolündeki kullanıcılar silinebilir güvenlik kontrolü
        if (!kullanici.getRoller().contains("ROLE_STUDENT")) {
            throw new RuntimeException("Sadece öğrenciler sistemden silinebilir.");
        }

        kullaniciDeposu.delete(kullanici);

        // Kafka event: profil servisi ve diğer servisler temizlik yapsın
        try {
            String payload = String.format("{\"kullaniciId\":\"%s\"}", id);
            kafkaTemplate.send("kullanici.silindi", id, payload);
        } catch (Exception e) {
            log.warn("Kafka event gönderilemedi (kullanici.silindi): {}", e.getMessage());
        }

        log.info("Öğrenci sistemden silindi: {} - {} {}", kullanici.getOgrenciNumarasi(), kullanici.getAd(), kullanici.getSoyad());
    }
}
