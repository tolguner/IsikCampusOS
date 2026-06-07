import type { Etkinlik, EtkinlikDurumu, KatilimDurumu } from '../../store/etkinlikDeposu';

export type PanelTab = 'profile' | 'events' | 'announcements' | 'members';

export const inputClass =
  'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60';

export const textareaClass = `${inputClass} min-h-28 resize-none`;

export const A3_POSTER_WIDTH = 1754;
export const A3_POSTER_HEIGHT = 2480;

export const emptyEventForm = {
  clubId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  eventMode: 'YUZ_YUZE' as 'CEVRIMICI' | 'YUZ_YUZE',
  onlinePlatform: 'Google Meet',
  onlineMeetingUrl: '',
  locationName: '',
  locationDetail: '',
  latitude: 41.168846,
  longitude: 29.563973,
  posterImageUrl: '',
  hasCapacityLimit: false,
  capacity: 0,
  hasWaitlistLimit: false,
  waitlistCapacity: 0,
  qrCheckInEnabled: true,
  certificateEnabled: false,
  certificateTitle: '',
  paid: false,
  feeAmount: 0,
  iban: '',
  paymentInstructions: '',
  reminderEnabled: false,
  reminderOffsetsMinutes: [] as number[],
};

export const emptyAnnouncementForm = {
  title: '',
  message: '',
  linkUrl: '',
  linkLabel: '',
  imageUrl: '',
};

export const reminderOptions = [
  { value: 15, label: '15 dk önce' },
  { value: 30, label: '30 dk önce' },
  { value: 60, label: '1 saat önce' },
  { value: 1440, label: '1 gün önce' },
];

export const statusLabel: Record<EtkinlikDurumu, string> = {
  TASLAK: 'Taslak',
  SKS_ONAYI_BEKLIYOR: 'SKS onayında',
  REVIZYON_TALEP_EDILDI: 'Revizyon istendi',
  YAYINLANDI: 'Yayında',
  REDDEDILDI: 'Reddedildi',
  IPTAL_EDILDI: 'İptal',
  TAMAMLANDI: 'Tamamlandı',
};

export const statusClass: Record<EtkinlikDurumu, string> = {
  TASLAK: 'bg-white/10 text-white/70',
  SKS_ONAYI_BEKLIYOR: 'bg-amber-500/15 text-amber-100',
  REVIZYON_TALEP_EDILDI: 'bg-red-500/15 text-red-100',
  YAYINLANDI: 'bg-emerald-500/15 text-emerald-100',
  REDDEDILDI: 'bg-red-500/15 text-red-100',
  IPTAL_EDILDI: 'bg-white/10 text-white/45',
  TAMAMLANDI: 'bg-cyan-500/15 text-cyan-100',
};

export const participantStatusLabel: Record<KatilimDurumu, string> = {
  ODEME_BEKLIYOR: 'Ödeme bekliyor',
  ONAYLANDI: 'Katılım onaylı',
  YEDEKTE: 'Yedekte',
  IPTAL_EDILDI: 'İptal',
  KATILDI: 'Katıldı',
  GELMEDI: 'Katılmadı',
};

export const isPastEvent = (event: Etkinlik) => {
  const boundary = event.bitisTarihi || event.baslangicTarihi;
  return Boolean(boundary && new Date(boundary) < new Date());
};

export const isCheckInWindowOpen = (event: Etkinlik) => {
  if (!event.baslangicTarihi) return false;
  const startTime = new Date(event.baslangicTarihi).getTime();
  const endTime = new Date(event.bitisTarihi || event.baslangicTarihi).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return now >= startTime - oneHour && now <= endTime + oneHour;
};

/** Crop & resize an image file to a 512×512 square PNG data-URL. */
export const squareImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      reject(new Error('Unsupported image type'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image could not be read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Image could not be loaded'));
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const sourceX = (image.width - size) / 2;
        const sourceY = (image.height - size) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas could not be created'));
          return;
        }
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 512, 512);
        resolve(canvas.toDataURL('image/png'));
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

/** Crop & resize an image file to A3 portrait JPEG data-URL. */
export const a3PosterFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      reject(new Error('Unsupported image type'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image could not be read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Image could not be loaded'));
      image.onload = () => {
        const targetRatio = A3_POSTER_WIDTH / A3_POSTER_HEIGHT;
        const sourceRatio = image.width / image.height;
        let sourceWidth = image.width;
        let sourceHeight = image.height;
        let sourceX = 0;
        let sourceY = 0;
        if (sourceRatio > targetRatio) {
          sourceWidth = image.height * targetRatio;
          sourceX = (image.width - sourceWidth) / 2;
        } else if (sourceRatio < targetRatio) {
          sourceHeight = image.width / targetRatio;
          sourceY = (image.height - sourceHeight) / 2;
        }
        const canvas = document.createElement('canvas');
        canvas.width = A3_POSTER_WIDTH;
        canvas.height = A3_POSTER_HEIGHT;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas could not be created'));
          return;
        }
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, A3_POSTER_WIDTH, A3_POSTER_HEIGHT);
        context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, A3_POSTER_WIDTH, A3_POSTER_HEIGHT);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

export const parseReminderOffsets = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);
