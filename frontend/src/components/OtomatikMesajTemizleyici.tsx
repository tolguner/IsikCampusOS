import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { useKulupDeposu } from '../depolar/kulupDeposu';
import { useEtkinlikDeposu } from '../depolar/etkinlikDeposu';
import { useBildirimDeposu } from '../depolar/bildirimDeposu';
import { useOgrenciDeposu } from '../depolar/ogrenciDeposu';
import { useAkademikKadroDeposu } from '../depolar/akademikKadroDeposu';
import { useMesajOtomatikKapat } from '../kancalar/useMesajOtomatikKapat';

export const OtomatikMesajTemizleyici = () => {
  const authError = useKimlikDeposu(state => state.error);
  const authSuccess = useKimlikDeposu(state => state.successMessage);
  const clearAuthError = useKimlikDeposu(state => state.clearError);
  const clearAuthSuccess = useKimlikDeposu(state => state.clearSuccess);

  const clubError = useKulupDeposu(state => state.error);
  const clubSuccess = useKulupDeposu(state => state.successMessage);
  const clearClub = useKulupDeposu(state => state.clearMessages);

  const eventError = useEtkinlikDeposu(state => state.error);
  const eventSuccess = useEtkinlikDeposu(state => state.successMessage);
  const clearEvent = useEtkinlikDeposu(state => state.clearMessages);

  const studentError = useOgrenciDeposu(state => state.error);
  const studentSuccess = useOgrenciDeposu(state => state.successMessage);
  const clearStudent = useOgrenciDeposu(state => state.clearMessages);

  const notificationError = useBildirimDeposu(state => state.hata);
  const clearNotificationError = useBildirimDeposu(state => state.hatayiTemizle);

  const advisorError = useAkademikKadroDeposu(state => state.error);
  const clearAdvisorError = useAkademikKadroDeposu(state => state.clearError);

  useMesajOtomatikKapat(authError, clearAuthError);
  useMesajOtomatikKapat(authSuccess, clearAuthSuccess);
  useMesajOtomatikKapat(clubError, clearClub);
  useMesajOtomatikKapat(clubSuccess, clearClub);
  useMesajOtomatikKapat(eventError, clearEvent);
  useMesajOtomatikKapat(eventSuccess, clearEvent);
  useMesajOtomatikKapat(studentError, clearStudent);
  useMesajOtomatikKapat(studentSuccess, clearStudent);
  useMesajOtomatikKapat(notificationError, clearNotificationError);
  useMesajOtomatikKapat(advisorError, clearAdvisorError);

  return null;
};

export default OtomatikMesajTemizleyici;
