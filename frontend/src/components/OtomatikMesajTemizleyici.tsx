import { useKimlikDeposu } from '../store/kimlikDeposu';
import { useKulupDeposu } from '../store/kulupDeposu';
import { useEtkinlikDeposu } from '../store/etkinlikDeposu';
import { useBildirimDeposu } from '../store/bildirimDeposu';
import { useOgrenciDeposu } from '../store/ogrenciDeposu';
import { useAkademikKadroDeposu } from '../store/akademikKadroDeposu';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';

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

  useAutoDismissMessage(authError, clearAuthError);
  useAutoDismissMessage(authSuccess, clearAuthSuccess);
  useAutoDismissMessage(clubError, clearClub);
  useAutoDismissMessage(clubSuccess, clearClub);
  useAutoDismissMessage(eventError, clearEvent);
  useAutoDismissMessage(eventSuccess, clearEvent);
  useAutoDismissMessage(studentError, clearStudent);
  useAutoDismissMessage(studentSuccess, clearStudent);
  useAutoDismissMessage(notificationError, clearNotificationError);
  useAutoDismissMessage(advisorError, clearAdvisorError);

  return null;
};

export default OtomatikMesajTemizleyici;
