import { useAuthStore } from '../store/authStore';
import { useClubStore } from '../store/clubStore';
import { useEventStore } from '../store/eventStore';
import { useNotificationStore } from '../store/notificationStore';
import { useStudentStore } from '../store/studentStore';
import { useAcademicStaffStore } from '../store/academicStaffStore';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';

export const OtomatikMesajTemizleyici = () => {
  const authError = useAuthStore(state => state.error);
  const authSuccess = useAuthStore(state => state.successMessage);
  const clearAuthError = useAuthStore(state => state.clearError);
  const clearAuthSuccess = useAuthStore(state => state.clearSuccess);

  const clubError = useClubStore(state => state.error);
  const clubSuccess = useClubStore(state => state.successMessage);
  const clearClub = useClubStore(state => state.clearMessages);

  const eventError = useEventStore(state => state.error);
  const eventSuccess = useEventStore(state => state.successMessage);
  const clearEvent = useEventStore(state => state.clearMessages);

  const studentError = useStudentStore(state => state.error);
  const studentSuccess = useStudentStore(state => state.successMessage);
  const clearStudent = useStudentStore(state => state.clearMessages);

  const notificationError = useNotificationStore(state => state.hata);
  const clearNotificationError = useNotificationStore(state => state.hatayiTemizle);

  const advisorError = useAcademicStaffStore(state => state.error);
  const clearAdvisorError = useAcademicStaffStore(state => state.clearError);

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
