import { useEffect } from 'react';

export const useMesajOtomatikKapat = (
  message: string | null | undefined,
  dismiss: () => void,
  delayMs = 7000,
) => {
  useEffect(() => {
    if (!message) return;

    const timeoutId = window.setTimeout(dismiss, delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [message, dismiss, delayMs]);
};
