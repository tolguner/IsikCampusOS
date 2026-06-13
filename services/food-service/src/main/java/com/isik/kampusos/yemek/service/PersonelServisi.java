package com.isik.kampusos.yemek.service;

import com.isik.kampusos.yemek.dto.PersonelOlusturmaTalebi;
import com.isik.kampusos.yemek.dto.PersonelYaniti;
import com.isik.kampusos.yemek.messaging.AuthKimlikIstemcisi;
import com.isik.kampusos.yemek.model.IsletmePersoneli;
import com.isik.kampusos.yemek.model.Satici;
import com.isik.kampusos.yemek.repository.IsletmePersonelDeposu;
import com.isik.kampusos.yemek.repository.SaticiDeposu;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * İşletme sahibinin (ROLE_VENDOR_ADMIN) personellerini yönetmesi.
 * Personel hesabı auth-service'te (ROLE_VENDOR_STAFF) açılır; burada işletme↔personel bağı tutulur.
 * Her personel auth'ta YENİ bir kullanıcı olarak yaratıldığından bir personel doğal olarak tek
 * işletmeye bağlıdır (DB'de kullanici_id UNIQUE ek güvence sağlar).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersonelServisi {

    private final SaticiDeposu saticiDeposu;
    private final IsletmePersonelDeposu personelDeposu;
    private final AuthKimlikIstemcisi authIstemci;
    private final DenetimServisi denetim;

    public List<PersonelYaniti> personellerim(String sahipId) {
        Satici s = sahibinSaticisi(sahipId);
        return personelDeposu.findBySaticiIdOrderByOlusturulmaTarihiDesc(s.getId())
                .stream().map(PersonelYaniti::of).toList();
    }

    /**
     * Personel ekler: önce auth'ta hesap açar, sonra işletmeye bağlar.
     * Bağlama adımı hata verirse auth'taki hesabı geri alarak sahipsiz hesap bırakmaz (telafi).
     */
    @Transactional
    public PersonelYaniti personelEkle(String sahipId, PersonelOlusturmaTalebi talep) {
        Satici s = sahibinSaticisi(sahipId);
        dogrula(talep);

        // 1) auth'ta personel hesabı oluştur
        AuthKimlikIstemcisi.AuthPersonelYaniti hesap = authIstemci.personelOlustur(sahipId, talep);

        // 2) işletmeye bağla — hata olursa auth hesabını geri al
        try {
            IsletmePersoneli p = IsletmePersoneli.builder()
                    .saticiId(s.getId())
                    .kullaniciId(hesap.id())
                    .ad((talep.getAd() != null ? talep.getAd() : "").trim()
                            + (talep.getSoyad() != null && !talep.getSoyad().isBlank() ? " " + talep.getSoyad().trim() : ""))
                    .eposta(hesap.eposta())
                    .durum(IsletmePersoneli.PersonelDurumu.AKTIF)
                    .rol(rolCoz(talep.getRol()))
                    .build();
            IsletmePersoneli kayit = personelDeposu.save(p);
            denetim.kaydet("PERSONEL", kayit.getKullaniciId(), "PERSONEL_EKLENDI", sahipId, "ROLE_VENDOR_ADMIN",
                    s.getAd() + " personel ekledi: " + kayit.getEposta() + " (" + kayit.getRol() + ")");
            return PersonelYaniti.of(kayit);
        } catch (Exception e) {
            log.warn("Personel bağlama başarısız, auth hesabı geri alınıyor (kullaniciId={}): {}",
                    hesap.id(), e.getMessage());
            try {
                authIstemci.personelSil(sahipId, hesap.id());
            } catch (Exception telafiHatasi) {
                log.error("Telafi başarısız — auth'ta sahipsiz personel kalmış olabilir (kullaniciId={}): {}",
                        hesap.id(), telafiHatasi.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Personel kaydı oluşturulamadı, işlem geri alındı.");
        }
    }

    /**
     * Personeli askıya alır (PASIF) veya yeniden aktifleştirir. PASIF personel giriş yapabilir
     * ama hiçbir işletme işlemine erişemez (saticiCozumle dışlar); bildirim de almaz.
     */
    @Transactional
    public PersonelYaniti durumDegistir(String sahipId, String kullaniciId, String durum) {
        Satici s = sahibinSaticisi(sahipId);
        IsletmePersoneli p = personelDeposu.findBySaticiIdAndKullaniciId(s.getId(), kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Bu işletmede böyle bir personel bulunamadı."));
        IsletmePersoneli.PersonelDurumu yeni;
        try {
            yeni = IsletmePersoneli.PersonelDurumu.valueOf(durum == null ? "" : durum.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Durum AKTIF veya PASIF olmalıdır.");
        }
        p.setDurum(yeni);
        PersonelYaniti yanit = PersonelYaniti.of(personelDeposu.save(p));
        denetim.kaydet("PERSONEL", kullaniciId, "PERSONEL_DURUM", sahipId, "ROLE_VENDOR_ADMIN",
                p.getEposta() + " durumu: " + yeni);
        return yanit;
    }

    /**
     * Personeli işletmeden çıkarır: önce bağı kaldırır, sonra auth hesabını siler.
     * auth silme hatası olursa işlem geri alınır (tutarlılık korunur).
     */
    @Transactional
    public void personelCikar(String sahipId, String kullaniciId) {
        Satici s = sahibinSaticisi(sahipId);
        IsletmePersoneli p = personelDeposu.findBySaticiIdAndKullaniciId(s.getId(), kullaniciId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Bu işletmede böyle bir personel bulunamadı."));
        personelDeposu.delete(p);
        // Tenant izolasyonu food tarafında doğrulandı; auth hesabını kalıcı sil.
        authIstemci.personelSil(sahipId, kullaniciId);
        denetim.kaydet("PERSONEL", kullaniciId, "PERSONEL_CIKARILDI", sahipId, "ROLE_VENDOR_ADMIN",
                s.getAd() + " personel çıkardı: " + p.getEposta());
    }

    /** Panel için: çağıran kullanıcının işletmedeki rolü (SAHIP / PERSONEL / KURYE). */
    public java.util.Map<String, String> benimRol(String kullaniciId) {
        if (saticiDeposu.findByYoneticiKullaniciId(kullaniciId).isPresent()) {
            return java.util.Map.of("rol", "SAHIP");
        }
        return personelDeposu.findByKullaniciId(kullaniciId)
                .filter(p -> p.getDurum() == IsletmePersoneli.PersonelDurumu.AKTIF)
                .map(p -> java.util.Map.of("rol", p.getRol() != null ? p.getRol().name() : "PERSONEL"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Hesabınıza bağlı bir işletme bulunamadı."));
    }

    private IsletmePersoneli.PersonelRolu rolCoz(String rol) {
        if (rol == null || rol.isBlank()) return IsletmePersoneli.PersonelRolu.PERSONEL;
        try {
            return IsletmePersoneli.PersonelRolu.valueOf(rol.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol PERSONEL veya KURYE olmalıdır.");
        }
    }

    private void dogrula(PersonelOlusturmaTalebi talep) {
        if (talep.getAd() == null || talep.getAd().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ad zorunludur.");
        }
        if (talep.getEposta() == null || talep.getEposta().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-posta zorunludur.");
        }
        if (talep.getTcKimlikNo() == null || !talep.getTcKimlikNo().matches("\\d{11}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TC Kimlik No 11 haneli olmalıdır.");
        }
    }

    private Satici sahibinSaticisi(String sahipId) {
        return saticiDeposu.findByYoneticiKullaniciId(sahipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Hesabınıza bağlı bir işletme bulunamadı."));
    }
}
