import type { ElementType } from 'react';
import { Bell, CalendarDays, ClipboardCheck, Megaphone, Plus, Users } from 'lucide-react';

export type SksModule = 'clubs' | 'create' | 'profileRequests' | 'events' | 'announcements' | 'health';

export const panelStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export const inputClass = 'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60';
export const SHORT_DESCRIPTION_MIN_LENGTH = 20;
export const SHORT_DESCRIPTION_MAX_LENGTH = 180;
export const VISION_MIN_LENGTH = 80;
export const VISION_MAX_LENGTH = 3000;

export const fieldLimitText = (value: string, minLength: number, maxLength: number) =>
  `${value.trim().length}/${maxLength} karakter - en az ${minLength}`;

export const initialClubForm = {
  ad: '',
  kisaAciklama: '',
  vizyon: '',
  logoUrl: '',
  advisorSearch: '',
  danismanAkademikKadroId: '',
  danismanUnvani: '',
  danismanAdSoyad: '',
  danismanEposta: '',
  danismanBolumu: '',
  presidentSearch: '',
  presidentId: '',
};

export const moduleMeta: Record<SksModule, { label: string; description: string; icon: ElementType }> = {
  clubs: {
    label: 'Kulüp Yönetimi',
    description: 'Kulüp kayıtları, başkanlar ve aktiflik durumu',
    icon: Users,
  },
  create: {
    label: 'Kulüp Oluşturma',
    description: 'Yeni kulüp kaydı ve kurucu başkan seçimi',
    icon: Plus,
  },
  events: {
    label: 'Etkinlik Talepleri',
    description: 'SKS onayı bekleyen etkinlik akışları',
    icon: CalendarDays,
  },
  profileRequests: {
    label: 'Profil Talepleri',
    description: 'Kulüp başkanı profil güncelleme istekleri',
    icon: ClipboardCheck,
  },
  announcements: {
    label: 'Duyuru',
    description: 'Öğrencilere ve kulüp başkanlarına toplu iletişim',
    icon: Megaphone,
  },
  health: {
    label: 'Sağlık',
    description: 'Kulüp aktivite, risk ve takip görünümü',
    icon: Bell,
  },
};
