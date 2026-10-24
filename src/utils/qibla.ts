// Coordinates of the Holy Kaaba in Makkah al-Mukarramah
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206
};

// Convert degrees to radians
const toRad = (deg: number) => (deg * Math.PI) / 180.0;
// Convert radians to degrees
const toDeg = (rad: number) => (rad * 180.0) / Math.PI;

/**
 * Calculates the Qibla bearing (in degrees clockwise from North, 0°-360°)
 * from given latitude and longitude.
 */
export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const phi1 = toRad(latitude);
  const phi2 = toRad(KAABA_COORDINATES.latitude);
  const deltaLambda = toRad(KAABA_COORDINATES.longitude - longitude);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = toDeg(Math.atan2(y, x));
  // Normalize to 0° - 360°
  qibla = (qibla + 360) % 360;

  return Math.round(qibla * 10) / 10;
}

/**
 * Calculates Great-Circle distance to the Kaaba in kilometers
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(KAABA_COORDINATES.latitude - latitude);
  const dLon = toRad(KAABA_COORDINATES.longitude - longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA_COORDINATES.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Get cardinal direction string from degrees (e.g. NNE, SSW)
 */
export function getCardinalDirection(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
