import { ArrowUpRight, BriefcaseBusiness, CalendarDays, CarFront, Dumbbell, UtensilsCrossed, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { YOLLAR } from '../yardimcilar/yollar';

type ModuleCard = {
  name: string;
  description: string;
  detail: string;
  icon: typeof CalendarDays;
  image: string;
  gradient: string;
  accent: string;
} & (
  | { soon?: false; to: string }
  | { soon: true; to?: never }
);

const moduleCards: ModuleCard[] = [
  {
    name: 'ClubHub',
    description: 'Kulüp ve Etkinlik Yönetimi',
    detail: 'Kulüpleri keşfet, etkinliklere katıl, kampüs topluluklarının nabzını yakala.',
    to: YOLLAR.kulupler,
    icon: CalendarDays,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.92), rgba(79, 70, 229, 0.62), rgba(2, 6, 23, 0.22))',
    accent: 'text-violet-100',
  },
  {
    name: 'SpotReserve',
    description: 'Spor Tesisleri Rezervasyon Sistemi',
    detail: 'Spor alanlarını, salonları ve uygun saatleri tek ekranda planla.',
    to: YOLLAR.tesisRezervasyon,
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(14, 116, 144, 0.9), rgba(34, 211, 238, 0.42), rgba(2, 6, 23, 0.3))',
    accent: 'text-cyan-100',
  },
  {
    name: 'UniEats',
    description: 'Kampüs Çevrimiçi Yemek Sipariş ve Yönetim Sistemi',
    detail: 'Kampüs işletmelerinden sipariş ver, hazır olunca teslim al.',
    to: YOLLAR.yemek,
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(154, 52, 18, 0.9), rgba(249, 115, 22, 0.48), rgba(2, 6, 23, 0.28))',
    accent: 'text-orange-100',
  },
  {
    name: 'CampusRide',
    description: 'Paylaşımlı Yolculuk Sistemi',
    detail: 'Kampüs ve şehir arası güvenli yolculuk ilanlarını bul veya paylaş.',
    to: YOLLAR.campusRide,
    icon: CarFront,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(6, 95, 70, 0.9), rgba(16, 185, 129, 0.42), rgba(2, 6, 23, 0.32))',
    accent: 'text-emerald-100',
  },
  {
    name: 'ProjectMatch',
    description: 'Proje Eşleştirme Sistemi',
    detail: 'Beceri profilleri ve proje ekipleri için eşleştirme deneyimi hazırlanıyor.',
    icon: UsersRound,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(67, 56, 202, 0.92), rgba(124, 58, 237, 0.48), rgba(2, 6, 23, 0.36))',
    accent: 'text-indigo-100',
    soon: true,
  },
  {
    name: 'MicroJob',
    description: 'Kampüs İçi Mikro İş Pazarı',
    detail: 'Kısa süreli kampüs işleri, teklifler ve itibar akışı yakında açılacak.',
    icon: BriefcaseBusiness,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    gradient: 'linear-gradient(135deg, rgba(190, 24, 93, 0.88), rgba(244, 114, 182, 0.44), rgba(2, 6, 23, 0.38))',
    accent: 'text-pink-100',
    soon: true,
  },
];

export const OgrenciPaneli = () => {
  const user = useKimlikDeposu(state => state.user);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1500px] flex-col px-2 py-6 sm:px-4 lg:px-6">
      <section className="mb-6">
        <div className="max-w-3xl text-left">
          <h1 className="text-4xl font-black tracking-normal text-white sm:text-5xl">
            Hoş geldin{user?.tamAd ? `, ${user.tamAd}` : ''}
          </h1>
          <p className="mt-3 text-base font-semibold leading-7 text-white/50 sm:whitespace-nowrap sm:text-lg">
            Yeni nesil dijital kampüs partnerin Işık CampusOS seninle
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {moduleCards.map((card) => {
          const Icon = card.icon;
          const cardContent = (
            <>
              <div
                className={`absolute inset-0 bg-cover bg-center transition duration-500 ${card.soon ? 'saturate-[0.65]' : 'group-hover:scale-105'}`}
                style={{ backgroundImage: `url(${card.image})` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0"
                style={{ background: card.gradient }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.7))]" aria-hidden="true" />

              <div className="relative flex h-full min-h-[232px] flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-md">
                    <Icon className="h-6 w-6" />
                  </div>
                  {card.soon ? (
                    <span className="rounded-xl border border-white/18 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/80 backdrop-blur-md">
                      Çok yakında
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80 backdrop-blur-md transition group-hover:bg-white/15 group-hover:text-white">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  )}
                </div>

                <div>
                  <h2 className={`text-3xl font-black tracking-normal ${card.accent}`}>
                    {card.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-white/75">
                    {card.description}
                  </p>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
                    {card.detail}
                  </p>
                </div>
              </div>
            </>
          );

          return card.soon ? (
            <div
              key={card.name}
              className="module-image-card group relative min-h-[232px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/25"
            >
              {cardContent}
            </div>
          ) : (
            <Link
              key={card.name}
              to={card.to}
              className="module-image-card group relative min-h-[232px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/25 outline-none transition duration-300 hover:-translate-y-1 hover:border-white/25 focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
