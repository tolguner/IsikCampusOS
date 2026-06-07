package com.isik.kampusos.kulup.service;

import com.isik.kampusos.kulup.dto.AkademikKadroDanismanYaniti;
import com.isik.kampusos.kulup.dto.AkademikKadroSenkronizasyonYaniti;
import com.isik.kampusos.kulup.model.AkademikKadro;
import com.isik.kampusos.kulup.repository.AkademikKadroDeposu;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AkademikKadroServisi {
    private static final Logger log = LoggerFactory.getLogger(AkademikKadroServisi.class);
    private static final String BASE_URL = "https://www.isikun.edu.tr";
    private static final String SITEMAP_URL = BASE_URL + "/sitemap.xml";
    private static final String USER_AGENT = "IsikCampusOS akademik kadro senkronizasyonu";
    private static final Locale TR_LOCALE = Locale.forLanguageTag("tr-TR");
    private static final List<String> UNVAN_ON_EKIMLERI = List.of(
            "Emeritus Prof. Dr.",
            "Prof. Dr.",
            "Prof.",
            "Doç. Dr.",
            "Dr. Öğr. Üyesi",
            "Dr. Öğretim Görevlisi",
            "Öğretim Görevlisi",
            "Araştırma Görevlisi",
            "Dr."
    );
    private static final List<String> BILINEN_ROLLER = List.of(
            "Dekan",
            "Bölüm Başkanı",
            "Müdür",
            "Müdür Yardımcısı",
            "Öğretim Üyesi",
            "Öğretim Elemanı",
            "Öğretim Görevlisi",
            "Araştırma Görevlisi"
    );

    private static final Pattern URL_BLOK_SABLONU = Pattern.compile("<url>[\\s\\S]*?</url>");
    private static final Pattern LOC_SABLONU = Pattern.compile("<loc>([\\s\\S]*?)</loc>");
    private static final Pattern LASTMOD_SABLONU = Pattern.compile("<lastmod>([\\s\\S]*?)</lastmod>");
    private static final Pattern TITLE_SABLONU = Pattern.compile("<title>([\\s\\S]*?)</title>", Pattern.CASE_INSENSITIVE);
    private static final Pattern STAFF_CARD_SABLONU = Pattern.compile(
            "<div class=\"staff-card[\\s\\S]*?</div>\\s*</div>\\s*</div>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern STAFF_LINK_SABLONU = Pattern.compile(
            "<a\\s+[^>]*href=\"([^\"]*/akademisyen/[^\"]*)\"[^>]*>([\\s\\S]*?)</a>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PARAGRAPH_SABLONU = Pattern.compile("<p[^>]*>([\\s\\S]*?)</p>", Pattern.CASE_INSENSITIVE);
    private static final Pattern MAILTO_SABLONU = Pattern.compile("mailto:([^\"]+)", Pattern.CASE_INSENSITIVE);

    private final AkademikKadroDeposu akademikKadroDeposu;
    private final TransactionTemplate transactionTemplate;
    private final AtomicBoolean senkronizasyonDevamEdiyor = new AtomicBoolean(false);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public List<AkademikKadroDanismanYaniti> danismanlariAra(String sorgu, int limit) {
        int guvenliLimit = Math.max(1, Math.min(limit, 25));
        String normalizeSorgu = normalize(sorgu);
        List<AkademikKadro> kadro = normalizeSorgu.isBlank()
                ? akademikKadroDeposu.findByAktifTrueOrderByTamAdAsc(PageRequest.of(0, guvenliLimit))
                : akademikKadroDeposu.aktifleriAra(normalizeSorgu, PageRequest.of(0, guvenliLimit));

        return kadro.stream().map(this::danismanYanitinaDonustur).toList();
    }

    public Optional<AkademikKadro> idIleAktifBul(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return akademikKadroDeposu.findById(id.trim()).filter(AkademikKadro::isAktif);
    }

    @PostConstruct
    public void sogukBaslangictaSekronizeEt() {
        if (akademikKadroDeposu.countByAktifTrue() > 0) {
            return;
        }

        try {
            resmiSitedenGuncelle();
        } catch (Exception exception) {
            log.warn("Akademik kadro ilk senkronizasyonu basarisiz oldu: {}", exception.getMessage());
        }
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Europe/Istanbul")
    public void planliGuncelleme() {
        try {
            resmiSitedenGuncelle();
        } catch (Exception exception) {
            log.warn("Akademik kadro planli senkronizasyonu basarisiz oldu: {}", exception.getMessage());
        }
    }

    public AkademikKadroSenkronizasyonYaniti resmiSitedenGuncelle() {
        if (!senkronizasyonDevamEdiyor.compareAndSet(false, true)) {
            throw new IllegalStateException("Akademik kadro senkronizasyonu zaten calisiyor");
        }

        try {
            SenkronizasyonVerisi veri = resmiKadroDizininiScrapeEt();
            Instant senkronizasyonTarihi = Instant.now();

            long aktifSayisi = transactionTemplate.execute(status -> {
                akademikKadroDeposu.hepsiniPasifOlarakIsaretle();
                List<AkademikKadro> varliklar = veri.kayitlar().stream()
                        .map(kayit -> kadroyuGuncelleVeyaEkle(kayit, senkronizasyonTarihi))
                        .toList();
                akademikKadroDeposu.saveAll(varliklar);
                return akademikKadroDeposu.countByAktifTrue();
            });

            return AkademikKadroSenkronizasyonYaniti.builder()
                    .senkronizasyonTarihi(senkronizasyonTarihi)
                    .tarananSayfaSayisi(veri.tarananSayfaSayisi())
                    .hamKayitSayisi(veri.hamKayitSayisi())
                    .tekilKayitSayisi(veri.kayitlar().size())
                    .aktifKayitSayisi(aktifSayisi)
                    .build();
        } finally {
            senkronizasyonDevamEdiyor.set(false);
        }
    }

    private AkademikKadro kadroyuGuncelleVeyaEkle(KadroKaydi kayit, Instant senkronizasyonTarihi) {
        AkademikKadro kadro = mevcutBul(kayit).orElseGet(AkademikKadro::new);

        String eposta = bosuNullYap(kayit.eposta());
        kadro.setAkademikUnvan(kayit.akademikUnvan());
        kadro.setTamAd(kayit.tamAd());
        kadro.setEposta(eposta);
        kadro.setFakulteVeyaBirim(kayit.fakulteVeyaBirim());
        kadro.setBolum(kayit.bolum());
        kadro.setRol(kayit.rol());
        kadro.setProfilUrl(kayit.profilUrl());
        kadro.setKaynakSayfaUrl(kayit.kaynakSayfaUrl());
        kadro.setKaynakSayfaSonGuncellenme(kayit.kaynakSayfaSonGuncellenme());
        kadro.setSonSenkronizasyonTarihi(senkronizasyonTarihi);
        kadro.setAktif(true);

        return kadro;
    }

    private Optional<AkademikKadro> mevcutBul(KadroKaydi kayit) {
        if (kayit.eposta() != null && !kayit.eposta().isBlank()) {
            Optional<AkademikKadro> epostayla = akademikKadroDeposu.findByEpostaIgnoreCase(kayit.eposta());
            if (epostayla.isPresent()) {
                return epostayla;
            }
        }
        if (kayit.profilUrl() != null && !kayit.profilUrl().isBlank()) {
            return akademikKadroDeposu.findByProfilUrl(kayit.profilUrl());
        }
        return Optional.empty();
    }

    private SenkronizasyonVerisi resmiKadroDizininiScrapeEt() {
        String sitemapXml = metniGetir(SITEMAP_URL);
        List<KaynakSayfa> sayfalar = kadroSayfalariniSec(sitemapXml);
        Map<String, KadroKaydi> tekilKayitlar = new LinkedHashMap<>();
        int hamKayitSayisi = 0;

        for (KaynakSayfa sayfa : sayfalar) {
            try {
                String html = metniGetir(sayfa.url());
                String sayfaBasligi = sayfaBasliginiCikar(html);
                List<KadroKaydi> kayitlar = kadroKayitlariniCikar(html, sayfa, sayfaBasligi);
                hamKayitSayisi += kayitlar.size();
                for (KadroKaydi kayit : kayitlar) {
                    tekilKayitlar.merge(kayit.benzersizAnahtar(), kayit, KadroKaydi::birlestir);
                }
            } catch (Exception exception) {
                log.warn("Akademik kadro sayfa senkronizasyonu atlandi {}: {}", sayfa.url(), exception.getMessage());
            }
        }

        return new SenkronizasyonVerisi(sayfalar.size(), hamKayitSayisi, new ArrayList<>(tekilKayitlar.values()));
    }

    private List<KaynakSayfa> kadroSayfalariniSec(String sitemapXml) {
        List<KaynakSayfa> sayfalar = new ArrayList<>();
        Matcher blokEslestirici = URL_BLOK_SABLONU.matcher(sitemapXml);
        while (blokEslestirici.find()) {
            String blok = blokEslestirici.group();
            String url = htmlCoz(ilkEsleneniBul(LOC_SABLONU, blok));
            String sonGuncellenme = htmlCoz(ilkEsleneniBul(LASTMOD_SABLONU, blok));

            if (url.isBlank()) {
                continue;
            }

            String path = URI.create(url).getPath();
            boolean kadroSayfasi = path.startsWith("/akademik/")
                    && (path.endsWith("/akademik-kadro")
                    || path.endsWith("/akademik-kadro-0")
                    || path.endsWith("/academic-staff-conducting-program"));
            if (kadroSayfasi) {
                sayfalar.add(new KaynakSayfa(url, sonGuncellenme));
            }
        }

        sayfalar.sort(Comparator.comparing(KaynakSayfa::url));
        return sayfalar;
    }

    private List<KadroKaydi> kadroKayitlariniCikar(String html, KaynakSayfa sayfa, String sayfaBasligi) {
        List<KadroKaydi> kayitlar = new ArrayList<>();
        Matcher kartEslestirici = STAFF_CARD_SABLONU.matcher(html);
        while (kartEslestirici.find()) {
            String kartHtml = kartEslestirici.group();
            Matcher linkEslestirici = STAFF_LINK_SABLONU.matcher(kartHtml);
            if (!linkEslestirici.find()) {
                continue;
            }

            String profilUrl = mutlakUrl(linkEslestirici.group(1));
            String gorunenAd = etiketleriTemizle(linkEslestirici.group(2));
            UnvanVeAd unvanVeAd = unvanVeAdiAyir(gorunenAd);
            List<String> paragraflar = paragraflariCikar(kartHtml);
            String rolDepartmanHam = paragraflar.stream()
                    .filter(text -> text.contains("|"))
                    .findFirst()
                    .orElse(paragraflar.size() > 1 ? paragraflar.get(1) : "");
            RolVeDepartman rolVeDepartman = rolVeDepartmaniAyir(rolDepartmanHam);
            String eposta = paragraflar.stream()
                    .filter(text -> text.contains("@"))
                    .findFirst()
                    .orElse(htmlCoz(ilkEsleneniBul(MAILTO_SABLONU, kartHtml)));

            if (unvanVeAd.tamAd().isBlank()) {
                continue;
            }

            kayitlar.add(new KadroKaydi(
                    unvanVeAd.akademikUnvan(),
                    unvanVeAd.tamAd(),
                    normalize(eposta),
                    paragraflar.isEmpty() ? "" : paragraflar.get(0),
                    rolVeDepartman.departman(),
                    rolVeDepartman.rol(),
                    profilUrl,
                    sayfa.url(),
                    sayfa.sonGuncellenme(),
                    sayfaBasligi
            ));
        }

        return kayitlar;
    }

    private List<String> paragraflariCikar(String html) {
        List<String> paragraflar = new ArrayList<>();
        Matcher matcher = PARAGRAPH_SABLONU.matcher(html);
        while (matcher.find()) {
            String deger = etiketleriTemizle(matcher.group(1));
            if (!deger.isBlank()) {
                paragraflar.add(deger);
            }
        }
        return paragraflar;
    }

    private UnvanVeAd unvanVeAdiAyir(String gorunenAd) {
        for (String unvan : UNVAN_ON_EKIMLERI) {
            if (gorunenAd.startsWith(unvan + " ")) {
                return new UnvanVeAd(unvan, normalize(gorunenAd.substring(unvan.length())));
            }
        }
        return new UnvanVeAd("", normalize(gorunenAd));
    }

    private RolVeDepartman rolVeDepartmaniAyir(String deger) {
        String temizlenmis = normalize(deger);
        if (temizlenmis.isBlank()) {
            return new RolVeDepartman("", "");
        }

        if (temizlenmis.contains("|")) {
            String[] parcalar = temizlenmis.split("\\|", 2);
            return new RolVeDepartman(normalize(parcalar[0]), normalize(parcalar.length > 1 ? parcalar[1] : ""));
        }

        for (String rol : BILINEN_ROLLER) {
            if (temizlenmis.endsWith(" " + rol)) {
                return new RolVeDepartman(rol, normalize(temizlenmis.substring(0, temizlenmis.length() - rol.length())));
            }
        }

        return new RolVeDepartman("", temizlenmis);
    }

    private AkademikKadroDanismanYaniti danismanYanitinaDonustur(AkademikKadro kadro) {
        return AkademikKadroDanismanYaniti.builder()
                .id(kadro.getId())
                .akademikUnvan(kadro.getAkademikUnvan())
                .adSoyad(kadro.getTamAd())
                .gorunenAd(gorunenAd(kadro.getAkademikUnvan(), kadro.getTamAd()))
                .eposta(kadro.getEposta())
                .fakulteVeyaBirim(kadro.getFakulteVeyaBirim())
                .bolum(kadro.getBolum())
                .rol(kadro.getRol())
                .profilUrl(kadro.getProfilUrl())
                .sonSenkronizasyonTarihi(kadro.getSonSenkronizasyonTarihi())
                .build();
    }

    public String gorunenAd(String akademikUnvan, String tamAd) {
        if (akademikUnvan == null || akademikUnvan.isBlank()) {
            return normalize(tamAd);
        }
        return normalize(akademikUnvan + " " + tamAd);
    }

    private String metniGetir(String url) {
        try {
            HttpRequest istek = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("User-Agent", USER_AGENT)
                    .GET()
                    .build();
            HttpResponse<String> yanit = httpClient.send(istek, HttpResponse.BodyHandlers.ofString());
            if (yanit.statusCode() < 200 || yanit.statusCode() >= 300) {
                throw new IllegalStateException("HTTP " + yanit.statusCode());
            }
            return yanit.body();
        } catch (Exception exception) {
            throw new IllegalStateException("Getirilemedi: " + url + ": " + exception.getMessage(), exception);
        }
    }

    private String sayfaBasliginiCikar(String html) {
        return etiketleriTemizle(ilkEsleneniBul(TITLE_SABLONU, html));
    }

    private String ilkEsleneniBul(Pattern pattern, String deger) {
        Matcher matcher = pattern.matcher(deger);
        return matcher.find() ? matcher.group(1) : "";
    }

    private String mutlakUrl(String href) {
        if (href == null || href.isBlank()) {
            return "";
        }
        return URI.create(BASE_URL).resolve(htmlCoz(href)).toString();
    }

    private String etiketleriTemizle(String deger) {
        return normalize(htmlCoz(deger)
                .replaceAll("(?is)<br\\s*/?>", " ")
                .replaceAll("(?is)<script[\\s\\S]*?</script>", " ")
                .replaceAll("(?is)<style[\\s\\S]*?</style>", " ")
                .replaceAll("<[^>]+>", " "));
    }

    private String normalize(String deger) {
        return metniNormalizeEt(deger);
    }

    private String bosuNullYap(String deger) {
        String normalizeEdilmis = normalize(deger);
        return normalizeEdilmis.isBlank() ? null : normalizeEdilmis;
    }

    private String htmlCoz(String deger) {
        return htmlMetniniCoz(deger);
    }

    private static String metniNormalizeEt(String deger) {
        if (deger == null) {
            return "";
        }
        return htmlMetniniCoz(deger)
                .replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String htmlMetniniCoz(String deger) {
        if (deger == null || deger.isBlank()) {
            return "";
        }

        String cozulen = deger
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#039;", "'")
                .replace("&apos;", "'")
                .replace("&nbsp;", " ")
                .replace("&ndash;", "-")
                .replace("&mdash;", "-")
                .replace("&rsquo;", "'")
                .replace("&lsquo;", "'")
                .replace("&rdquo;", "\"")
                .replace("&ldquo;", "\"");

        Matcher ondalikEslestirici = Pattern.compile("&#(\\d+);").matcher(cozulen);
        StringBuffer ondalikTampon = new StringBuffer();
        while (ondalikEslestirici.find()) {
            ondalikEslestirici.appendReplacement(
                    ondalikTampon,
                    Matcher.quoteReplacement(Character.toString((char) Integer.parseInt(ondalikEslestirici.group(1))))
            );
        }
        ondalikEslestirici.appendTail(ondalikTampon);

        Matcher onaltilikEslestirici = Pattern.compile("&#x([0-9a-fA-F]+);").matcher(ondalikTampon.toString());
        StringBuffer onaltilikTampon = new StringBuffer();
        while (onaltilikEslestirici.find()) {
            onaltilikEslestirici.appendReplacement(
                    onaltilikTampon,
                    Matcher.quoteReplacement(Character.toString((char) Integer.parseInt(onaltilikEslestirici.group(1), 16)))
            );
        }
        onaltilikEslestirici.appendTail(onaltilikTampon);

        return onaltilikTampon.toString();
    }

    private static String benzersizBirlestir(String sol, String sag) {
        LinkedHashSet<String> degerler = new LinkedHashSet<>();
        Arrays.stream((sol == null ? "" : sol).split(";"))
                .map(AkademikKadroServisi::metniNormalizeEt)
                .filter(deger -> !deger.isBlank())
                .forEach(degerler::add);
        Arrays.stream((sag == null ? "" : sag).split(";"))
                .map(AkademikKadroServisi::metniNormalizeEt)
                .filter(deger -> !deger.isBlank())
                .forEach(degerler::add);
        return String.join("; ", degerler);
    }

    private record KaynakSayfa(String url, String sonGuncellenme) {
    }

    private record SenkronizasyonVerisi(int tarananSayfaSayisi, int hamKayitSayisi, List<KadroKaydi> kayitlar) {
    }

    private record UnvanVeAd(String akademikUnvan, String tamAd) {
    }

    private record RolVeDepartman(String rol, String departman) {
    }

    private record KadroKaydi(
            String akademikUnvan,
            String tamAd,
            String eposta,
            String fakulteVeyaBirim,
            String bolum,
            String rol,
            String profilUrl,
            String kaynakSayfaUrl,
            String kaynakSayfaSonGuncellenme,
            String kaynakSayfaBasligi
    ) {
        String benzersizAnahtar() {
            if (eposta != null && !eposta.isBlank()) {
                return "email:" + eposta.toLowerCase(TR_LOCALE);
            }
            if (profilUrl != null && !profilUrl.isBlank()) {
                return "profile:" + profilUrl;
            }
            return "name:" + tamAd.toLowerCase(TR_LOCALE);
        }

        KadroKaydi birlestir(KadroKaydi diger) {
            return new KadroKaydi(
                    ilkDoluOlan(akademikUnvan, diger.akademikUnvan),
                    ilkDoluOlan(tamAd, diger.tamAd),
                    ilkDoluOlan(eposta, diger.eposta),
                    benzersizBirlestir(fakulteVeyaBirim, diger.fakulteVeyaBirim),
                    benzersizBirlestir(bolum, diger.bolum),
                    benzersizBirlestir(rol, diger.rol),
                    ilkDoluOlan(profilUrl, diger.profilUrl),
                    benzersizBirlestir(kaynakSayfaUrl, diger.kaynakSayfaUrl),
                    ilkDoluOlan(kaynakSayfaSonGuncellenme, diger.kaynakSayfaSonGuncellenme),
                    benzersizBirlestir(kaynakSayfaBasligi, diger.kaynakSayfaBasligi)
            );
        }

        private static String ilkDoluOlan(String ilk, String ikinci) {
            return ilk != null && !ilk.isBlank() ? ilk : ikinci;
        }
    }
}
