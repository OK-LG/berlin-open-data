import type {
  WGS84Coordinates,
  ParcelInfo,
  ToolResult,
  GeoJSONPolygon,
  BerlinWFSError,
} from "../types.js";
import { queryAtPoint } from "../wfs/client.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { wgs84ToUtm, transformGeometryToWgs84 } from "../utils/coordinates.js";

// WFS parcel properties (actual field names from Berlin ALKIS WFS)
interface ParcelProperties {
  fsko: string;      // Flurstückskennzeichen
  gmk: string;       // Gemarkung code
  namgmk: string;    // Gemarkung name
  fln: string;       // Flur number
  zae: string;       // Zähler
  nen: string;       // Nenner (can be empty string)
  afl: number;       // Amtliche Fläche (area in sqm)
}

/**
 * Get parcel (Flurstück) information at a location
 */
export async function getParcelInfo(
  coords: WGS84Coordinates
): Promise<ToolResult<ParcelInfo>> {
  try {
    const utm = wgs84ToUtm(coords);

    const result = await queryAtPoint<ParcelProperties>(
      ENDPOINTS.parcels,
      utm,
      1
    );

    if (result.features.length === 0) {
      return {
        success: false,
        error: {
          code: "NO_DATA_AT_LOCATION",
          message: "No parcel found at this location",
          layer: "alkis_flurstuecke",
        },
      };
    }

    const feature = result.features[0];
    const props = feature.properties;

    // Transform geometry to WGS84
    const boundaryWgs84 = transformGeometryToWgs84(feature.geometry);

    return {
      success: true,
      data: {
        flurstueck_id: props.fsko,
        gemarkung: props.namgmk,
        flur: props.fln,
        zaehler: props.zae,
        nenner: props.nen || undefined,
        area_sqm: props.afl,
        boundary_wgs84: boundaryWgs84 as GeoJSONPolygon,
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      return { success: false, error: error as BerlinWFSError };
    }
    return {
      success: false,
      error: {
        code: "WFS_SERVICE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
