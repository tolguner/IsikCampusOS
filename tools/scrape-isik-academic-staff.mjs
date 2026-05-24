import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://www.isikun.edu.tr";
const OUT_DIR = path.resolve("data", "isik-academic-staff");
const USER_AGENT =
  "IsikCampusOS academic staff research script (+local educational research)";
const INCLUDE_PROFILES = !process.argv.includes("--no-profiles");
const profileLimitArg = process.argv.find((arg) => arg.startsWith("--profile-limit="));
const PROFILE_LIMIT = profileLimitArg
  ? Number.parseInt(profileLimitArg.split("=")[1] ?? "", 10)
  : Number.POSITIVE_INFINITY;

const SECTION_TITLES = [
  "Eğitim",
  "Çalışma Alanları",
  "Ödüller",
  "Akademik Makaleler",
  "Akademik Yayınlar",
  "Bildiriler",
  "Projeler",
  "Dersler",
  "Yönetilen Tezler",
  "Patentler",
  "Editörlükler",
  "Hakemlikler",
  "Üyelikler",
  "Sanatsal Faaliyetler",
  "Sergiler",
  "Tasarımlar",
  "İdari Görevler",
];

const TITLE_PREFIXES = [
  "Emeritus Prof. Dr.",
  "Prof. Dr.",
  "Prof.",
  "Doç. Dr.",
  "Dr. Öğr. Üyesi",
  "Dr. Öğretim Görevlisi",
  "Öğretim Görevlisi",
  "Araştırma Görevlisi",
  "Dr.",
];

const BLOCK_TAGS =
  /<\/(?:p|div|li|h1|h2|h3|h4|h5|h6|tr|td|th|span|a|i|strong|em)>/gi;

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

function decodeHtml(value = "") {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, key) => named[key] ?? match);
}

function normalizeWhitespace(value = "") {
  return decodeHtml(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value = "") {
  return normalizeWhitespace(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function htmlToLines(html = "") {
  return decodeHtml(
    html
      .replace(/src="data:image[^"]+"/gi, 'src="DATA_IMAGE"')
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(BLOCK_TAGS, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function absoluteUrl(href) {
  if (!href) return "";
  return new URL(decodeHtml(href), BASE_URL).toString();
}

function extractSitemapEntries(xml) {
  const entries = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];

  for (const block of urlBlocks) {
    const loc = decodeHtml(block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] ?? "");
    const lastmod = decodeHtml(
      block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1] ?? "",
    );

    if (!loc) continue;
    entries.push({ loc, lastmod });
  }

  return entries;
}

function selectStaffListPages(entries) {
  return entries
    .filter(({ loc }) => {
      const url = new URL(loc);
      const pathname = url.pathname;
      return (
        pathname.startsWith("/akademik/") &&
        !pathname.startsWith("/en/") &&
        (pathname.endsWith("/akademik-kadro") ||
          pathname.endsWith("/akademik-kadro-0") ||
          pathname.endsWith("/academic-staff-conducting-program"))
      );
    })
    .sort((a, b) => a.loc.localeCompare(b.loc, "tr"));
}

function splitTitleAndName(fullName) {
  for (const title of TITLE_PREFIXES) {
    if (fullName.startsWith(`${title} `)) {
      return {
        academic_title: title,
        name: fullName.slice(title.length).trim(),
      };
    }
  }

  return { academic_title: "", name: fullName };
}

function splitRoleAndDepartment(value) {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned) return { role: "", department: "" };

  if (cleaned.includes("|")) {
    const [role, ...rest] = cleaned.split("|");
    return {
      role: normalizeWhitespace(role),
      department: normalizeWhitespace(rest.join("|")),
    };
  }

  const knownRoles = [
    "Dekan",
    "Bölüm Başkanı",
    "Müdür",
    "Müdür Yardımcısı",
    "Öğretim Üyesi",
    "Öğretim Elemanı",
    "Öğretim Görevlisi",
    "Araştırma Görevlisi",
  ];

  for (const role of knownRoles) {
    if (cleaned.endsWith(` ${role}`)) {
      return {
        role,
        department: normalizeWhitespace(cleaned.slice(0, -role.length)),
      };
    }
  }

  return { role: "", department: cleaned };
}

function extractPageTitle(html) {
  return stripTags(
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ??
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
      "",
  );
}

function extractStaffCards(html, sourcePage) {
  const cards = [];
  const cardMatches = html.matchAll(
    /<div class="staff-card[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
  );

  for (const match of cardMatches) {
    const cardHtml = match[0];
    const staffLink = [...cardHtml.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([_, href, label]) => ({ href, label: stripTags(label) }))
      .find(({ href }) => href.includes("/akademisyen/"));

    if (!staffLink?.label) continue;

    const paragraphTexts = [...cardHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(([_, value]) => stripTags(value))
      .filter(Boolean);

    const email =
      paragraphTexts.find((text) => /@/.test(text)) ??
      stripTags(cardHtml.match(/mailto:([^"]+)/i)?.[1] ?? "");

    const imageAlt = stripTags(cardHtml.match(/<img[^>]*alt="([^"]*)"/i)?.[1] ?? "");
    const imageSrc = cardHtml.match(/<img[^>]*src="([^"]*)"/i)?.[1] ?? "";
    const { academic_title, name } = splitTitleAndName(staffLink.label);
    const { role, department } = splitRoleAndDepartment(
      paragraphTexts.find((text) => !/@/.test(text) && text.includes("|")) ??
        paragraphTexts[1] ??
        "",
    );

    cards.push({
      source_page_url: sourcePage.loc,
      source_page_lastmod: sourcePage.lastmod,
      source_page_title: sourcePage.title,
      profile_url: absoluteUrl(staffLink.href),
      academic_title,
      name,
      display_name: staffLink.label,
      faculty_or_unit: paragraphTexts[0] ?? "",
      role,
      department,
      role_department_raw: paragraphTexts.find((text) => text.includes("|")) ?? paragraphTexts[1] ?? "",
      email,
      image_alt: imageAlt,
      image_is_embedded_data_url: imageSrc.startsWith("data:image"),
    });
  }

  return cards;
}

function extractLinksByClass(html, className) {
  const pattern = new RegExp(
    `<a[^>]*class="[^"]*${className}[^"]*"[^>]*href="([^"]+)"[^>]*>([\\s\\S]*?)<\\/a>`,
    "gi",
  );

  return [...html.matchAll(pattern)].map(([_, href, text]) => ({
    href: absoluteUrl(href),
    text: stripTags(text),
  }));
}

function sectionLines(lines, title) {
  const start = lines.indexOf(title);
  if (start === -1) return [];

  const nextStarts = SECTION_TITLES
    .filter((candidate) => candidate !== title)
    .map((candidate) => lines.indexOf(candidate, start + 1))
    .filter((index) => index > start);
  const end = nextStarts.length ? Math.min(...nextStarts) : lines.length;

  return lines
    .slice(start + 1, end)
    .filter((line) => !/^Tümünü Gör/.test(line))
    .filter((line) => !["Yıl", "Hazırlayan Ad Soyad", "Tez Adı", "Üniversite"].includes(line));
}

function parseEducation(lines) {
  const entries = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    const periodAndDegree = lines[index];
    const institution = lines[index + 1];
    if (!periodAndDegree || !institution) continue;
    entries.push({ period_and_degree: periodAndDegree, institution });
  }
  return entries;
}

function cleanSectionItems(lines) {
  return lines
    .map((line) => normalizeWhitespace(line.replace(/^,\s*/, "")))
    .filter(Boolean)
    .filter((line) => !["Lisans", "Yüksek Lisans", "Doktora", "Ders Adı Dönemler Dili"].includes(line));
}

function extractProfileDetails(html) {
  const mainHtml = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const lines = htmlToLines(mainHtml);
  const h1 = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const profileInfo = html.match(/<div class="user-details">([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const profileInfoLines = htmlToLines(profileInfo);
  const titleIndex = profileInfoLines.indexOf(h1);

  const office = stripTags(
    html.match(/<span[^>]*class="[^"]*ofis-no[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ??
      "",
  );
  const email = decodeHtml(html.match(/href="mailto:([^"]+)"/i)?.[1] ?? "");
  const linkedin = extractLinksByClass(html, "linkedin")
    .map((link) => link.href)
    .find((href) => /linkedin\.com\/in\//i.test(href));
  const cvLinks = [...html.matchAll(/<a[^>]*href="([^"]*PersonnelCV[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([_, href, label]) => ({ label: stripTags(label), url: absoluteUrl(href) }));

  const education = parseEducation(sectionLines(lines, "Eğitim"));
  const researchAreas = cleanSectionItems(sectionLines(lines, "Çalışma Alanları"));
  const articles = cleanSectionItems(sectionLines(lines, "Akademik Makaleler"));
  const academicPublications = cleanSectionItems(sectionLines(lines, "Akademik Yayınlar"));
  const proceedings = cleanSectionItems(sectionLines(lines, "Bildiriler"));
  const projects = cleanSectionItems(sectionLines(lines, "Projeler"));
  const courses = cleanSectionItems(sectionLines(lines, "Dersler"));
  const theses = cleanSectionItems(sectionLines(lines, "Yönetilen Tezler"));

  return {
    profile_display_name: h1,
    profile_faculty_or_unit: profileInfoLines[titleIndex + 1] ?? "",
    profile_department_role: profileInfoLines[titleIndex + 2] ?? "",
    employment_status: profileInfoLines[titleIndex + 3] ?? "",
    office,
    profile_email: email,
    linkedin,
    cv_links: cvLinks,
    education,
    highest_degree:
      education.find((entry) => /Doktora/i.test(entry.period_and_degree))?.period_and_degree ??
      education[0]?.period_and_degree ??
      "",
    research_areas: researchAreas,
    academic_articles_count: articles.length,
    academic_articles_sample: articles.slice(0, 5),
    academic_publications_count: academicPublications.length,
    academic_publications_sample: academicPublications.slice(0, 5),
    proceedings_count: proceedings.length,
    proceedings_sample: proceedings.slice(0, 5),
    projects_count: projects.length,
    projects_sample: projects.slice(0, 5),
    courses_count: courses.length,
    courses_sample: courses.slice(0, 8),
    supervised_theses_count: theses.length,
    supervised_theses_sample: theses.slice(0, 5),
  };
}

function personKey(record) {
  if (record.email) return `email:${record.email.toLocaleLowerCase("tr-TR")}`;
  if (record.profile_url) return `profile:${record.profile_url}`;
  return `name:${record.display_name.toLocaleLowerCase("tr-TR")}`;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
}

function dedupePeople(records, profileDetails) {
  const groups = new Map();
  for (const record of records) {
    const key = personKey(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  return [...groups.values()]
    .map((items) => {
      const first = items[0];
      const detail = profileDetails[first.profile_url] ?? {};
      return {
        academic_title: first.academic_title,
        name: first.name,
        display_name: first.display_name,
        email: detail.profile_email || first.email,
        profile_url: first.profile_url,
        faculty_or_units: uniq(items.map((item) => item.faculty_or_unit)),
        departments: uniq(items.map((item) => item.department)),
        roles: uniq(items.map((item) => item.role)),
        office: detail.office ?? "",
        linkedin: detail.linkedin ?? "",
        cv_tr_url: detail.cv_links?.find((link) => /Türkçe/i.test(link.label))?.url ?? "",
        cv_en_url: detail.cv_links?.find((link) => /İngilizce|English/i.test(link.label))?.url ?? "",
        employment_status: detail.employment_status ?? "",
        highest_degree: detail.highest_degree ?? "",
        education_count: detail.education?.length ?? 0,
        research_areas: detail.research_areas ?? [],
        academic_articles_count: detail.academic_articles_count ?? 0,
        academic_publications_count: detail.academic_publications_count ?? 0,
        proceedings_count: detail.proceedings_count ?? 0,
        projects_count: detail.projects_count ?? 0,
        courses_count: detail.courses_count ?? 0,
        supervised_theses_count: detail.supervised_theses_count ?? 0,
        source_pages: uniq(items.map((item) => item.source_page_url)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function csvEscape(value) {
  const serialized = Array.isArray(value)
    ? value.join("; ")
    : value && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");

  return /[",\n;]/.test(serialized)
    ? `"${serialized.replace(/"/g, '""')}"`
    : serialized;
}

function toCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

function summarize(records, people, pages, errors) {
  const byUnit = new Map();
  const byDepartment = new Map();
  const byTitle = new Map();

  for (const person of people) {
    for (const unit of person.faculty_or_units) {
      byUnit.set(unit, (byUnit.get(unit) ?? 0) + 1);
    }
    for (const department of person.departments) {
      byDepartment.set(department, (byDepartment.get(department) ?? 0) + 1);
    }
    byTitle.set(person.academic_title, (byTitle.get(person.academic_title) ?? 0) + 1);
  }

  const rank = (map) =>
    [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));

  return {
    generated_at: new Date().toISOString(),
    source: {
      sitemap_url: `${BASE_URL}/sitemap.xml`,
      robots_url: `${BASE_URL}/robots.txt`,
      official_site: BASE_URL,
    },
    page_count: pages.length,
    raw_observation_count: records.length,
    unique_person_count: people.length,
    profile_pages_enriched: people.filter(
      (person) =>
        person.office ||
        person.linkedin ||
        person.education_count ||
        person.academic_articles_count,
    ).length,
    counts_by_academic_title: rank(byTitle),
    counts_by_faculty_or_unit: rank(byUnit),
    top_departments: rank(byDepartment).slice(0, 25),
    errors,
  };
}

function researchNotes(summary) {
  const unitLines = summary.counts_by_faculty_or_unit
    .map((item) => `- ${item.name}: ${item.count}`)
    .join("\n");
  const titleLines = summary.counts_by_academic_title
    .map((item) => `- ${item.name || "Unvan ayrıştırılamadı"}: ${item.count}`)
    .join("\n");

  return `# Işık Üniversitesi Akademik Kadro Veri Notları

Çekim tarihi: ${summary.generated_at}

## Kapsam
- Kaynak: ${summary.source.official_site} resmi web sitesi ve sitemap.
- Sayfa sayısı: ${summary.page_count}
- Ham gözlem sayısı: ${summary.raw_observation_count}
- Tekil akademik personel sayısı: ${summary.unique_person_count}
- Çıktılar kamuya açık profil ve akademik kadro sayfalarından derlenmiştir.

## Birime Göre Tekil Kişi Sayısı
${unitLines}

## Unvana Göre Tekil Kişi Sayısı
${titleLines}

## Notlar
- \`academic_staff_raw.*\` dosyaları kişi-sayfa gözlemlerini içerir; aynı kişi farklı bölüm veya fakülte sayfalarında birden fazla görünebilir.
- \`academic_staff_unique.*\` dosyaları e-posta/profil URL üzerinden tekilleştirilmiş kişileri içerir.
- Profil zenginleştirmesi ofis, LinkedIn, CV bağlantıları, eğitim sayısı, çalışma alanları ve yayın/proje/ders sayılarını çıkarmaya çalışır.
- Akademik yayın, bildiri, proje ve ders sayıları web sayfasındaki görünür ve gizli "Tümünü Gör" bloklarının metinlerinden türetilmiştir; resmi sayfa formatı değişirse yeniden doğrulanmalıdır.
`;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );

  return results;
}

async function writeOutputs(records, people, profileDetails, pages, errors) {
  const summary = summarize(records, people, pages, errors);

  const rawColumns = [
    "source_page_url",
    "source_page_lastmod",
    "source_page_title",
    "profile_url",
    "academic_title",
    "name",
    "display_name",
    "faculty_or_unit",
    "role",
    "department",
    "role_department_raw",
    "email",
  ];
  const uniqueColumns = [
    "academic_title",
    "name",
    "display_name",
    "email",
    "profile_url",
    "faculty_or_units",
    "departments",
    "roles",
    "office",
    "linkedin",
    "cv_tr_url",
    "cv_en_url",
    "employment_status",
    "highest_degree",
    "education_count",
    "research_areas",
    "academic_articles_count",
    "academic_publications_count",
    "proceedings_count",
    "projects_count",
    "courses_count",
    "supervised_theses_count",
    "source_pages",
  ];

  await writeFile(
    path.join(OUT_DIR, "academic_staff_raw.json"),
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "academic_staff_raw.csv"),
    `${toCsv(records, rawColumns)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "academic_staff_unique.json"),
    `${JSON.stringify(people, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "academic_staff_unique.csv"),
    `${toCsv(people, uniqueColumns)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "profile_details.json"),
    `${JSON.stringify(profileDetails, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(OUT_DIR, "research_notes.md"),
    researchNotes(summary),
    "utf8",
  );

  return summary;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const sitemapXml = await fetchText(`${BASE_URL}/sitemap.xml`);
  const pages = selectStaffListPages(extractSitemapEntries(sitemapXml));
  const errors = [];
  const records = [];

  console.log(`Found ${pages.length} academic staff list pages.`);

  await mapWithConcurrency(pages, 4, async (page, index) => {
    try {
      const html = await fetchText(page.loc);
      page.title = extractPageTitle(html);
      const cards = extractStaffCards(html, page);
      records.push(...cards);
      console.log(`${index + 1}/${pages.length} ${cards.length} staff - ${page.loc}`);
    } catch (error) {
      errors.push({ url: page.loc, message: error.message });
      console.warn(`Failed list page: ${page.loc} ${error.message}`);
    }
  });

  records.sort((a, b) =>
    `${a.source_page_url} ${a.name}`.localeCompare(`${b.source_page_url} ${b.name}`, "tr"),
  );

  const profileUrls = INCLUDE_PROFILES
    ? uniq(records.map((record) => record.profile_url)).slice(0, PROFILE_LIMIT)
    : [];
  const profileDetails = {};

  console.log(`Enriching ${profileUrls.length} profile pages.`);

  await mapWithConcurrency(profileUrls, 3, async (profileUrl, index) => {
    try {
      const html = await fetchText(profileUrl);
      profileDetails[profileUrl] = extractProfileDetails(html);
      console.log(`${index + 1}/${profileUrls.length} profile - ${profileUrl}`);
    } catch (error) {
      errors.push({ url: profileUrl, message: error.message });
      console.warn(`Failed profile page: ${profileUrl} ${error.message}`);
    }
  });

  const people = dedupePeople(records, profileDetails);
  const summary = await writeOutputs(records, people, profileDetails, pages, errors);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
