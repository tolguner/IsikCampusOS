package com.isik.kampusos.yolculuk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.yolculuk.dto.EhliyetAnalizSonucu;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Yüklenen ehliyet görselini Google Gemini vision modeline gönderip belgenin ehliyet
 * olup olmadığını ve ehliyet no / veriliş / geçerlilik / sınıf / TC no / ad-soyad alanlarını
 * otomatik çıkarır. Anahtar yoksa veya API erişilemezse zarifçe "analiz yapılmadı" döner;
 * başvuran alanları elle girer (akış bozulmaz).
 */
@Service
@Slf4j
public class EhliyetAnalizServisi {

    private static final Pattern DATA_URL = Pattern.compile("^data:([^;]+);base64,(.+)$", Pattern.DOTALL);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    private static final String YONERGE = """
            Bu bir kullanıcının yüklediği belgenin fotoğrafı. Görevin:
            1) Görselin bir SÜRÜCÜ BELGESİ (ehliyet) olup olmadığını belirle.
            2) Eğer ehliyetse şu alanları oku: sınıf(lar) (ör. B), belge/ehliyet numarası (alan 5),
               veriliş tarihi (alan 4a), son geçerlilik tarihi (alan 4b), TC kimlik numarası (alan 4d, 11 hane),
               ehliyet sahibinin adı ve soyadı (alan 1 ve 2).
            YALNIZCA şu şemada geçerli JSON döndür, başka metin yok:
            {"ehliyet": true|false, "sinif": "B" veya null, "ehliyetNo": "..." veya null,
             "verilisTarihi": "YYYY-MM-DD" veya null, "gecerlilikTarihi": "YYYY-MM-DD" veya null,
             "tcNo": "11 haneli" veya null, "adSoyad": "Ad Soyad" veya null}
            Okuyamadığın alanı null bırak. Tarihleri ISO (YYYY-MM-DD) biçimine çevir.
            """;

    public EhliyetAnalizServisi(
            @Value("${ehliyet.analiz.url:https://generativelanguage.googleapis.com/v1beta}") String url,
            @Value("${ehliyet.analiz.api-key:}") String apiKey,
            @Value("${ehliyet.analiz.model:gemini-2.0-flash}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder().baseUrl(url).build();
    }

    public EhliyetAnalizSonucu analizEt(String gorsel) {
        if (apiKey == null || apiKey.isBlank()) {
            return EhliyetAnalizSonucu.devreDisi("Otomatik analiz yapılandırılmamış; alanları elle girebilirsiniz.");
        }
        if (gorsel == null || gorsel.isBlank()) {
            return EhliyetAnalizSonucu.devreDisi("Görsel bulunamadı.");
        }
        String medyaTipi = "image/jpeg";
        String base64 = gorsel;
        Matcher m = DATA_URL.matcher(gorsel.trim());
        if (m.matches()) {
            medyaTipi = m.group(1);
            base64 = m.group(2);
        }

        try {
            Map<String, Object> govde = Map.of(
                    "contents", List.of(Map.of("parts", List.of(
                            Map.of("inline_data", Map.of("mime_type", medyaTipi, "data", base64)),
                            Map.of("text", YONERGE)))),
                    "generationConfig", Map.of("response_mime_type", "application/json", "temperature", 0));

            JsonNode yanit = restClient.post()
                    .uri("/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(govde)
                    .retrieve()
                    .body(JsonNode.class);

            String metin = yanit.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText("");
            JsonNode j = MAPPER.readTree(jsonCikar(metin));
            EhliyetAnalizSonucu s = new EhliyetAnalizSonucu();
            s.setAnalizYapildi(true);
            s.setEhliyet(j.path("ehliyet").asBoolean(false));
            s.setSinif(metinVeyaNull(j, "sinif"));
            s.setEhliyetNo(metinVeyaNull(j, "ehliyetNo"));
            s.setVerilisTarihi(metinVeyaNull(j, "verilisTarihi"));
            s.setGecerlilikTarihi(metinVeyaNull(j, "gecerlilikTarihi"));
            s.setTcNo(metinVeyaNull(j, "tcNo"));
            s.setAdSoyad(metinVeyaNull(j, "adSoyad"));
            s.setMesaj(s.isEhliyet() ? "Ehliyet doğrulandı." : "Bu görsel bir ehliyet gibi görünmüyor.");
            return s;
        } catch (Exception e) {
            log.warn("Ehliyet analizi başarısız: {}", e.getMessage());
            return EhliyetAnalizSonucu.devreDisi("Otomatik analiz şu an yapılamadı; alanları elle girebilirsiniz.");
        }
    }

    /** Model bazen ```json ... ``` ile sarar; ilk { ... } bloğunu ayıkla. */
    private String jsonCikar(String s) {
        int a = s.indexOf('{');
        int b = s.lastIndexOf('}');
        return (a >= 0 && b > a) ? s.substring(a, b + 1) : s;
    }

    private String metinVeyaNull(JsonNode j, String alan) {
        JsonNode n = j.path(alan);
        if (n.isNull() || n.isMissingNode()) return null;
        String v = n.asText("").trim();
        return v.isBlank() || v.equalsIgnoreCase("null") ? null : v;
    }
}
