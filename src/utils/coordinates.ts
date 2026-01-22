import proj4 from "proj4";
import type { WGS84Coordinates, UTMCoordinates, Coordinates, GeoJSONGeometry, GeoJSONPolygon, GeoJSONMultiPolygon } from "../types.js";

// Define the coordinate reference systems
// EPSG:4326 - WGS84 (lat/lon) - commonly used by GPS and web mapping
// EPSG:25833 - ETRS89 / UTM zone 33N - used by Berlin geodata services

proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

/**
 * Convert WGS84 coordinates (lat/lon) to UTM (EPSG:25833)
 */
export function wgs84ToUtm(coords: WGS84Coordinates): UTMCoordinates {
  // proj4 expects [lon, lat] order
  const [x, y] = proj4("EPSG:4326", "EPSG:25833", [coords.lon, coords.lat]);
  return { x, y, epsg: "EPSG:25833" };
}

/**
 * Convert UTM (EPSG:25833) to WGS84 coordinates (lat/lon)
 */
export function utmToWgs84(coords: UTMCoordinates): WGS84Coordinates {
  // proj4 returns [lon, lat] order
  const [lon, lat] = proj4("EPSG:25833", "EPSG:4326", [coords.x, coords.y]);
  return { lat, lon };
}

/**
 * Create a Coordinates object from WGS84 input
 */
export function coordinatesFromWgs84(lat: number, lon: number): Coordinates {
  const wgs84: WGS84Coordinates = { lat, lon };
  const utm = wgs84ToUtm(wgs84);
  return { wgs84, utm };
}

/**
 * Create a Coordinates object from UTM input
 */
export function coordinatesFromUtm(x: number, y: number): Coordinates {
  const utm: UTMCoordinates = { x, y, epsg: "EPSG:25833" };
  const wgs84 = utmToWgs84(utm);
  return { wgs84, utm };
}

/**
 * Transform a single coordinate pair from UTM to WGS84
 */
function transformCoordPair(coord: [number, number]): [number, number] {
  const [lon, lat] = proj4("EPSG:25833", "EPSG:4326", coord);
  return [lon, lat];
}

/**
 * Transform a ring (array of coordinate pairs) from UTM to WGS84
 */
function transformRing(ring: number[][]): number[][] {
  return ring.map((coord) => transformCoordPair(coord as [number, number]));
}

/**
 * Transform a GeoJSON geometry from EPSG:25833 to WGS84
 */
export function transformGeometryToWgs84(geometry: GeoJSONGeometry | null): GeoJSONGeometry | null {
  if (!geometry) return null;

  switch (geometry.type) {
    case "Point":
      const [lon, lat] = transformCoordPair(geometry.coordinates);
      return { type: "Point", coordinates: [lon, lat] };

    case "Polygon":
      return {
        type: "Polygon",
        coordinates: geometry.coordinates.map(transformRing),
      } as GeoJSONPolygon;

    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map(transformRing)
        ),
      } as GeoJSONMultiPolygon;

    default:
      return geometry;
  }
}

/**
 * Validate WGS84 coordinates are within Berlin's approximate bounding box
 */
export function isWithinBerlin(coords: WGS84Coordinates): boolean {
  // Berlin approximate bounding box
  const minLat = 52.33;
  const maxLat = 52.68;
  const minLon = 13.08;
  const maxLon = 13.77;

  return (
    coords.lat >= minLat &&
    coords.lat <= maxLat &&
    coords.lon >= minLon &&
    coords.lon <= maxLon
  );
}
