/**
 * Geographic utility functions for converting between meters and degrees.
 * Assumes Earth is a perfect sphere for simplicity.
 */

// Earth's radius in meters (mean radius)
const EARTH_RADIUS_METERS = 6371000

// Meters per degree of latitude (constant everywhere)
// Circumference / 360 = 2 * π * R / 360
const METERS_PER_DEGREE_LAT = (2 * Math.PI * EARTH_RADIUS_METERS) / 360 // ≈ 111,320 meters

// define a constant for the step size in meters
const STEP_SIZE_METERS = 0.1;

/**
 * Convert a distance in meters to degrees of latitude.
 * Latitude conversion is constant everywhere on Earth.
 * 
 * @param meters - Distance in meters
 * @returns Degrees of latitude
 */
export function metersToDegreesLat(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT
}

/**
 * Convert a distance in meters to degrees of longitude at a given latitude.
 * Longitude conversion varies by latitude (lines of longitude converge at poles).
 * 
 * @param meters - Distance in meters
 * @param latitude - Current latitude in degrees
 * @returns Degrees of longitude
 */
export function metersToDegreesLng(meters: number, latitude: number): number {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latitude * Math.PI / 180)
  return meters / metersPerDegreeLng
}

/**
 * Convert degrees of latitude to meters.
 * 
 * @param degrees - Degrees of latitude
 * @returns Distance in meters
 */
export function degreesLatToMeters(degrees: number): number {
  return degrees * METERS_PER_DEGREE_LAT
}

/**
 * Convert degrees of longitude to meters at a given latitude.
 * 
 * @param degrees - Degrees of longitude
 * @param latitude - Current latitude in degrees
 * @returns Distance in meters
 */
export function degreesLngToMeters(degrees: number, latitude: number): number {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latitude * Math.PI / 180)
  return degrees * metersPerDegreeLng
}

/**
 * Convenience function: Convert meters to lat/lng deltas at a given location.
 * 
 * @param metersNorth - Distance north (positive) or south (negative) in meters
 * @param metersEast - Distance east (positive) or west (negative) in meters
 * @param latitude - Current latitude in degrees
 * @returns Object with deltaLat and deltaLng in degrees
 */
export function metersToLatLngDelta(
  metersNorth: number,
  metersEast: number,
  latitude: number
): { deltaLat: number; deltaLng: number } {
  return {
    deltaLat: metersToDegreesLat(metersNorth),
    deltaLng: metersToDegreesLng(metersEast, latitude)
  }
}

export function getLatStep(): number {
  return metersToDegreesLat(STEP_SIZE_METERS);
}

export function getLngStep(ref_lat: number): number {
  return metersToDegreesLng(STEP_SIZE_METERS, ref_lat);
}
