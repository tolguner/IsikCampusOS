package com.isik.kampusos.yolculuk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.yolculuk.dto.EhliyetAnalizSonucu;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Yüklenen ehliyet görselini bir görüntü-AI (Anthropic vision) modeline gönderip
 * belgenin ehliyet olup olmadığını ve ehliyet no / veriliş / geçerlilik tarihi /
 * sınıf alanlarını otomatik çıkarır. Anahtar yoksa veya API erişilemezse zarifçe
 * "analiz yapılmadı" döner; başvuran alanları elle girer (akış bozulmaz).
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
            2) Eğer ehliyetse şu alanları oku: sınıf(lar) (ör. B), belge/ehliyet numarası,
               veriliş tarihi (Türk ehliyetinde 4a), son geçerlilik tarihi (4b).
            YALNIZCA aşağıdaki şemada geçerli JSON döndür, başka hiçbir metin ekleme:
            {"ehliyet": true|false, "sinif": "B" veya null, "ehliyetNo": "..." veya null,
             "verilisTarihi": "YYYY-MM-DD" veya null, "gecerlilikTarihi": "YYYY-MM-DD" veya null}
            Okuyamadığın alanı null bırak. Tarihleri ISO (YYYY-MM-DD) biçimine çevir.
            """;

    public EhliyetAnalizServisi(
            @Value("${ehliyet.analiz.url:https://api.anthropic.com/v1/messages}") String url,
            @Value("${ehliyet.analiz.api-key:}") String apiKey,
            @Value("${ehliyet.analiz.model:claude-haiku-4-5}") String model) {
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
                    "model", model,
                    "max_tokens", 300,
                    "messages", java.util.List.of(Map.of(
                            "role", "user",
                            "content", java.util.List.of(
                                    Map.of("type", "image", "source", Map.of(
                                            "type", "base64", "media_type", medyaTipi, "data", base64)),
                                    Map.of("type", "text", "text", YONERGE)))));

            JsonNode yanit = restClient.post()
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(govde)
                    .retrieve()
                    .body(JsonNode.class);

            String metin = yanit.path("content").path(0).path("text").asText("");
            JsonNode j = MAPPER.readTree(jsonCikar(metin));
            EhliyetAnalizSonucu s = new EhliyetAnalizSonucu();
            s.setAnalizYapildi(true);
            s.setEhliyet(j.path("ehliyet").asBoolean(false));
            s.setSinif(metinVeyaNull(j, "sinif"));
            s.setEhliyetNo(metinVeyaNull(j, "ehliyetNo"));
            s.setVerilisTarihi(metinVeyaNull(j, "verilisTarihi"));
            s.setGecerlilikTarihi(metinVeyaNull(j, "gecerlilikTarihi"));
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
