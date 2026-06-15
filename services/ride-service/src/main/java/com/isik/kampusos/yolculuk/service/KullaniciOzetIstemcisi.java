package com.isik.kampusos.yolculuk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * auth-service'ten (cluster-içi) kullanıcı özetini çözer: id → {ad, soyad, öğrenci no, telefon, e-posta}.
 * Yönetim panelinde başvuranların kim olduğunu göstermek için kullanılır. Erişilemezse boş döner.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KullaniciOzetIstemcisi {

    private final DiscoveryClient discoveryClient;
    private final RestClient restClient = RestClient.create();

    public record KullaniciOzeti(String id, String ad, String soyad, String ogrenciNumarasi,
                                 String telefon, String eposta, String tcKimlikMaskeli) {
        public String adSoyad() {
            return ((ad == null ? "" : ad) + " " + (soyad == null ? "" : soyad)).trim();
        }
    }

    /** Verilen kullanıcı id'lerinin özetini id → özet olarak döner. */
    public Map<String, KullaniciOzeti> ozetler(Collection<String> ids) {
        Map<String, KullaniciOzeti> sonuc = new HashMap<>();
        if (ids == null || ids.isEmpty()) return sonuc;
        try {
            List<ServiceInstance> ornekler = discoveryClient.getInstances("auth-service");
            if (ornekler.isEmpty()) ornekler = discoveryClient.getInstances("AUTH-SERVICE");
            if (ornekler.isEmpty()) return sonuc;
            String temel = ornekler.get(0).getUri().toString();
            KullaniciOzeti[] dizi = restClient.post()
                    .uri(temel + "/api/v1/internal/kullanicilar/ozet")
                    .body(Map.of("ids", new ArrayList<>(new LinkedHashSet<>(ids))))
                    .retrieve()
                    .body(KullaniciOzeti[].class);
            if (dizi != null) for (KullaniciOzeti o : dizi) sonuc.put(o.id(), o);
        } catch (Exception e) {
            log.warn("Kullanıcı özeti alınamadı: {}", e.getMessage());
        }
        return sonuc;
    }
}
