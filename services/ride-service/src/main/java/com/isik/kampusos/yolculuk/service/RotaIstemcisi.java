package com.isik.kampusos.yolculuk.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Gerçek yol-ağı rota motoru istemcisi (OSRM HTTP API). Sürücü rotasının polyline+süre+mesafesini ve
 * yolcunun "yol üstünde mi" (detour) hesabını yapar. OSRM erişilemezse kuşuçuşu (haversine) tahminine
 * düşer; böylece servis çevrimdışı/sınırlı ortamda da bozulmaz. URL config ile değiştirilebilir
 * (üretimde kendi OSRM container'ı). Koordinat sırası OSRM'de [boylam,enlem].
 */
@Component
@Slf4j
public class RotaIstemcisi {

    private static final double ORT_HIZ_KM_DK = 0.5; // ~30 km/sa kampüs/şehir içi; fallback süresi için

    private final RestClient restClient;
    private final String temelUrl;

    public RotaIstemcisi(@Value("${rota.osrm.url:https://router.project-osrm.org}") String temelUrl) {
        this.temelUrl = temelUrl;
        this.restClient = RestClient.builder().baseUrl(temelUrl).build();
    }

    @Data
    @Builder
    public static class RotaSonucu {
        private String polyline;
        private int toplamDakika;
        private double mesafeKm;
        /** Her ara nokta (waypoint) için başlangıçtan itibaren kümülatif dakika. */
        private List<Integer> kumulatifDakika;
        private boolean osrmKullanildi;
    }

    /** noktalar: [enlem,boylam] sırasıyla başlangıç → (duraklar) → varış. */
    public RotaSonucu rotaHesapla(List<double[]> noktalar) {
        if (noktalar == null || noktalar.size() < 2) {
            return RotaSonucu.builder().polyline(null).toplamDakika(0).mesafeKm(0)
                    .kumulatifDakika(List.of()).osrmKullanildi(false).build();
        }
        try {
            JsonNode rota = osrmRoute(noktalar);
            double sureDk = rota.path("duration").asDouble() / 60.0;
            double mesafeKm = rota.path("distance").asDouble() / 1000.0;
            String polyline = rota.path("geometry").asText(null);
            List<Integer> kumulatif = new ArrayList<>();
            kumulatif.add(0);
            double kum = 0;
            for (JsonNode leg : rota.path("legs")) {
                kum += leg.path("duration").asDouble() / 60.0;
                kumulatif.add((int) Math.round(kum));
            }
            return RotaSonucu.builder()
                    .polyline(polyline)
                    .toplamDakika((int) Math.round(sureDk))
                    .mesafeKm(Math.round(mesafeKm * 10) / 10.0)
                    .kumulatifDakika(kumulatif)
                    .osrmKullanildi(true)
                    .build();
        } catch (Exception e) {
            log.warn("OSRM rota hesaplanamadı, haversine fallback: {}", e.getMessage());
            return haversineFallback(noktalar);
        }
    }

    /**
     * Yolcunun yol-üstü olup olmadığını ölçer: rota (başlangıç→varış, sürücü duraklarıyla) üzerine
     * yolcu biniş/iniş eklenince sürücünün katlanacağı EK süre (dakika). Düşükse "yol üstünde".
     * noktalar = sürücü rota noktaları (sıralı), binis/inis = yolcu noktaları [enlem,boylam].
     */
    public int sapmaDakika(List<double[]> surucuNoktalari, double[] binis, double[] inis) {
        int temel = rotaHesapla(surucuNoktalari).getToplamDakika();
        // Yolcuyu rota başına/sonuna en yakın olacak şekilde araya ekle: basit ve sağlam yaklaşım —
        // başlangıç, biniş, iniş, varış üzerinden süre ile temel başlangıç→varış süresini kıyasla.
        double[] bas = surucuNoktalari.get(0);
        double[] var = surucuNoktalari.get(surucuNoktalari.size() - 1);
        int yolculuRota = rotaHesapla(List.of(bas, binis, inis, var)).getToplamDakika();
        int dogrudan = rotaHesapla(List.of(bas, var)).getToplamDakika();
        int sapma = Math.max(0, yolculuRota - dogrudan);
        // Sürücünün kendi durakları zaten temel rotaya dahil; ek sapma yolcuya özgü kısımdır.
        return Math.min(sapma, Math.max(0, yolculuRota - Math.min(temel, dogrudan)));
    }

    private JsonNode osrmRoute(List<double[]> noktalar) {
        StringBuilder koord = new StringBuilder();
        for (double[] n : noktalar) {
            if (koord.length() > 0) koord.append(';');
            koord.append(n[1]).append(',').append(n[0]); // boylam,enlem
        }
        JsonNode kok = restClient.get()
                .uri("/route/v1/driving/{koord}?overview=full&geometries=polyline&annotations=false",
                        koord.toString())
                .retrieve()
                .body(JsonNode.class);
        if (kok == null || !"Ok".equals(kok.path("code").asText()) || kok.path("routes").isEmpty()) {
            throw new IllegalStateException("OSRM yanıtı geçersiz");
        }
        return kok.path("routes").get(0);
    }

    private RotaSonucu haversineFallback(List<double[]> noktalar) {
        double toplamKm = 0;
        List<Integer> kumulatif = new ArrayList<>();
        kumulatif.add(0);
        for (int i = 1; i < noktalar.size(); i++) {
            toplamKm += haversineKm(noktalar.get(i - 1), noktalar.get(i));
            kumulatif.add((int) Math.round(toplamKm / ORT_HIZ_KM_DK / 60.0 * 60.0));
        }
        // ~30 km/sa: dakika = km / 30 * 60 = km * 2
        int toplamDk = (int) Math.round(toplamKm * 2);
        List<Integer> kumDk = new ArrayList<>();
        double kum = 0;
        kumDk.add(0);
        for (int i = 1; i < noktalar.size(); i++) {
            kum += haversineKm(noktalar.get(i - 1), noktalar.get(i)) * 2;
            kumDk.add((int) Math.round(kum));
        }
        return RotaSonucu.builder()
                .polyline(null)
                .toplamDakika(toplamDk)
                .mesafeKm(Math.round(toplamKm * 10) / 10.0)
                .kumulatifDakika(kumDk)
                .osrmKullanildi(false)
                .build();
    }

    public static double haversineKm(double[] a, double[] b) {
        double r = 6371.0;
        double dLat = Math.toRadians(b[0] - a[0]);
        double dLon = Math.toRadians(b[1] - a[1]);
        double s = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a[0])) * Math.cos(Math.toRadians(b[0]))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }
}
