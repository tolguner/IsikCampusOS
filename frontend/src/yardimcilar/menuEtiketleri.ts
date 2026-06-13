/** Menü allerjen/içerik etiketleri — backend CSV olarak saklar (örn. "VEGAN,ACILI"). */
export const MENU_ETIKETLERI: Record<string, string> = {
  VEJETARYEN: '🥗 Vejetaryen',
  VEGAN: '🌱 Vegan',
  GLUTENSIZ: '🌾 Glutensiz',
  LAKTOZSUZ: '🥛 Laktozsuz',
  ACILI: '🌶️ Acılı',
  KURUYEMIS: '🥜 Kuruyemiş içerir',
};

export const etiketleriAyir = (csv?: string | null): string[] =>
  (csv ?? '').split(',').map(e => e.trim()).filter(e => e in MENU_ETIKETLERI);

export const etiketEtiketi = (kod: string): string => MENU_ETIKETLERI[kod] ?? kod;
