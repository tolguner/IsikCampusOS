package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.AcademicStaffAdvisorResponse;
import com.isik.campusos.event.dto.AcademicStaffSyncResponse;
import com.isik.campusos.event.model.AcademicStaff;
import com.isik.campusos.event.repository.AcademicStaffRepository;
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
public class AcademicStaffService {
    private static final Logger log = LoggerFactory.getLogger(AcademicStaffService.class);
    private static final String BASE_URL = "https://www.isikun.edu.tr";
    private static final String SITEMAP_URL = BASE_URL + "/sitemap.xml";
    private static final String USER_AGENT = "IsikCampusOS academic staff sync";
    private static final Locale TR_LOCALE = Locale.forLanguageTag("tr-TR");
    private static final List<String> TITLE_PREFIXES = List.of(
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
    private static final List<String> KNOWN_ROLES = List.of(
            "Dekan",
            "Bölüm Başkanı",
            "Müdür",
            "Müdür Yardımcısı",
            "Öğretim Üyesi",
            "Öğretim Elemanı",
            "Öğretim Görevlisi",
            "Araştırma Görevlisi"
    );

    private static final Pattern URL_BLOCK_PATTERN = Pattern.compile("<url>[\\s\\S]*?</url>");
    private static final Pattern LOC_PATTERN = Pattern.compile("<loc>([\\s\\S]*?)</loc>");
    private static final Pattern LASTMOD_PATTERN = Pattern.compile("<lastmod>([\\s\\S]*?)</lastmod>");
    private static final Pattern TITLE_PATTERN = Pattern.compile("<title>([\\s\\S]*?)</title>", Pattern.CASE_INSENSITIVE);
    private static final Pattern STAFF_CARD_PATTERN = Pattern.compile(
            "<div class=\"staff-card[\\s\\S]*?</div>\\s*</div>\\s*</div>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern STAFF_LINK_PATTERN = Pattern.compile(
            "<a\\s+[^>]*href=\"([^\"]*/akademisyen/[^\"]*)\"[^>]*>([\\s\\S]*?)</a>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PARAGRAPH_PATTERN = Pattern.compile("<p[^>]*>([\\s\\S]*?)</p>", Pattern.CASE_INSENSITIVE);
    private static final Pattern MAILTO_PATTERN = Pattern.compile("mailto:([^\"]+)", Pattern.CASE_INSENSITIVE);

    private final AcademicStaffRepository academicStaffRepository;
    private final TransactionTemplate transactionTemplate;
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public List<AcademicStaffAdvisorResponse> searchAdvisors(String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 25));
        String normalizedQuery = normalize(query);
        List<AcademicStaff> staff = normalizedQuery.isBlank()
                ? academicStaffRepository.findByActiveTrueOrderByFullNameAsc(PageRequest.of(0, safeLimit))
                : academicStaffRepository.searchActive(normalizedQuery, PageRequest.of(0, safeLimit));

        return staff.stream().map(this::toAdvisorResponse).toList();
    }

    public Optional<AcademicStaff> findActiveById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return academicStaffRepository.findById(id.trim()).filter(AcademicStaff::isActive);
    }

    @PostConstruct
    public void syncOnColdStart() {
        if (academicStaffRepository.countByActiveTrue() > 0) {
            return;
        }

        try {
            refreshFromOfficialSite();
        } catch (Exception exception) {
            log.warn("Academic staff initial sync failed: {}", exception.getMessage());
        }
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Europe/Istanbul")
    public void scheduledRefresh() {
        try {
            refreshFromOfficialSite();
        } catch (Exception exception) {
            log.warn("Academic staff scheduled sync failed: {}", exception.getMessage());
        }
    }

    public AcademicStaffSyncResponse refreshFromOfficialSite() {
        if (!syncInProgress.compareAndSet(false, true)) {
            throw new IllegalStateException("Academic staff sync is already running");
        }

        try {
            SyncPayload payload = scrapeOfficialStaffDirectory();
            Instant syncedAt = Instant.now();

            long activeCount = transactionTemplate.execute(status -> {
                academicStaffRepository.markAllInactive();
                List<AcademicStaff> entities = payload.records().stream()
                        .map(record -> upsertStaff(record, syncedAt))
                        .toList();
                academicStaffRepository.saveAll(entities);
                return academicStaffRepository.countByActiveTrue();
            });

            return AcademicStaffSyncResponse.builder()
                    .syncedAt(syncedAt)
                    .scannedPageCount(payload.scannedPageCount())
                    .rawRecordCount(payload.rawRecordCount())
                    .uniqueRecordCount(payload.records().size())
                    .activeRecordCount(activeCount)
                    .build();
        } finally {
            syncInProgress.set(false);
        }
    }

    private AcademicStaff upsertStaff(StaffRecord record, Instant syncedAt) {
        AcademicStaff staff = findExisting(record).orElseGet(AcademicStaff::new);

        staff.setAcademicTitle(record.academicTitle());
        staff.setFullName(record.fullName());
        staff.setEmail(emptyToNull(record.email()));
        staff.setFacultyOrUnit(record.facultyOrUnit());
        staff.setDepartment(record.department());
        staff.setRole(record.role());
        staff.setProfileUrl(record.profileUrl());
        staff.setSourcePageUrl(record.sourcePageUrl());
        staff.setSourcePageLastModified(record.sourcePageLastModified());
        staff.setLastSyncedAt(syncedAt);
        staff.setActive(true);

        return staff;
    }

    private Optional<AcademicStaff> findExisting(StaffRecord record) {
        if (record.email() != null && !record.email().isBlank()) {
            Optional<AcademicStaff> byEmail = academicStaffRepository.findByEmailIgnoreCase(record.email());
            if (byEmail.isPresent()) {
                return byEmail;
            }
        }
        if (record.profileUrl() != null && !record.profileUrl().isBlank()) {
            return academicStaffRepository.findByProfileUrl(record.profileUrl());
        }
        return Optional.empty();
    }

    private SyncPayload scrapeOfficialStaffDirectory() {
        String sitemapXml = fetchText(SITEMAP_URL);
        List<SourcePage> pages = selectStaffPages(sitemapXml);
        Map<String, StaffRecord> uniqueRecords = new LinkedHashMap<>();
        int rawRecordCount = 0;

        for (SourcePage page : pages) {
            try {
                String html = fetchText(page.url());
                String pageTitle = extractPageTitle(html);
                List<StaffRecord> records = extractStaffRecords(html, page, pageTitle);
                rawRecordCount += records.size();
                for (StaffRecord record : records) {
                    uniqueRecords.merge(record.uniqueKey(), record, StaffRecord::merge);
                }
            } catch (Exception exception) {
                log.warn("Academic staff page sync skipped for {}: {}", page.url(), exception.getMessage());
            }
        }

        return new SyncPayload(pages.size(), rawRecordCount, new ArrayList<>(uniqueRecords.values()));
    }

    private List<SourcePage> selectStaffPages(String sitemapXml) {
        List<SourcePage> pages = new ArrayList<>();
        Matcher blockMatcher = URL_BLOCK_PATTERN.matcher(sitemapXml);
        while (blockMatcher.find()) {
            String block = blockMatcher.group();
            String url = decodeHtml(matchFirst(LOC_PATTERN, block));
            String lastModified = decodeHtml(matchFirst(LASTMOD_PATTERN, block));

            if (url.isBlank()) {
                continue;
            }

            String path = URI.create(url).getPath();
            boolean staffPage = path.startsWith("/akademik/")
                    && (path.endsWith("/akademik-kadro")
                    || path.endsWith("/akademik-kadro-0")
                    || path.endsWith("/academic-staff-conducting-program"));
            if (staffPage) {
                pages.add(new SourcePage(url, lastModified));
            }
        }

        pages.sort(Comparator.comparing(SourcePage::url));
        return pages;
    }

    private List<StaffRecord> extractStaffRecords(String html, SourcePage page, String pageTitle) {
        List<StaffRecord> records = new ArrayList<>();
        Matcher cardMatcher = STAFF_CARD_PATTERN.matcher(html);
        while (cardMatcher.find()) {
            String cardHtml = cardMatcher.group();
            Matcher staffLinkMatcher = STAFF_LINK_PATTERN.matcher(cardHtml);
            if (!staffLinkMatcher.find()) {
                continue;
            }

            String profileUrl = absoluteUrl(staffLinkMatcher.group(1));
            String displayName = stripTags(staffLinkMatcher.group(2));
            NameParts nameParts = splitTitleAndName(displayName);
            List<String> paragraphs = extractParagraphs(cardHtml);
            String roleDepartmentRaw = paragraphs.stream()
                    .filter(text -> text.contains("|"))
                    .findFirst()
                    .orElse(paragraphs.size() > 1 ? paragraphs.get(1) : "");
            RoleDepartment roleDepartment = splitRoleAndDepartment(roleDepartmentRaw);
            String email = paragraphs.stream()
                    .filter(text -> text.contains("@"))
                    .findFirst()
                    .orElse(decodeHtml(matchFirst(MAILTO_PATTERN, cardHtml)));

            if (nameParts.fullName().isBlank()) {
                continue;
            }

            records.add(new StaffRecord(
                    nameParts.academicTitle(),
                    nameParts.fullName(),
                    normalize(email),
                    paragraphs.isEmpty() ? "" : paragraphs.get(0),
                    roleDepartment.department(),
                    roleDepartment.role(),
                    profileUrl,
                    page.url(),
                    page.lastModified(),
                    pageTitle
            ));
        }

        return records;
    }

    private List<String> extractParagraphs(String html) {
        List<String> paragraphs = new ArrayList<>();
        Matcher matcher = PARAGRAPH_PATTERN.matcher(html);
        while (matcher.find()) {
            String value = stripTags(matcher.group(1));
            if (!value.isBlank()) {
                paragraphs.add(value);
            }
        }
        return paragraphs;
    }

    private NameParts splitTitleAndName(String displayName) {
        for (String title : TITLE_PREFIXES) {
            if (displayName.startsWith(title + " ")) {
                return new NameParts(title, normalize(displayName.substring(title.length())));
            }
        }
        return new NameParts("", normalize(displayName));
    }

    private RoleDepartment splitRoleAndDepartment(String value) {
        String cleaned = normalize(value);
        if (cleaned.isBlank()) {
            return new RoleDepartment("", "");
        }

        if (cleaned.contains("|")) {
            String[] parts = cleaned.split("\\|", 2);
            return new RoleDepartment(normalize(parts[0]), normalize(parts.length > 1 ? parts[1] : ""));
        }

        for (String role : KNOWN_ROLES) {
            if (cleaned.endsWith(" " + role)) {
                return new RoleDepartment(role, normalize(cleaned.substring(0, cleaned.length() - role.length())));
            }
        }

        return new RoleDepartment("", cleaned);
    }

    private AcademicStaffAdvisorResponse toAdvisorResponse(AcademicStaff staff) {
        return AcademicStaffAdvisorResponse.builder()
                .id(staff.getId())
                .academicTitle(staff.getAcademicTitle())
                .fullName(staff.getFullName())
                .displayName(displayName(staff.getAcademicTitle(), staff.getFullName()))
                .email(staff.getEmail())
                .facultyOrUnit(staff.getFacultyOrUnit())
                .department(staff.getDepartment())
                .role(staff.getRole())
                .profileUrl(staff.getProfileUrl())
                .lastSyncedAt(staff.getLastSyncedAt())
                .build();
    }

    public String displayName(String academicTitle, String fullName) {
        if (academicTitle == null || academicTitle.isBlank()) {
            return normalize(fullName);
        }
        return normalize(academicTitle + " " + fullName);
    }

    private String fetchText(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("User-Agent", USER_AGENT)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("HTTP " + response.statusCode());
            }
            return response.body();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not fetch " + url + ": " + exception.getMessage(), exception);
        }
    }

    private String extractPageTitle(String html) {
        return stripTags(matchFirst(TITLE_PATTERN, html));
    }

    private String matchFirst(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? matcher.group(1) : "";
    }

    private String absoluteUrl(String href) {
        if (href == null || href.isBlank()) {
            return "";
        }
        return URI.create(BASE_URL).resolve(decodeHtml(href)).toString();
    }

    private String stripTags(String value) {
        return normalize(decodeHtml(value)
                .replaceAll("(?is)<br\\s*/?>", " ")
                .replaceAll("(?is)<script[\\s\\S]*?</script>", " ")
                .replaceAll("(?is)<style[\\s\\S]*?</style>", " ")
                .replaceAll("<[^>]+>", " "));
    }

    private String normalize(String value) {
        return normalizeText(value);
    }

    private String emptyToNull(String value) {
        String normalized = normalize(value);
        return normalized.isBlank() ? null : normalized;
    }

    private String decodeHtml(String value) {
        return decodeHtmlText(value);
    }

    private static String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return decodeHtmlText(value)
                .replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String decodeHtmlText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String decoded = value
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

        Matcher decimalMatcher = Pattern.compile("&#(\\d+);").matcher(decoded);
        StringBuffer decimalBuffer = new StringBuffer();
        while (decimalMatcher.find()) {
            decimalMatcher.appendReplacement(
                    decimalBuffer,
                    Matcher.quoteReplacement(Character.toString((char) Integer.parseInt(decimalMatcher.group(1))))
            );
        }
        decimalMatcher.appendTail(decimalBuffer);

        Matcher hexMatcher = Pattern.compile("&#x([0-9a-fA-F]+);").matcher(decimalBuffer.toString());
        StringBuffer hexBuffer = new StringBuffer();
        while (hexMatcher.find()) {
            hexMatcher.appendReplacement(
                    hexBuffer,
                    Matcher.quoteReplacement(Character.toString((char) Integer.parseInt(hexMatcher.group(1), 16)))
            );
        }
        hexMatcher.appendTail(hexBuffer);

        return hexBuffer.toString();
    }

    private static String joinUnique(String left, String right) {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        Arrays.stream((left == null ? "" : left).split(";"))
                .map(AcademicStaffService::normalizeText)
                .filter(value -> !value.isBlank())
                .forEach(values::add);
        Arrays.stream((right == null ? "" : right).split(";"))
                .map(AcademicStaffService::normalizeText)
                .filter(value -> !value.isBlank())
                .forEach(values::add);
        return String.join("; ", values);
    }

    private record SourcePage(String url, String lastModified) {
    }

    private record SyncPayload(int scannedPageCount, int rawRecordCount, List<StaffRecord> records) {
    }

    private record NameParts(String academicTitle, String fullName) {
    }

    private record RoleDepartment(String role, String department) {
    }

    private record StaffRecord(
            String academicTitle,
            String fullName,
            String email,
            String facultyOrUnit,
            String department,
            String role,
            String profileUrl,
            String sourcePageUrl,
            String sourcePageLastModified,
            String sourcePageTitle
    ) {
        String uniqueKey() {
            if (email != null && !email.isBlank()) {
                return "email:" + email.toLowerCase(TR_LOCALE);
            }
            if (profileUrl != null && !profileUrl.isBlank()) {
                return "profile:" + profileUrl;
            }
            return "name:" + fullName.toLowerCase(TR_LOCALE);
        }

        StaffRecord merge(StaffRecord other) {
            return new StaffRecord(
                    firstPresent(academicTitle, other.academicTitle),
                    firstPresent(fullName, other.fullName),
                    firstPresent(email, other.email),
                    joinUnique(facultyOrUnit, other.facultyOrUnit),
                    joinUnique(department, other.department),
                    joinUnique(role, other.role),
                    firstPresent(profileUrl, other.profileUrl),
                    joinUnique(sourcePageUrl, other.sourcePageUrl),
                    firstPresent(sourcePageLastModified, other.sourcePageLastModified),
                    joinUnique(sourcePageTitle, other.sourcePageTitle)
            );
        }

        private static String firstPresent(String first, String second) {
            return first != null && !first.isBlank() ? first : second;
        }
    }
}
