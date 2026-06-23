import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    } else {
      // Periodic check for native platforms
      let active = true;
      const checkConnection = async () => {
        try {
          // fetch a small endpoint with a short timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch('https://connectivitycheck.gstatic.com/generate_204', { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (active) {
            setIsOnline(res.status === 204 || res.ok);
          }
        } catch {
          if (active) {
            setIsOnline(false);
          }
        }
      };

      checkConnection();
      const intervalId = setInterval(checkConnection, 8000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }
  }, []);

  return isOnline;
}
