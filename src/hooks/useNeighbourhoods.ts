export type City = "sydney" | "new_york";

export interface Neighbourhood {
  id: string;
  city: City;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

// Static neighbourhood data - no network request needed
const NEIGHBOURHOODS: Record<City, Neighbourhood[]> = {
  sydney: [
    { id: "syd-1", city: "sydney", name: "Balmain", latitude: -33.8578, longitude: 151.1800 },
    { id: "syd-2", city: "sydney", name: "Bondi", latitude: -33.8914, longitude: 151.2743 },
    { id: "syd-3", city: "sydney", name: "Darlinghurst", latitude: -33.8774, longitude: 151.2167 },
    { id: "syd-4", city: "sydney", name: "Glebe", latitude: -33.8791, longitude: 151.1871 },
    { id: "syd-5", city: "sydney", name: "Manly", latitude: -33.7969, longitude: 151.2847 },
    { id: "syd-6", city: "sydney", name: "Marrickville", latitude: -33.9111, longitude: 151.1547 },
    { id: "syd-7", city: "sydney", name: "Mosman", latitude: -33.8295, longitude: 151.2440 },
    { id: "syd-8", city: "sydney", name: "Neutral Bay", latitude: -33.8347, longitude: 151.2203 },
    { id: "syd-9", city: "sydney", name: "Newtown", latitude: -33.8975, longitude: 151.1790 },
    { id: "syd-10", city: "sydney", name: "Paddington", latitude: -33.8840, longitude: 151.2266 },
    { id: "syd-11", city: "sydney", name: "Redfern", latitude: -33.8928, longitude: 151.2027 },
    { id: "syd-12", city: "sydney", name: "Surry Hills", latitude: -33.8856, longitude: 151.2115 },
  ],
  new_york: [
    { id: "nyc-1", city: "new_york", name: "Astoria", latitude: 40.7720, longitude: -73.9301 },
    { id: "nyc-2", city: "new_york", name: "Chelsea", latitude: 40.7465, longitude: -74.0014 },
    { id: "nyc-3", city: "new_york", name: "DUMBO", latitude: 40.7033, longitude: -73.9883 },
    { id: "nyc-4", city: "new_york", name: "Greenwich Village", latitude: 40.7336, longitude: -74.0027 },
    { id: "nyc-5", city: "new_york", name: "Harlem", latitude: 40.8116, longitude: -73.9465 },
    { id: "nyc-6", city: "new_york", name: "Long Island City", latitude: 40.7447, longitude: -73.9485 },
    { id: "nyc-7", city: "new_york", name: "Park Slope", latitude: 40.6710, longitude: -73.9814 },
    { id: "nyc-8", city: "new_york", name: "SoHo", latitude: 40.7233, longitude: -74.0030 },
    { id: "nyc-9", city: "new_york", name: "Tribeca", latitude: 40.7163, longitude: -74.0086 },
    { id: "nyc-10", city: "new_york", name: "Upper East Side", latitude: 40.7736, longitude: -73.9566 },
    { id: "nyc-11", city: "new_york", name: "Upper West Side", latitude: 40.7870, longitude: -73.9754 },
    { id: "nyc-12", city: "new_york", name: "Williamsburg", latitude: 40.7081, longitude: -73.9571 },
  ],
};

// Simple hook that returns static data - no network request, no timeout, no errors
export function useNeighbourhoods(city: City | null) {
  const data = city ? NEIGHBOURHOODS[city] : [];
  
  return {
    data,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve({ data, error: null }),
  };
}

export const CITY_CONFIG = {
  sydney: {
    label: "Sydney",
    country: "Australia",
    phonePrefix: "+61",
    phoneFormat: "04XX XXX XXX",
    flag: "🇦🇺",
  },
  new_york: {
    label: "New York",
    country: "United States",
    phonePrefix: "+1",
    phoneFormat: "(XXX) XXX-XXXX",
    flag: "🇺🇸",
  },
} as const;
