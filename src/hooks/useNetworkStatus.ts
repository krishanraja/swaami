import { useState, useEffect } from "react";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to track network connectivity status
 * Provides graceful degradation when network fails
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true for a moment to show "back online" message
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
