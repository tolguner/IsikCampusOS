package com.isik.kampusos.yolculuk.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * message-service'e (cluster-içi) konuşma açar/kapatır. Mesajlaşma altyapısı erişilemezse
 * yolculuk akışı bozulmaz (hata yutulur).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KonusmaIstemcisi {

    private final DiscoveryClient discoveryClient;
    private final RestClient restClient = RestClient.create();

    public void konusmaAc(String modul, String baglamId, List<String> katilimcilar, String baslik) {
        cagir("/api/v1/internal/konusmalar/ac",
                Map.of("modul", modul, "baglamId", baglamId, "katilimcilar", katilimcilar,
                        "baslik", baslik == null ? "" : baslik));
    }

    public void konusmaKapat(String modul, String baglamId) {
        cagir("/api/v1/internal/konusmalar/kapat", Map.of("modul", modul, "baglamId", baglamId));
    }

    private void cagir(String yol, Map<String, Object> govde) {
        try {
            List<ServiceInstance> ornekler = discoveryClient.getInstances("message-service");
            if (ornekler.isEmpty()) ornekler = discoveryClient.getInstances("MESSAGE-SERVICE");
            if (ornekler.isEmpty()) { log.warn("message-service bulunamadı; konuşma işlemi atlandı."); return; }
            restClient.post().uri(ornekler.get(0).getUri() + yol).body(govde).retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.warn("Konuşma işlemi başarısız ({}): {}", yol, e.getMessage());
        }
    }
}
