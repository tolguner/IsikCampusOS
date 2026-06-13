package com.isik.kampusos.yemek.messaging;

import com.isik.kampusos.yemek.dto.PersonelOlusturmaTalebi;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * food→auth köprüsü: işletme personeli (ROLE_VENDOR_STAFF) hesaplarını auth-service'te açar/siler.
 * Çağıran işletme sahibinin kimliği, paylaşılan JwtKimlikFiltresi'nin güvendiği
 * X-User-Id / X-User-Roles başlıklarıyla iletilir (kapalı ağ, mevcut servis-içi güven modeli).
 * auth'tan dönen 4xx/5xx hataları aynı durum + mesajla yukarı taşınır.
 */
@Component
@Slf4j
public class AuthKimlikIstemcisi {

    private final RestClient restClient;

    public AuthKimlikIstemcisi(@Value("${kimlik.servis.url:http://auth-service:8081}") String temelUrl) {
        this.restClient = RestClient.builder().baseUrl(temelUrl).build();
    }

    /** auth'ta personel hesabı oluşturur, oluşan kullanıcı id'sini döner. */
    public AuthPersonelYaniti personelOlustur(String sahipId, PersonelOlusturmaTalebi talep) {
        Map<String, Object> govde = new HashMap<>();
        govde.put("eposta", talep.getEposta());
        govde.put("ad", talep.getAd());
        govde.put("soyad", talep.getSoyad());
        govde.put("tcKimlikNo", talep.getTcKimlikNo());
        try {
            return restClient.post()
                    .uri("/api/v1/kimlik/isletme-personeli")
                    .headers(h -> sahipBasliklari(h, sahipId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(govde)
                    .retrieve()
                    .body(AuthPersonelYaniti.class);
        } catch (RestClientResponseException e) {
            throw yukariTasi(e, "Personel hesabı oluşturulamadı");
        }
    }

    /** auth'taki personel hesabını siler (çıkarma + telafi). */
    public void personelSil(String sahipId, String kullaniciId) {
        try {
            restClient.delete()
                    .uri("/api/v1/kimlik/isletme-personeli/{id}", kullaniciId)
                    .headers(h -> sahipBasliklari(h, sahipId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw yukariTasi(e, "Personel hesabı silinemedi");
        }
    }

    /**
     * Verilen kullanıcı id'leri için tam adları (id → tamAd) çözer. Ciro günlüğünde müşteri ve
     * işleyen personel isimlerini göstermek için kullanılır. Hata olursa boş harita döner (isimsiz).
     */
    public Map<String, String> adlariGetir(String cagiranId, List<String> kullaniciIdleri) {
        if (kullaniciIdleri == null || kullaniciIdleri.isEmpty()) return Map.of();
        try {
            List<AuthKullaniciOzeti> ozetler = restClient.post()
                    .uri("/api/v1/kullanicilar/toplu")
                    .headers(h -> sahipBasliklari(h, cagiranId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("kullaniciIdleri", kullaniciIdleri))
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AuthKullaniciOzeti>>() {});
            if (ozetler == null) return Map.of();
            return ozetler.stream()
                    .filter(o -> o.id() != null && o.tamAd() != null)
                    .collect(Collectors.toMap(AuthKullaniciOzeti::id, AuthKullaniciOzeti::tamAd, (a, b) -> a));
        } catch (Exception e) {
            log.warn("Kullanıcı adları çözülemedi: {}", e.getMessage());
            return Map.of();
        }
    }

    private void sahipBasliklari(org.springframework.http.HttpHeaders h, String sahipId) {
        h.set("X-User-Id", sahipId);
        h.set("X-User-Roles", "ROLE_VENDOR_ADMIN");
    }

    private ResponseStatusException yukariTasi(RestClientResponseException e, String onek) {
        String mesaj = e.getResponseBodyAsString();
        log.warn("{}: auth yanıtı {} — {}", onek, e.getStatusCode(), mesaj);
        return new ResponseStatusException(e.getStatusCode(),
                onek + (mesaj != null && !mesaj.isBlank() ? " (" + e.getStatusText() + ")" : ""));
    }

    /** auth'ın KullaniciYonetimYaniti'sinden yalnız gereken alanlar (bilinmeyenler yok sayılır). */
    public record AuthPersonelYaniti(String id, String eposta) {}

    /** auth'ın KullaniciOzetiYaniti'sinden yalnız gereken alanlar. */
    public record AuthKullaniciOzeti(String id, String tamAd) {}
}
