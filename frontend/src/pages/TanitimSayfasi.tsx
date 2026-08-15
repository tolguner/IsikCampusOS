import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, type Variants } from 'framer-motion';
import {
  ArrowDown, Sparkles, ShieldCheck, Fingerprint, Network,
  Calendar, Building2, Utensils, Car, FolderKanban, Briefcase,
  MessageSquare, BellRing, Users, Server, Database, Workflow,
  Lock, GitBranch, Boxes, Layers, Zap, CheckCircle2, Radio,
  Megaphone, ShoppingBag, Route, BadgeCheck, ScrollText, Quote,
  LogIn, Smartphone,
} from 'lucide-react';
import { YOLLAR } from '../yardimcilar/yollar';
import { TemaDegistirici } from '../components/duzen/TemaDegistirici';

/* ------------------------------------------------------------------ */
/*  Animasyon                                                         */
/* ------------------------------------------------------------------ */
const EASE = [0.22, 1, 0.36, 1] as const;

const sahne: Variants = {
  gizli: {},
  gor: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};
const gel: Variants = {
  gizli: { opacity: 0, y: 42 },
  gor: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
const buyu: Variants = {
  gizli: { opacity: 0, scale: 0.85 },
  gor: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/*  Veri (gerçek proje durumuyla doğrulanmış)                          */
/* ------------------------------------------------------------------ */
const slaytlar = [
  { id: 'kapak', etiket: 'Kapak' },
  { id: 'problem', etiket: 'Problem' },
  { id: 'cozum', etiket: 'Çözüm' },
  { id: 'moduller', etiket: 'Modüller' },
  { id: 'yetenekler', etiket: 'Platform' },
  { id: 'mimari', etiket: 'Mimari' },
  { id: 'olcek', etiket: 'Ölçek' },
  { id: 'teknoloji', etiket: 'Teknoloji' },
  { id: 'roller', etiket: 'Roller' },
  { id: 'gelecek', etiket: 'Gelecek' },
  { id: 'kapanis', etiket: 'Kapanış' },
];

const moduller = [
  { ad: 'ClubHub', alt: 'Kulüp & Etkinlik', icon: Calendar, renk: 'from-violet-500 to-purple-600',
    ozet: 'Kulüp yaşam döngüsü, SKS onayı, etkinlik + RSVP & yedek liste, QR check-in, dijital sertifika.' },
  { ad: 'SpotReserve', alt: 'Spor Tesisi Rezervasyonu', icon: Building2, renk: 'from-cyan-500 to-blue-600',
    ozet: 'Tesis & kaynak yönetimi, uygunluk kuralları, çakışmasız rezervasyon, yoklama/check-in.' },
  { ad: 'UniEats', alt: 'Kampüs Yemek Siparişi', icon: Utensils, renk: 'from-orange-500 to-red-500',
    ozet: 'Satıcı/menü, seçenek & ekstralar, kampanya, favori, sipariş durum makinesi, ciro.' },
  { ad: 'CampusRide', alt: 'Paylaşımlı Yolculuk', icon: Car, renk: 'from-emerald-500 to-teal-600',
    ozet: 'İlan/talep, rota önizleme, araç/ehliyet doğrulama, puanlama, şikayet & yönetim logları.' },
];

const yetenekler = [
  { icon: Fingerprint, baslik: 'Tek Kimlik', metin: 'Üniversite e-postasıyla tek giriş; tüm modüller aynı kimliği paylaşır.' },
  { icon: BellRing, baslik: 'Anlık Bildirim', metin: 'notification-service: in-app bildirim + SSE canlı akış, modüller arası fan-out.' },
  { icon: MessageSquare, baslik: 'Bağlam Bazlı Mesajlaşma', metin: 'message-service: yemek/yolculuk bağlamına bağlı konuşmalar, canlı mesaj akışı.' },
];

const mimariServisler = [
  { ad: 'auth', port: '8081' }, { ad: 'profile', port: '8082' },
  { ad: 'notification', port: '8083' }, { ad: 'facility', port: '8086' },
  { ad: 'food', port: '8087' }, { ad: 'ride', port: '8088' },
  { ad: 'club', port: '8089' }, { ad: 'message', port: '8090' },
];

const olcek = [
  { sayi: '10', etiket: 'Mikroservis', icon: Server },
  { sayi: '4', etiket: 'Aktif modül', icon: Boxes },
  { sayi: '8', etiket: 'Bağımsız veritabanı', icon: Database },
  { sayi: '50', etiket: 'Veritabanı tablosu', icon: Layers },
];

const teknoloji = [
  { baslik: 'Backend', renk: 'text-emerald-300', icon: Server, ogeler: ['Java 21 · Spring Boot 3', 'Spring Cloud Gateway', 'Eureka servis keşfi', 'JWT + Spring Security'] },
  { baslik: 'Frontend', renk: 'text-cyan-300', icon: Layers, ogeler: ['React 19 + TypeScript', 'Vite', 'Zustand', 'Tailwind + Framer Motion'] },
  { baslik: 'Veri & Olay', renk: 'text-violet-300', icon: Database, ogeler: ['PostgreSQL (db-per-service)', 'Apache Kafka + Zookeeper', 'Flyway migration', 'Redis'] },
  { baslik: 'Altyapı', renk: 'text-orange-300', icon: Boxes, ogeler: ['Docker Compose', 'Zipkin (tracing)', 'Mailpit', 'Monorepo'] },
];

const roller = [
  { ad: 'Öğrenci', icon: Users, metin: 'Kulüp, etkinlik, tesis, yemek ve yolculuk akışlarının ana kullanıcısı.' },
  { ad: 'Kulüp Başkanı', icon: ShieldCheck, metin: 'Kendi kulübü için etkinlik, duyuru ve üye yönetimi.' },
  { ad: 'SKS Daire Başkanlığı', icon: BadgeCheck, metin: 'Kulüp/etkinlik onayı, başkan atama, performans izleme.' },
  { ad: 'Öğrenci İşleri D. Başkanlığı', icon: ScrollText, metin: 'Öğrenci hesabı oluşturma ve durum yönetimi.' },
  { ad: 'Spor Müdürlüğü', icon: Building2, metin: 'Tesis kaynakları, politika ve uygunluk kuralları.' },
  { ad: 'İşletme Yöneticisi', icon: ShoppingBag, metin: 'Satıcı profili, menü, kampanya, çalışma saatleri, ciro ve personel yönetimi.' },
  { ad: 'İşletme Personeli', icon: Utensils, metin: 'Bağlı olduğu işletmenin sipariş operasyonlarını yürütür.' },
  { ad: 'Destek Hizmetleri', icon: Megaphone, metin: 'UniEats işletme/satıcı yönetimi ve destek duyuruları.' },
  { ad: 'Ulaşım Hizmetleri Müdürlüğü', icon: Route, metin: 'Sürücü/araç doğrulama, şikayet ve yolculuk logları.' },
  { ad: 'Sistem Yöneticisi', icon: Lock, metin: 'Roller, güvenlik ve sistem geneli yönetim.' },
];

const gelecek = [
  { no: '01', ad: 'ProjectMatch', alt: 'Proje Eşleştirme', icon: FolderKanban, renk: 'from-indigo-500 to-violet-600',
    metin: 'Beceri/ilgi profillerine göre kararlı (stable matching) eşleştirme; ilan, görünürlük ve başvuru.' },
  { no: '02', ad: 'MicroJob', alt: 'Kampüs İçi Mikro İş', icon: Briefcase, renk: 'from-pink-500 to-rose-600',
    metin: 'Kısa süreli iş ilanı, teklif/anlaşma akışı ve çift yönlü itibar göstergeleri.' },
  { no: '03', ad: 'Mobil Uygulama', alt: 'iOS & Android', icon: Smartphone, renk: 'from-orange-500 to-amber-500',
    metin: 'API Gateway’i tüketen native uygulama: push bildirim, cepte QR check-in, konum tabanlı CampusRide.' },
];

/* ------------------------------------------------------------------ */
/*  Slayt sarmalayıcı                                                  */
/* ------------------------------------------------------------------ */
type SlideProps = {
  id: string; no: number; etiket: string; toplam: number;
  onEnter: (i: number) => void; index: number;
  children: React.ReactNode; className?: string;
};

const Slide = ({ id, no, etiket, toplam, onEnter, index, children, className = '' }: SlideProps) => (
  <motion.section
    id={id}
    variants={sahne}
    initial="gizli"
    whileInView="gor"
    viewport={{ amount: 0.45 }}
    onViewportEnter={() => onEnter(index)}
    className={`snap-start relative flex min-h-screen w-full flex-col justify-center px-6 py-24 sm:px-10 lg:px-16 ${className}`}
  >
    <motion.div variants={gel} className="pointer-events-none absolute left-6 top-20 flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white/35 sm:left-10 lg:left-16">
      <span className="text-cyan-300/80">{String(no).padStart(2, '0')}</span>
      <span className="h-px w-8 bg-white/20" />
      {etiket}
      <span className="text-white/20">/ {String(toplam).padStart(2, '0')}</span>
    </motion.div>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </motion.section>
);

const Baslik = ({ children }: { children: React.ReactNode }) => (
  <motion.h2 variants={gel} className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
    {children}
  </motion.h2>
);

/* ------------------------------------------------------------------ */
/*  Sayfa                                                              */
/* ------------------------------------------------------------------ */
export const TanitimSayfasi = () => {
  const kaydirma = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);
  const { scrollYProgress } = useScroll({ container: kaydirma });
  const ilerleme = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  const slaytaGit = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="theme-page relative h-screen overflow-hidden bg-[#060c24] text-white">
      {/* Üst ilerleme çubuğu */}
      <motion.div style={{ scaleX: ilerleme }} className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500" />

      {/* Ambient arkaplan (sabit) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="theme-app-gradient absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.26),transparent_38%),radial-gradient(circle_at_82%_16%,rgba(64,108,250,0.26),transparent_40%),radial-gradient(circle_at_50%_110%,rgba(45,212,191,0.14),transparent_48%),linear-gradient(160deg,#060c24,#0a153a_52%,#07112a)]" />
        <div className="animate-float absolute bottom-[-12%] left-[-6%] h-[560px] w-[560px] rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient-cyan-strong) 0%, var(--ambient-cyan-soft) 42%, transparent 70%)' }} />
        <div className="animate-float-reverse absolute top-[-8%] right-[-4%] h-[520px] w-[520px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(64,108,250,0.40) 0%, rgba(56,130,246,0.16) 42%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 78%)' }} />
      </div>

      {/* Üst bar (sabit) */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to={YOLLAR.giris} className="flex items-center gap-3 transition hover:opacity-85">
          <img src="/isik-ikon.png" alt="Işık Üniversitesi" className="h-7 w-7 object-contain" />
          <span className="text-base font-bold text-white">Işık<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CampusOS</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <TemaDegistirici />
          <Link to={YOLLAR.giris} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
            <LogIn className="h-4 w-4" /><span className="hidden sm:inline">Giriş</span>
          </Link>
        </div>
      </div>

      {/* Sağ slayt göstergesi (sabit) */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        {slaytlar.map((s, i) => (
          <button key={s.id} onClick={() => slaytaGit(s.id)} className="group flex items-center gap-2" aria-label={s.etiket}>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${aktif === i ? 'text-cyan-200 opacity-100' : 'text-white/40 opacity-0 group-hover:opacity-100'}`}>{s.etiket}</span>
            <span className={`block rounded-full transition-all duration-300 ${aktif === i ? 'h-6 w-1.5 bg-cyan-300' : 'h-1.5 w-1.5 bg-white/25 group-hover:bg-white/50'}`} />
          </button>
        ))}
      </div>

      {/* KAYDIRMA KONTEYNERİ — her bölüm bir slayt */}
      <div ref={kaydirma} className="h-screen snap-y snap-mandatory overflow-y-auto overflow-x-hidden scroll-smooth">

        {/* 00 — KAPAK */}
        <Slide id="kapak" no={1} etiket="Kapak" toplam={slaytlar.length} onEnter={setAktif} index={0}>
          <motion.div variants={gel} className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
            <Sparkles className="h-4 w-4" /> Işık Üniversitesi · Kapalı dijital kampüs platformu
          </motion.div>
          <Baslik>
            Kampüs artık<br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">tek işletim sistemi.</span>
          </Baslik>
          <motion.p variants={gel} className="mt-7 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
            Kulüpler, tesis rezervasyonu, yemek siparişi ve paylaşımlı yolculuk; tek kimlik, tek geçit ve
            ortak bir güven katmanı altında birleşiyor. Mikroservis tabanlı bir kampüs platformu.
          </motion.p>
          <motion.div variants={gel} className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={() => slaytaGit('problem')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-100">
              Sunuma başla <ArrowDown className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-2 text-base font-semibold text-white/50">
              <ShieldCheck className="h-5 w-5 text-emerald-300" /> Yalnızca doğrulanmış üyelere açık
            </span>
          </motion.div>
          <motion.div variants={gel} className="mt-16 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/35">
            <ArrowDown className="h-4 w-4 animate-bounce" /> Kaydır
          </motion.div>
        </Slide>

        {/* 01 — PROBLEM */}
        <Slide id="problem" no={2} etiket="Problem" toplam={slaytlar.length} onEnter={setAktif} index={1}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-rose-300/80">Problem</motion.span>
          <Baslik>Kampüs yaşamı <span className="bg-gradient-to-r from-rose-300 to-orange-300 bg-clip-text text-transparent">dağınık kanallara</span> sıkışmış.</Baslik>
          <motion.p variants={gel} className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Kulüp duyuruları, tesis talepleri, yemek ve ulaşım koordinasyonu bugün denetimsiz harici kanallarda yürüyor.
          </motion.p>
          <motion.div variants={sahne} className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Megaphone, b: 'Dağınık iletişim', m: 'Duyurular WhatsApp/Instagram gruplarına, e-postalara ve manuel listelere bölünmüş.' },
              { icon: ShieldCheck, b: 'Denetimsiz güven', m: 'Harici kanallarda kimin doğrulanmış üye olduğu belirsiz; kötüye kullanım kolay.' },
              { icon: Workflow, b: 'Tutarsız deneyim', m: 'Her süreç farklı bir araçta; öğrenci her seferinde yeni bir akış öğrenir.' },
            ].map((p) => (
              <motion.div key={p.b} variants={gel} className="theme-card rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300"><p.icon className="h-6 w-6" /></div>
                <h3 className="mb-2 text-xl font-black text-white">{p.b}</h3>
                <p className="text-base leading-7 text-white/60">{p.m}</p>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 02 — ÇÖZÜM */}
        <Slide id="cozum" no={3} etiket="Çözüm" toplam={slaytlar.length} onEnter={setAktif} index={2}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300/80">Çözüm & Vizyon</motion.span>
          <Baslik>Tek omurga, <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">tek güven katmanı.</span></Baslik>
          <motion.p variants={gel} className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
            IsikCampusOS dağınıklığı tek bir güvenli ve tutarlı deneyim omurgasında birleştirir. Sisteme yalnızca doğrulanmış üniversite üyeleri erişir.
          </motion.p>
          <motion.div variants={sahne} className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Fingerprint, b: 'Tek kimlik ile onboarding', m: 'Üniversite e-postasıyla giriş; e-posta doğrulama ve JWT tabanlı oturum.' },
              { icon: Lock, b: 'Merkezi güvenlik', m: 'JWT API Gateway’de doğrulanır; rol bilgisi servislere güvenli iletilir.' },
              { icon: Network, b: 'Tutarlı deneyim', m: 'Tüm modüllerde ortak tasarım dili; bilişsel geçiş maliyeti en aza iner.' },
            ].map((c) => (
              <motion.div key={c.b} variants={gel} className="theme-card rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200"><c.icon className="h-6 w-6" /></div>
                <h3 className="mb-2 text-xl font-black text-white">{c.b}</h3>
                <p className="text-base leading-7 text-white/60">{c.m}</p>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 03 — MODÜLLER */}
        <Slide id="moduller" no={4} etiket="Modüller" toplam={slaytlar.length} onEnter={setAktif} index={3}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-violet-300/80">Aktif Modüller</motion.span>
          <Baslik>Kampüsün <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">dört aktif</span> ekosistemi.</Baslik>
          <motion.div variants={sahne} className="mt-10 grid gap-5 md:grid-cols-2">
            {moduller.map((m) => (
              <motion.div key={m.ad} variants={buyu} className="theme-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.renk}`} />
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${m.renk} shadow-lg shadow-black/20 transition-transform group-hover:scale-105`}>
                    <m.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{m.ad}</h3>
                    <p className="text-sm font-bold text-white/45">{m.alt}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-300/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aktif
                  </span>
                </div>
                <p className="mt-4 text-base leading-7 text-white/60">{m.ozet}</p>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 04 — PLATFORM YETENEKLERİ */}
        <Slide id="yetenekler" no={5} etiket="Platform" toplam={slaytlar.length} onEnter={setAktif} index={4}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300/80">Modül Üstü Yetenekler</motion.span>
          <Baslik>Her modülün paylaştığı <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">ortak omurga.</span></Baslik>
          <motion.div variants={sahne} className="mt-12 grid gap-6 md:grid-cols-3">
            {yetenekler.map((y) => (
              <motion.div key={y.baslik} variants={gel} className="theme-card rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-indigo-200"><y.icon className="h-7 w-7" /></div>
                <h3 className="mb-2 text-xl font-black text-white">{y.baslik}</h3>
                <p className="text-base leading-7 text-white/60">{y.metin}</p>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 05 — MİMARİ */}
        <Slide id="mimari" no={6} etiket="Mimari" toplam={slaytlar.length} onEnter={setAktif} index={5}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300/80">Mimari</motion.span>
          <Baslik>Bağımsız servisler, <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">tek geçit.</span></Baslik>
          <motion.div variants={buyu} className="mt-10 theme-card rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100"><Layers className="h-4 w-4" /> React Frontend</div>
              <ArrowDown className="h-5 w-5 text-white/30" />
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-indigo-300/25 bg-indigo-500/15 px-5 py-3 text-sm font-black text-indigo-100">
                <Zap className="h-4 w-4" /> API Gateway :8080
                <span className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">JWT · X-User-Roles</span>
              </div>
            </div>
            <div className="my-5 flex justify-center"><span className="h-6 w-px bg-white/15" /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mimariServisler.map((s) => (
                <div key={s.ad} className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center transition hover:border-white/25 hover:bg-white/[0.08]">
                  <div className="font-mono text-sm font-black text-white">{s.ad}</div>
                  <div className="mt-0.5 text-[10px] font-bold text-cyan-200/70">:{s.port}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/70"><GitBranch className="h-4 w-4 text-emerald-300" /> Eureka servis keşfi</div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/70"><Radio className="h-4 w-4 text-orange-300" /> Kafka olay akışı</div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/70"><Database className="h-4 w-4 text-violet-300" /> DB-per-service</div>
            </div>
          </motion.div>
        </Slide>

        {/* 06 — ÖLÇEK */}
        <Slide id="olcek" no={7} etiket="Ölçek" toplam={slaytlar.length} onEnter={setAktif} index={6}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300/80">Rakamlarla</motion.span>
          <Baslik>Üretim sınıfı <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">bir omurga.</span></Baslik>
          <motion.div variants={sahne} className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {olcek.map((s) => (
              <motion.div key={s.etiket} variants={buyu} className="theme-card rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-200"><s.icon className="h-6 w-6" /></div>
                <div className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-5xl font-black text-transparent sm:text-6xl">{s.sayi}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/50">{s.etiket}</div>
              </motion.div>
            ))}
          </motion.div>
          <motion.p variants={gel} className="mt-8 text-center text-sm text-white/40">
            10 servisin 8'i kendi PostgreSQL veritabanına sahip domain servisidir; eureka-server ve api-gateway ise veritabanı olmayan altyapı servisleridir. Servisler birbirinin tablolarına doğrudan erişmez.
          </motion.p>
        </Slide>

        {/* 07 — TEKNOLOJİ */}
        <Slide id="teknoloji" no={8} etiket="Teknoloji" toplam={slaytlar.length} onEnter={setAktif} index={7}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300/80">Teknoloji Yığını</motion.span>
          <Baslik>Modern, <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">ölçeklenebilir</span> teknolojiler.</Baslik>
          <motion.div variants={sahne} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teknoloji.map((g) => (
              <motion.div key={g.baslik} variants={gel} className="theme-card rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06]"><g.icon className={`h-5 w-5 ${g.renk}`} /></div>
                  <h3 className="text-xl font-black text-white">{g.baslik}</h3>
                </div>
                <ul className="space-y-2.5">
                  {g.ogeler.map((o) => (
                    <li key={o} className="flex items-center gap-2.5 text-[15px] text-white/65"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300/70" /> {o}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 08 — ROLLER */}
        <Slide id="roller" no={9} etiket="Roller" toplam={slaytlar.length} onEnter={setAktif} index={8}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-amber-300/80">Roller & Yetkiler</motion.span>
          <Baslik>Herkese <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">doğru yetki.</span></Baslik>
          <motion.p variants={gel} className="mt-4 max-w-2xl text-base leading-7 text-white/55">
            Rol bazlı erişim kontrolü (RBAC) yalnızca role değil; sahiplik, durum ve bağlama göre de uygulanır.
          </motion.p>
          <motion.div variants={sahne} className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {roller.map((r) => (
              <motion.div key={r.ad} variants={gel} className="theme-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/12 text-amber-200"><r.icon className="h-4 w-4" /></div>
                <h3 className="text-sm font-black leading-tight text-white">{r.ad}</h3>
                <p className="mt-1.5 text-xs leading-5 text-white/50">{r.metin}</p>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 09 — GELECEK */}
        <Slide id="gelecek" no={10} etiket="Gelecek" toplam={slaytlar.length} onEnter={setAktif} index={9}>
          <motion.span variants={gel} className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300/80">Gelecek Çalışmalar</motion.span>
          <Baslik>Sırada <span className="bg-gradient-to-r from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">ne var?</span></Baslik>
          <motion.p variants={gel} className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
            Çekirdek platform hazır ve çalışıyor. Sıradaki adımlar; planlanan iki yeni modül ve native bir mobil uygulama.
          </motion.p>
          <motion.div variants={sahne} className="mt-10 grid gap-5 md:grid-cols-3">
            {gelecek.map((g) => (
              <motion.div key={g.ad} variants={buyu} className="theme-card relative overflow-hidden rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-7 backdrop-blur-xl">
                <span className="absolute right-5 top-5 text-3xl font-black text-white/10">{g.no}</span>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${g.renk} opacity-90`}><g.icon className="h-7 w-7 text-white" /></div>
                <h3 className="text-2xl font-black text-white">{g.ad}</h3>
                <p className="text-sm font-bold text-white/45">{g.alt}</p>
                <p className="mt-3 text-base leading-7 text-white/60">{g.metin}</p>
                <span className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/55">Planlandı</span>
              </motion.div>
            ))}
          </motion.div>
        </Slide>

        {/* 10 — KAPANIŞ */}
        <Slide id="kapanis" no={11} etiket="Kapanış" toplam={slaytlar.length} onEnter={setAktif} index={10} className="items-center text-center">
          <motion.div variants={buyu} className="mx-auto max-w-3xl">
            <Quote className="mx-auto mb-6 h-9 w-9 text-white/25" />
            <p className="text-3xl font-black leading-snug text-white sm:text-4xl">
              “Kampüs yaşamının her ders dışı süreci; aynı kimlik, aynı güven ve aynı deneyimle <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">tek platformda.</span>”
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">IsikCampusOS Vizyonu</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to={YOLLAR.giris} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-100"><LogIn className="h-5 w-5" /> Platforma giriş</Link>
              <Link to={YOLLAR.sertifikaDogrula} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-base font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"><ScrollText className="h-5 w-5" /> Sertifika doğrula</Link>
            </div>
            <p className="mt-12 flex items-center justify-center gap-2 text-xs text-white/35"><Boxes className="h-4 w-4" /> Işık Üniversitesi · Yönetim Bilişim Sistemleri bitirme projesi</p>
          </motion.div>
        </Slide>

      </div>
    </div>
  );
};
