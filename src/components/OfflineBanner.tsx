import { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { getNetworkQuality, subscribeToNetworkChanges } from '@/lib/networkDetection';

/**
 * Banner component that shows network status
 * Provides clear feedback about offline/poor connection
 */
export function OfflineBanner() {
  const [networkQuality, setNetworkQuality] = useState(getNetworkQuality());
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((info) => {
      setNetworkQuality(info);

      if (info.quality === 'offline') {
        setWasOffline(true);
        setShowBackOnline(false);
      } else if (wasOffline && info.quality !== 'offline') {
        setShowBackOnline(true);
        // Hide "back online" banner after 3 seconds
        setTimeout(() => setShowBackOnline(false), 3000);
      }
    });

    return unsubscribe;
  }, [wasOffline]);

  // Show offline banner
  if (networkQuality.quality === 'offline') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
        <WifiOff className="h-4 w-4" />
        You're offline - some features may not work
      </div>
    );
  }

  // Show "back online" banner briefly
  if (showBackOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-accent-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
        <Wifi className="h-4 w-4" />
        You're back online!
      </div>
    );
  }

  // Show slow connection warning
  if (networkQuality.quality === 'poor') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-yellow-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
        <AlertTriangle className="h-4 w-4" />
        Slow connection detected - loading may take longer
      </div>
    );
  }

  return null;
}
