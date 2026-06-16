package com.isik.kampusos.profil.service;
 
import com.isik.kampusos.profil.dto.ProfilDegisiklikTalebi;
import com.isik.kampusos.profil.dto.ProfilDegisiklikIncelemesi;
import com.isik.kampusos.profil.dto.ProfilDetayi;
import com.isik.kampusos.profil.model.Profil;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegi;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegiDurumu;
import com.isik.kampusos.profil.repository.ProfilDegisiklikIstegiDeposu;
import com.isik.kampusos.profil.repository.ProfilDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
 
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
 
@Service
@RequiredArgsConstructor
public class ProfilServisi {
 
    private static final Set<String> USER_REQUESTABLE_FIELDS = Set.of("telefonNumarasi", "ikametAdresi", "kanGrubu");
 
    private final ProfilDeposu profilDeposu;
    private final ProfilDegisiklikIstegiDeposu profilDegisiklikIstegiDeposu;
 
    public Profil kullaniciIdIleProfilGetir(String kullaniciId) {
        return profilDeposu.findByKullaniciId(kullaniciId)
                .orElseGet(() -> profilDeposu.save(Profil.builder()
                        .kullaniciId(kullaniciId)
                        .build()));
    }
 
    public Profil profilGuncelle(String kullaniciId, ProfilDetayi updateDto) {
        Profil profil = kullaniciIdIleProfilGetir(kullaniciId);
        
        if (updateDto.getProfilResmiUrl() != null) {
            String base64Data = updateDto.getProfilResmiUrl();
            if (base64Data.trim().isEmpty()) {
                profil.setProfilResmiUrl(null);
                profil.setProfilResmiBaytlari(null);
                profil.setProfilResmiIcerikTuru(null);
            } else if (base64Data.startsWith("data:")) {
                try {
                    int commaIdx = base64Data.indexOf(",");
                    if (commaIdx != -1) {
                        String metadata = base64Data.substring(0, commaIdx);
                        String base64BytesStr = base64Data.substring(commaIdx + 1);
                        
                        String contentType = "image/png"; // fallback
                        int colonIdx = metadata.indexOf(":");
                        int semiColonIdx = metadata.indexOf(";");
                        if (colonIdx != -1 && semiColonIdx != -1 && semiColonIdx > colonIdx) {
                            contentType = metadata.substring(colonIdx + 1, semiColonIdx);
                        }
                        
                        byte[] decodedBytes = java.util.Base64.getDecoder().decode(base64BytesStr);
                        profil.setProfilResmiBaytlari(decodedBytes);
                        profil.setProfilResmiIcerikTuru(contentType);
                        profil.setProfilResmiUrl("/api/v1/profiller/" + kullaniciId + "/avatar");
                    }
                } catch (Exception e) {
                    profil.setProfilResmiUrl(base64Data);
                }
            } else {
                profil.setProfilResmiUrl(base64Data);
            }
        }
        
        if (updateDto.getHakkinda() != null) profil.setHakkinda(updateDto.getHakkinda());
        if (updateDto.getYetenekler() != null) profil.setYetenekler(updateDto.getYetenekler());
        if (updateDto.getIletisimPaylasimIzni() != null) profil.setIletisimPaylasimIzni(updateDto.getIletisimPaylasimIzni());

        return profilDeposu.save(profil);
    }
 
    public List<ProfilDegisiklikIstegi> degisiklikIsteklerimiGetir(String kullaniciId) {
        return profilDegisiklikIstegiDeposu.findByKullaniciIdOrderByOlusturulmaTarihiDesc(kullaniciId);
    }
 
    public ProfilDegisiklikIstegi profilDegisiklikIstegiOlustur(String kullaniciId, ProfilDegisiklikTalebi requestDto) {
        if (requestDto.getAlanAdi() == null || !USER_REQUESTABLE_FIELDS.contains(requestDto.getAlanAdi())) {
            throw new RuntimeException("Bu alan kullanıcı tarafından değişiklik talebine açılamaz.");
        }
 
        if (requestDto.getTalepEdilenDeger() == null || requestDto.getTalepEdilenDeger().trim().isEmpty()) {
            throw new RuntimeException("Talep edilen değer boş olamaz.");
        }
 
        Profil profil = kullaniciIdIleProfilGetir(kullaniciId);
        String alanAdi = requestDto.getAlanAdi();
        String talepEdilenDeger = requestDto.getTalepEdilenDeger().trim();
 
        return profilDegisiklikIstegiDeposu.save(ProfilDegisiklikIstegi.builder()
                .kullaniciId(kullaniciId)
                .alanAdi(alanAdi)
                .mevcutDeger(degistirilebilirAlaniOku(profil, alanAdi))
                .talepEdilenDeger(talepEdilenDeger)
                .build());
    }
 
    public List<ProfilDegisiklikIstegi> bekleyenDegisiklikIstekleriniGetir(String roller) {
        inceleyiciYetkisiniDogrula(roller);
        return profilDegisiklikIstegiDeposu.findByDurumOrderByOlusturulmaTarihiDesc(ProfilDegisiklikIstegiDurumu.BEKLEMEDE);
    }
 
    public ProfilDegisiklikIstegi degisiklikIsteginiOnayla(String requestId, String reviewerId, String roller) {
        inceleyiciYetkisiniDogrula(roller);
        ProfilDegisiklikIstegi request = bekleyenIstegiGetir(requestId);
        Profil profil = kullaniciIdIleProfilGetir(request.getKullaniciId());
 
        degisikligiUygula(profil, request.getAlanAdi(), request.getTalepEdilenDeger());
        profilDeposu.save(profil);
 
        request.setDurum(ProfilDegisiklikIstegiDurumu.ONAYLANDI);
        request.setInceleyen(reviewerId);
        request.setIncelemeTarihi(LocalDateTime.now());
        return profilDegisiklikIstegiDeposu.save(request);
    }
 
    public ProfilDegisiklikIstegi degisiklikIsteginiReddet(String requestId, String reviewerId, String roller, ProfilDegisiklikIncelemesi reviewDto) {
        inceleyiciYetkisiniDogrula(roller);
        ProfilDegisiklikIstegi request = bekleyenIstegiGetir(requestId);
        request.setDurum(ProfilDegisiklikIstegiDurumu.REDDEDILDI);
        request.setInceleyen(reviewerId);
        request.setIncelemeTarihi(LocalDateTime.now());
        request.setGeriBildirim(reviewDto != null ? reviewDto.getGeriBildirim() : null);
        return profilDegisiklikIstegiDeposu.save(request);
    }
 
    private ProfilDegisiklikIstegi bekleyenIstegiGetir(String requestId) {
        ProfilDegisiklikIstegi request = profilDegisiklikIstegiDeposu.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Profil değişiklik talebi bulunamadı."));
        if (request.getDurum() != ProfilDegisiklikIstegiDurumu.BEKLEMEDE) {
            throw new RuntimeException("Bu talep daha önce incelenmiş.");
        }
        return request;
    }
 
    private void inceleyiciYetkisiniDogrula(String roller) {
        if (roller == null || (!roller.contains("ROLE_REGISTRAR") && !roller.contains("ROLE_ADMIN"))) {
            throw new RuntimeException("Profil değişiklik taleplerini onaylama yetkiniz yok.");
        }
    }
 
    private String degistirilebilirAlaniOku(Profil profil, String alanAdi) {
        return switch (alanAdi) {
            case "telefonNumarasi" -> profil.getTelefonNumarasi();
            case "ikametAdresi" -> profil.getIkametAdresi();
            case "kanGrubu" -> profil.getKanGrubu();
            default -> null;
        };
    }
 
    private void degisikligiUygula(Profil profil, String alanAdi, String deger) {
        switch (alanAdi) {
            case "telefonNumarasi" -> profil.setTelefonNumarasi(deger);
            case "ikametAdresi" -> profil.setIkametAdresi(deger);
            case "kanGrubu" -> profil.setKanGrubu(deger);
            default -> throw new RuntimeException("Desteklenmeyen profil alanı.");
        }
    }
}
