import type {
  WGS84Coordinates,
  Bodenrichtwert,
  BodenrichtwertEntry,
  ToolResult,
  BerlinWFSError,
  WFSFeatureCollection,
} from "../types.js";
import { queryAtPoint } from "../wfs/client.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { wgs84ToUtm, transformGeometryToWgs84 } from "../utils/coordinates.js";

// WFS BORIS properties (actual field names from Berlin BORIS WFS)
interface BorisProperties {
  brw: number;              // Bodenrichtwert in €/m²
  stichtag: string;         // Reference date (e.g., "2025-01-01")
  nutzung: string;          // Land use (e.g., "W - Wohngebiet")
  gfz: number | null;       // Floor area ratio
  beitragszustand: string | null;  // Development contribution status
  bezirk: string;           // District
}

// Empty feature collection for error fallback
const emptyCollection = <P>(): WFSFeatureCollection<P> => ({
  type: "FeatureCollection",
  features: [],
});

/**
 * Parse a single BORIS feature into a BodenrichtwertEntry
 */
function parseBorisFeature(
  feature: WFSFeatureCollection<BorisProperties>["features"][0]
): BodenrichtwertEntry {
  const props = feature.properties;
  const gfz = props.gfz || undefined;
  return {
    brw: props.brw,
    brw_with_gfz: gfz ? props.brw * gfz : undefined,
    stichtag: props.stichtag,
    nutzung: props.nutzung,
    gfz,
    beitragszustand: props.beitragszustand || undefined,
    bezirk: props.bezirk,
  };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Get Bodenrichtwert (land value) at a location for the last 3 years
 */
export async function getBodenrichtwert(
  coords: WGS84Coordinates
): Promise<ToolResult<Bodenrichtwert>> {
  try {
    const utm = wgs84ToUtm(coords);

    // Query all 3 years in parallel
    const [result2025, result2024, result2023] = await Promise.all([
      queryAtPoint<BorisProperties>(ENDPOINTS.bodenrichtwerte2025, utm, 1).catch(
        () => emptyCollection<BorisProperties>()
      ),
      queryAtPoint<BorisProperties>(ENDPOINTS.bodenrichtwerte2024, utm, 1).catch(
        () => emptyCollection<BorisProperties>()
      ),
      queryAtPoint<BorisProperties>(ENDPOINTS.bodenrichtwerte2023, utm, 1).catch(
        () => emptyCollection<BorisProperties>()
      ),
    ]);

    // Check if we have at least the current year's data
    if (result2025.features.length === 0) {
      // Fall back to 2024 if 2025 not available
      if (result2024.features.length === 0) {
        return {
          success: false,
          error: {
            code: "NO_DATA_AT_LOCATION",
            message: "No Bodenrichtwert data at this location",
            layer: "brw2025",
          },
        };
      }
    }

    // Parse results
    const entry2025 = result2025.features.length > 0
      ? parseBorisFeature(result2025.features[0])
      : null;
    const entry2024 = result2024.features.length > 0
      ? parseBorisFeature(result2024.features[0])
      : null;
    const entry2023 = result2023.features.length > 0
      ? parseBorisFeature(result2023.features[0])
      : null;

    // Use most recent available as current
    const current = entry2025 || entry2024!;

    // Build history array (older years)
    const history: BodenrichtwertEntry[] = [];
    if (entry2025 && entry2024) {
      history.push(entry2024);
    }
    if (entry2023) {
      history.push(entry2023);
    }

    // Calculate trend
    const trend: Bodenrichtwert["trend"] = {};
    if (entry2025 && entry2024) {
      trend.change_1y_percent = calculatePercentChange(entry2025.brw, entry2024.brw);
    }
    if (entry2025 && entry2023) {
      trend.change_2y_percent = calculatePercentChange(entry2025.brw, entry2023.brw);
    } else if (entry2024 && entry2023) {
      // If no 2025, calculate from 2024
      trend.change_1y_percent = calculatePercentChange(entry2024.brw, entry2023.brw);
    }

    // Transform geometry from most recent result
    const geometry = result2025.features[0]?.geometry || result2024.features[0]?.geometry;
    const boundaryWgs84 = transformGeometryToWgs84(geometry || null);

    return {
      success: true,
      data: {
        current,
        history,
        trend: Object.keys(trend).length > 0 ? trend : undefined,
        boundary_wgs84: boundaryWgs84 || undefined,
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
