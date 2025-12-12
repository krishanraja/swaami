// Average walking speed: 5 km/h = 83.33 m/min
const WALKING_SPEED_M_PER_MIN = 83.33;

/**
 * Calculate walk time from distance in meters
 * Returns a human-readable string like "3 min walk"
 */
export function calculateWalkTime(distanceMeters: number | undefined): string {
  if (!distanceMeters || distanceMeters <= 0) {
    return "Nearby";
  }

  const minutes = Math.round(distanceMeters / WALKING_SPEED_M_PER_MIN);

  if (minutes < 1) {
    return "< 1 min walk";
  }

  if (minutes === 1) {
    return "1 min walk";
  }

  if (minutes > 30) {
    return `${Math.round(minutes / 5) * 5} min walk`;
  }

  return `${minutes} min walk`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
