/**
 * Network quality detection and adaptive configuration
 * Provides network-aware timeouts and retry strategies for mobile-first apps
 */

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetworkInfo {
  quality: NetworkQuality;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Get current network quality based on Network Information API
 */
export function getNetworkQuality(): NetworkInfo {
  // Check if online
  if (!navigator.onLine) {
    return {
      quality: 'offline',
      effectiveType: 'offline',
      downlink: 0,
      rtt: Infinity,
      saveData: false,
    };
  }

  // Use Network Information API if available (Chrome, Edge, Opera)
  const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection;

  if (!connection) {
    // Fallback: assume good connection if API not available
    return {
      quality: 'good',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    };
  }

  const effectiveType = connection.effectiveType || '4g';
  const downlink = connection.downlink || 10;
  const rtt = connection.rtt || 50;
  const saveData = connection.saveData || false;

  // Determine quality based on effective type
  let quality: NetworkQuality;
  switch (effectiveType) {
    case '4g':
      quality = 'excellent';
      break;
    case '3g':
      quality = 'good';
      break;
    case '2g':
    case 'slow-2g':
      quality = 'poor';
      break;
    default:
      quality = 'good';
  }

  // Downgrade quality if RTT is high (network latency indicator)
  if (rtt > 1000) {
    quality = 'poor';
  } else if (rtt > 500 && quality === 'excellent') {
    quality = 'good';
  }

  return {
    quality,
    effectiveType,
    downlink,
    rtt,
    saveData,
  };
}

/**
 * Get adaptive timeout based on network quality
 * Fast networks get shorter timeouts, slow networks get more time
 */
export function getAdaptiveTimeout(): number {
  const { quality } = getNetworkQuality();

  switch (quality) {
    case 'excellent':
      return 5000;  // 5 seconds on 4G
    case 'good':
      return 10000; // 10 seconds on 3G
    case 'poor':
      return 20000; // 20 seconds on 2G
    case 'offline':
      return 30000; // 30 seconds (will fail, but give time for reconnect)
    default:
      return 10000;
  }
}

/**
 * Get adaptive retry configuration based on network quality
 * Slow networks get more retries with longer delays
 */
export function getAdaptiveRetryConfig() {
  const { quality } = getNetworkQuality();

  switch (quality) {
    case 'excellent':
      return {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 5000,
      };
    case 'good':
      return {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
      };
    case 'poor':
      return {
        maxRetries: 5,
        initialDelay: 3000,
        maxDelay: 20000,
      };
    case 'offline':
      return {
        maxRetries: 10,
        initialDelay: 5000,
        maxDelay: 30000,
      };
    default:
      return {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
      };
  }
}

/**
 * Subscribe to network quality changes
 * Returns cleanup function to unsubscribe
 */
export function subscribeToNetworkChanges(callback: (info: NetworkInfo) => void) {
  // Online/offline events
  const handleOnline = () => callback(getNetworkQuality());
  const handleOffline = () => callback(getNetworkQuality());

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Connection change events (if available)
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', handleOnline);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', handleOnline);
    }
  };
}
