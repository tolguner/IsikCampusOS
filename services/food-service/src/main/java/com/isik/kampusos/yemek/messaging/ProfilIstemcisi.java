package com.isik.kampusos.yemek.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * food→profile köprüsü: öğrencinin iletişim paylaşım iznini sorgular.
 * İzin frontend'de de uygulanır ama asıl zorlamayı backend yapar — API'ye doğrudan
 * telefon gönderilse bile izin yoksa kaydedilmez. Sorgu başarısız olursa gizlilik-güvenli
 * varsayılan: izin YOK kabul edilir.
 */
@Component
@Slf4j
public class ProfilIstemcisi {

    private final RestClient restClient;

    public ProfilIstemcisi(@Value("${profil.servis.url:http://profile-service:8082}") String temelUrl) {
        this.restClient = RestClient.builder().baseUrl(temelUrl).build();
    }

    public boolean iletisimIzniVarMi(String kullaniciId) {
        try {
            ProfilOzeti p = restClient.get()
                    .uri("/api/v1/profiller/benim")
                    .headers(h -> {
                        h.set("X-User-Id", kullaniciId);
                        h.set("X-User-Roles", "ROLE_STUDENT");
                    })
                    .retrieve()
                    .body(ProfilOzeti.class);
            return p != null && Boolean.TRUE.equals(p.iletisimPaylasimIzni());
        } catch (Exception e) {
            log.warn("İletişim izni sorgulanamadı ({}): {}", kullaniciId, e.getMessage());
            return false;
        }
    }

    /** profile-service Profil yanıtından yalnız gereken alan. */
    public record ProfilOzeti(Boolean iletisimPaylasimIzni) {}
}
