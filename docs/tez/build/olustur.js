// IsikCampusOS Tezi — Markdown -> DOCX üretici
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, TableOfContents, PageNumber, NumberFormat,
  SectionType, PageBreak, VerticalAlign
} = require("docx");

const TEZ = path.join(__dirname, "..");
const DIAG = path.join(__dirname, "diagrams");
const FONT = "Palatino Linotype";
const SZ = 24;            // 12pt gövde (half-points)
const LINE = 360;         // 1.5 satır aralığı
const INDENT = 720;       // 1.27 cm ilk satır girintisi (dxa)
const CONTENT_W = 9026;   // A4 - 2x1440 kenar

// ---------- inline biçim (bold/italic/code) ----------
function runs(text, base = {}) {
  const out = [];
  // $...$ -> italik; **..** bold; *..* italik; `..` code
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: deLatex(text.slice(last, m.index)), font: FONT, size: SZ, ...base }));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, font: FONT, size: SZ, ...base }));
    else if (tok.startsWith("`")) out.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas", size: SZ, ...base }));
    else if (tok.startsWith("$")) out.push(new TextRun({ text: deLatex(tok.slice(1, -1)), italics: true, font: FONT, size: SZ, ...base }));
    else out.push(new TextRun({ text: tok.slice(1, -1), italics: true, font: FONT, size: SZ, ...base }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: deLatex(text.slice(last)), font: FONT, size: SZ, ...base }));
  if (out.length === 0) out.push(new TextRun({ text: "", font: FONT, size: SZ, ...base }));
  return out;
}

// LaTeX -> okunabilir metin (kullanıcı Word denklem editörüyle düzeltecek)
function deLatex(s) {
  return s
    .replace(/\\sum_\{([^}]*)\}\^\{([^}]*)\}/g, "Σ($1..$2) ")
    .replace(/\\sum/g, "Σ")
    .replace(/\\in/g, "∈").replace(/\\cap/g, "∩").replace(/\\cup/g, "∪")
    .replace(/\\le/g, "≤").replace(/\\ge/g, "≥").replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·").replace(/\\beta/g, "β").replace(/\\ge\b/g, "≥")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\dots|\\ldots/g, "…")
    .replace(/\\{/g, "{").replace(/\\}/g, "}")
    .replace(/\\,/g, " ").replace(/\\\\/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")  // kalan komutlar
    .replace(/[_^]\{([^}]*)\}/g, "$1")
    .replace(/[_^]([a-zA-Z0-9])/g, "$1");
}

const bodyPara = (text) => new Paragraph({
  children: runs(text),
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 0, line: LINE, lineRule: "auto" },
  indent: { firstLine: INDENT },
});

// ---------- başlık seviyesi: numara desenine göre ----------
function headingLevel(text) {
  if (/^BÖLÜM\s+\d+/i.test(text)) return 1;
  const num = text.match(/^(\d+(?:\.\d+)*)\.?\s/);
  if (num) {
    const seg = num[1].split(".").length;
    if (seg >= 3) return 5;
    if (seg === 2) return 3;
    return 1;
  }
  return 1; // numarasız özel başlık (ÖZET, KAYNAKÇA vb.)
}
const HLV = { 1: HeadingLevel.HEADING_1, 3: HeadingLevel.HEADING_3, 5: HeadingLevel.HEADING_5 };

// ---------- PNG boyut (oran koru) ----------
function imgSize(file) {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  const maxW = 600, maxH = 760;
  let dw = maxW, dh = Math.round(maxW * h / w);
  if (dh > maxH) { dh = maxH; dw = Math.round(maxH * w / h); }
  return { width: dw, height: dh, buf: b };
}

function figure(num, title) {
  const png = path.join(DIAG, `sekil_${num.replace(/\./g, "_")}.png`);
  const children = [];
  if (fs.existsSync(png)) {
    const im = imgSize(png);
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: im.buf, transformation: { width: im.width, height: im.height }, altText: { title: `Şekil ${num}`, description: title, name: `Sekil${num}` } })],
    }));
  } else {
    // ekran görüntüsü yer tutucu (Bölüm 4)
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      border: { top: { style: BorderStyle.DASHED, size: 6, color: "999999" }, bottom: { style: BorderStyle.DASHED, size: 6, color: "999999" }, left: { style: BorderStyle.DASHED, size: 6, color: "999999" }, right: { style: BorderStyle.DASHED, size: 6, color: "999999" } },
      children: [new TextRun({ text: `[ Ekran görüntüsü buraya eklenecek — Şekil ${num} ]`, italics: true, color: "777777", font: FONT, size: SZ })],
    }));
  }
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 160, line: LINE, lineRule: "auto" },
    children: [new TextRun({ text: `Şekil ${num}: ${title}`, italics: true, font: FONT, size: 22 })],
  }));
  return children;
}

function tableCaption(num, title) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60, line: LINE, lineRule: "auto" },
    children: [new TextRun({ text: `Tablo ${num}: ${title}`, italics: true, font: FONT, size: 22 })],
  });
}

// ---------- markdown tabloyu docx tabloya ----------
function buildTable(rows) {
  const cells = rows.map(r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
  const ncol = cells[0].length;
  const colW = Math.floor(CONTENT_W / ncol);
  const widths = Array(ncol).fill(colW);
  const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const trs = [];
  cells.forEach((row, ri) => {
    trs.push(new TableRow({
      tableHeader: ri === 0,
      children: row.map((cell, ci) => new TableCell({
        borders, width: { size: widths[ci], type: WidthType.DXA },
        shading: ri === 0 ? { fill: "D9E2F3", type: ShadingType.CLEAR, color: "auto" } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: runs(cell, ri === 0 ? { bold: true } : {}) })],
      })),
    }));
  });
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}

// ---------- bir markdown dosyasını paragraf dizisine çevir ----------
function parseMd(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const out = [];
  let i = 0;
  let pendingTable = null; // tablo caption beklemede
  while (i < lines.length) {
    let line = lines[i];
    const t = line.trim();

    // boş
    if (t === "" || t === "---") { i++; continue; }

    // başlık
    const hm = t.match(/^#{1,6}\s+(.*)/);
    if (hm) {
      const txt = hm[1].replace(/\*/g, "").trim();
      const lv = headingLevel(txt);
      out.push(new Paragraph({
        heading: HLV[lv], spacing: { before: lv === 1 ? 240 : 180, after: 120, line: LINE, lineRule: "auto" },
        children: [new TextRun({ text: txt, bold: true, font: FONT })],
      }));
      i++; continue;
    }

    // kod bloğu (mermaid) -> atla (PNG zaten caption ile gömülüyor)
    if (t.startsWith("```")) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) i++;
      i++; continue;
    }

    // blockquote / etiketler
    if (t.startsWith(">")) {
      const q = t.replace(/^>\s?/, "");
      let fm = q.match(/\*\*\[ŞEKİL\s+([\d.]+)\s*—\s*([^\]]+)\]\*\*/);
      if (fm) { figure(fm[1].trim(), fm[2].trim()).forEach(p => out.push(p)); i++; continue; }
      let tm = q.match(/\*\*\[TABLO\s+([\d.]+)\s*—\s*([^\]]+)\]\*\*/);
      if (tm) { pendingTable = { num: tm[1].trim(), title: tm[2].trim() }; i++; continue; }
      // yazım rehberi notları -> tezde görünmesin
      if (/yazım rehberi|Önerilen:/i.test(q)) { i++; continue; }
      // diğer notlar (Tasarım notu vb.) -> italik küçük paragraf (içerik)
      out.push(new Paragraph({
        spacing: { after: 80, line: LINE, lineRule: "auto" }, indent: { left: 360 },
        children: runs(q.replace(/^\*\*Not[^:]*:\*\*\s*/i, "").replace(/^\*\*([^*]+)\*\*/, "$1"), { italics: true }),
      }));
      i++; continue;
    }

    // tablo
    if (t.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim()); i++; }
      const data = rows.filter(r => !/^\|[\s|:-]+\|$/.test(r)); // ayraç satırını at
      if (pendingTable) { out.push(tableCaption(pendingTable.num, pendingTable.title)); pendingTable = null; }
      out.push(buildTable(data));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      continue;
    }

    // madde listesi
    if (/^[-*]\s+/.test(t)) {
      out.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 0, line: LINE, lineRule: "auto" }, alignment: AlignmentType.JUSTIFIED,
        children: runs(t.replace(/^[-*]\s+/, "")),
      }));
      i++; continue;
    }
    // numaralı liste (düz metin numara — reset sorunu olmaması için)
    const nm = t.match(/^(\d+)\.\s+(.*)/);
    if (nm) {
      out.push(new Paragraph({
        spacing: { after: 0, line: LINE, lineRule: "auto" }, alignment: AlignmentType.JUSTIFIED,
        indent: { left: 720, hanging: 360 },
        children: runs(nm[1] + ".  " + nm[2]),
      }));
      i++; continue;
    }
    // denklem $$...$$ (tek/çok satır)
    if (t.startsWith("$$")) {
      let eq = t.replace(/\$\$/g, "");
      if (t === "$$") { eq = ""; i++; while (i < lines.length && lines[i].trim() !== "$$") { eq += lines[i] + " "; i++; } }
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80, line: LINE, lineRule: "auto" },
        children: [new TextRun({ text: deLatex(eq).trim(), italics: true, font: FONT, size: SZ })],
      }));
      i++; continue;
    }

    // normal paragraf
    out.push(bodyPara(t));
    i++;
  }
  return out;
}

// ---------- ÖN KISIMLAR ----------
const centerBig = (text, sz, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 120, line: LINE, lineRule: "auto" },
  children: [new TextRun({ text, font: FONT, size: sz, ...opts })],
});
const blank = (n = 1) => Array(n).fill(0).map(() => new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: SZ })] }));

function kapak() {
  return [
    ...blank(2),
    centerBig("IŞIK ÜNİVERSİTESİ", 28, { bold: true }),
    centerBig("İKTİSADİ, İDARİ VE SOSYAL BİLİMLER FAKÜLTESİ", 24, { bold: true }),
    centerBig("Yönetim Bilişim Sistemleri Bölümü", 24),
    ...blank(3),
    centerBig("IsikCampusOS:", 32, { bold: true }),
    centerBig("Bütünleşik Bir Akıllı Kampüs Platformu", 32, { bold: true }),
    ...blank(1),
    centerBig("Üniversite İçi Sosyal ve Pratik Süreçlerin Mikroservis Mimarisi", 24, { italics: true }),
    centerBig("Tabanlı Bir Süper-Uygulama ile Bütünleştirilmesi", 24, { italics: true }),
    ...blank(2),
    centerBig("Lisans Tezi", 24, { italics: true }),
    ...blank(4),
    centerBig("Tolga Olguner", 24, { bold: true }),
    centerBig("23YÖBİ1053", 24),
    ...blank(2),
    centerBig("Danışman: Dr. Şahin Aydın", 24),
    ...blank(4),
    centerBig("İstanbul, Haziran 2026", 24),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}
function ithaf() {
  return [
    ...blank(8),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: LINE, lineRule: "auto" },
      children: [new TextRun({ text: "Her zaman iyi bir insan olma felsefesiyle beni yetiştiren aileme…", italics: true, font: FONT, size: SZ })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}
function tesekkur() {
  const p1 = "Bu tezin ortaya çıkmasında emeği geçen, yalnızca akademik bir danışman olmanın çok ötesinde, üniversite hayatım boyunca bana yol gösteren ve gerçek bir akıl hocası olan değerli danışmanım Dr. Şahin Aydın'a en içten şükranlarımı sunarım. Onun bilgisi, sabrı ve her koşulda hissettirdiği desteği, bu çalışmanın her aşamasında bana güç verdi. Yalnızca bilgisini değil, bir mesleğe ve hayata bakış açısını da paylaşan; karşılaştığım her zorlukta yanımda olduğunu bilmenin huzurunu yaşatan bu kıymetli insanın öğrencisi olmaktan onur duyuyorum.";
  const p2 = "Bugünlere gelmemde en büyük paya sahip olan, bana her zaman dürüstlüğü, çalışkanlığı ve her şeyden önce iyi bir insan olmayı öğreten aileme; karşılıksız sevgileri ve sarsılmaz inançları için minnettarım. Bu yolculuğun her anında yanımda olan tüm dostlarıma da teşekkür ederim.";
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "TEŞEKKÜR", bold: true, font: FONT })] }),
    bodyPara(p1), bodyPara(p2),
    new Paragraph({ spacing: { before: 240, line: LINE, lineRule: "auto" }, children: [new TextRun({ text: "Tolga Olguner", font: FONT, size: SZ })] }),
    new Paragraph({ spacing: { line: LINE, lineRule: "auto" }, children: [new TextRun({ text: "İstanbul, Haziran 2026", font: FONT, size: SZ })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Şekiller / Tablolar listesi (statik)
function listeParas(baslik, items) {
  const out = [new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: baslik, bold: true, font: FONT })] })];
  items.forEach(it => out.push(new Paragraph({
    spacing: { after: 0, line: LINE, lineRule: "auto" }, tabStops: [{ type: "right", position: CONTENT_W, leader: "dot" }],
    children: [new TextRun({ text: it, font: FONT, size: SZ })],
  })));
  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

// ---------- DÖKÜMAN ----------
const styles = {
  default: { document: { run: { font: FONT, size: SZ }, paragraph: { spacing: { line: LINE, lineRule: "auto", after: 0 } } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 32, bold: true, color: "000000" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0, keepNext: true } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true, color: "000000" }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2, keepNext: true } },
    { id: "Heading5", name: "Heading 5", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true, color: "000000" }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 4, keepNext: true } },
  ],
};
const numbering = { config: [ { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] } ] };

const pageA4 = { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } };
const romanFooter = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] });
const arabicFooter = romanFooter;

// içindekiler + listeler + abstract + kısaltmalar
const onParts = [
  ...kapak(),
  ...ithaf(),
  ...tesekkur(),
  // İçindekiler
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "İÇİNDEKİLER", bold: true, font: FONT })] }),
  new TableOfContents("İçindekiler", { hyperlink: true, headingStyleRange: "1-5" }),
  new Paragraph({ children: [new PageBreak()] }),
  // Şekiller Listesi (statik)
  ...listeParas("ŞEKİLLER LİSTESİ", [
    "Şekil 3.1: Genel Sistem Mimarisi", "Şekil 3.2: JWT Tabanlı Kimlik Doğrulama Akışı",
    "Şekil 3.3: Olay Güdümlü Kullanıcı Kaydı Akışı", "Şekil 3.4: Kavramsal Varlık-İlişki (ER) Diyagramı",
    "Şekil 3.5: Etkinlik Durum Makinesi", "Şekil 3.6: Rezervasyon Çakışma Kontrolü Akışı",
    "Şekil 3.7: Sipariş Durum Makinesi", "Şekil 3.8: MicroJob İlan Durum Makinesi",
    "Şekil 3.9: Kararlı Eşleştirme (SPA-T) Akış Şeması",
    "Şekil 4.1: Giriş ve Kimlik Doğrulama Ekranı", "Şekil 4.2: Öğrenci Ana Paneli",
    "Şekil 4.3: Kulüp ve Etkinlik Ekranları", "Şekil 4.4: Tesis Rezervasyon Ekranı", "Şekil 4.5: SKS Onay Paneli",
  ]),
  ...listeParas("TABLOLAR LİSTESİ", [
    "Tablo 3.1: Servis Kataloğu", "Tablo 3.2: Kafka Olay Akışları", "Tablo 3.3: Servis–Veri Tabanı Eşleşmesi",
    "Tablo 4.1: Temel Teknoloji Yığını", "Tablo 5.1: İşlevsel Gereksinimlerin Karşılanma Durumu",
  ]),
  // Özet / Abstract / Kısaltmalar (markdown'dan)
  ...parseMd(path.join(TEZ, "ozet_abstract.md")),
  new Paragraph({ children: [new PageBreak()] }),
  ...parseMd(path.join(TEZ, "kisaltmalar.md")),
];

const anaParts = [];
["bolum1_giris", "bolum2_literatur_taramasi", "bolum3_yontem", "bolum4_gelistirme", "bolum5_degerlendirme", "bolum6_sonuc", "kaynakca"].forEach((f, idx) => {
  if (idx > 0) anaParts.push(new Paragraph({ children: [new PageBreak()] }));
  parseMd(path.join(TEZ, f + ".md")).forEach(p => anaParts.push(p));
});

const doc = new Document({
  styles, numbering,
  features: { updateFields: true },
  sections: [
    { properties: { page: { ...pageA4, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: romanFooter }, children: onParts },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...pageA4, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, footers: { default: arabicFooter }, children: anaParts },
  ],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, "IsikCampusOS_Tez.docx");
  fs.writeFileSync(out, buf);
  console.log("OLUŞTU:", out, "(", (buf.length / 1024).toFixed(0), "KB )");
});
