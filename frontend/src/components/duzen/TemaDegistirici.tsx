import { Moon, Sun } from 'lucide-react';
import { useTemaDeposu } from '../../depolar/temaDeposu';

type TemaDegistiriciProps = {
  className?: string;
};

export const TemaDegistirici = ({ className = '' }: TemaDegistiriciProps) => {
  const tema = useTemaDeposu(state => state.tema);
  const temaDegistir = useTemaDeposu(state => state.temaDegistir);
  const acikTema = tema === 'light';
  const etiket = acikTema ? 'Koyu temaya geç' : 'Açık temaya geç';

  return (
    <button
      type="button"
      onClick={temaDegistir}
      aria-label={etiket}
      title={etiket}
      className={`theme-icon inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${className}`}
    >
      {acikTema ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};
