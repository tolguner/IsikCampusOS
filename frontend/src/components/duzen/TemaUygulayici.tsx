import { useEffect } from 'react';
import { useTemaDeposu } from '../../depolar/temaDeposu';

export const TemaUygulayici = () => {
  const tema = useTemaDeposu(state => state.tema);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema;
  }, [tema]);

  return null;
};
