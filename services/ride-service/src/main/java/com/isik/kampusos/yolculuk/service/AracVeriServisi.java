package com.isik.kampusos.yolculuk.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Araç marka/model verisini gerçek dış API'den (NHTSA vPIC — ücretsiz, anahtarsız) sağlar.
 * Sunucu tarafında çağrılır (CORS yok); marka listesi bellekte cache'lenir. API erişilemezse
 * boş liste döner ve istemci serbest-metne düşer (akış bozulmaz).
 */
@Service
@Slf4j
public class AracVeriServisi {

    private final RestClient restClient;
    private volatile List<String> markaCache;

    public AracVeriServisi(@Value("${arac.vpic.url:https://vpic.nhtsa.dot.gov/api}") String temelUrl) {
        this.restClient = RestClient.builder().baseUrl(temelUrl).build();
    }

    /** Tüm araç markaları (alfabetik, tekilleştirilmiş). Cache'lenir. */
    public List<String> markalar() {
        if (markaCache != null) return markaCache;
        try {
            JsonNode kok = restClient.get().uri("/vehicles/getallmakes?format=json")
                    .retrieve().body(JsonNode.class);
            List<String> liste = new ArrayList<>();
            for (JsonNode n : kok.path("Results")) {
                String ad = n.path("Make_Name").asText("").trim();
                if (!ad.isBlank()) liste.add(baslikDuzelt(ad));
            }
            liste = liste.stream().distinct().sorted().toList();
            markaCache = liste;
            return liste;
        } catch (Exception e) {
            log.warn("vPIC marka listesi alınamadı: {}", e.getMessage());
            return List.of();
        }
    }

    /** Verilen markaya ait modeller (alfabetik, tekilleştirilmiş). */
    public List<String> modeller(String marka) {
        if (marka == null || marka.isBlank()) return List.of();
        try {
            JsonNode kok = restClient.get()
                    .uri("/vehicles/getmodelsformake/{marka}?format=json", marka.trim())
                    .retrieve().body(JsonNode.class);
            List<String> liste = new ArrayList<>();
            for (JsonNode n : kok.path("Results")) {
                String ad = n.path("Model_Name").asText("").trim();
                if (!ad.isBlank()) liste.add(ad);
            }
            return liste.stream().distinct().sorted().toList();
        } catch (Exception e) {
            log.warn("vPIC model listesi alınamadı ({}): {}", marka, e.getMessage());
            return List.of();
        }
    }

    /** "VOLKSWAGEN" → "Volkswagen" (her kelimenin baş harfi büyük). */
    private String baslikDuzelt(String s) {
        String[] parcalar = s.toLowerCase(java.util.Locale.ROOT).split(" ");
        StringBuilder sb = new StringBuilder();
        for (String p : parcalar) {
            if (p.isBlank()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }
}
