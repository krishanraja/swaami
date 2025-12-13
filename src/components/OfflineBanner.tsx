import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Banner component that shows when user is offline
 * Provides clear feedback about network status
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-accent-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
        <Wifi className="h-4 w-4" />
        You're back online
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
      <WifiOff className="h-4 w-4" />
      You're offline - some features may not work
    </div>
  );
}
