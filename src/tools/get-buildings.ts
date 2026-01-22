import type { WGS84Coordinates, ToolResult, Building, BerlinWFSError } from "../types.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { queryAtPoint } from "../wfs/client.js";
import { wgs84ToUtm } from "../utils/coordinates.js";

/**
 * Get building footprints at a location
 */
export async function getBuildingFootprints(
  coords: WGS84Coordinates
): Promise<ToolResult<Building[]>> {
  try {
    const utm = wgs84ToUtm(coords);
    const buffer = 50; // 50 meter search radius

    const result = await queryAtPoint(
      ENDPOINTS.buildings,
      utm,
      buffer
    );

    if (result.features.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const buildings: Building[] = result.features.map((feature: any) => ({
      geometry: feature.geometry,
      properties: feature.properties || {},
    }));

    return {
      success: true,
      data: buildings,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      return { success: false, error: error as BerlinWFSError };
    }
    return {
      success: false,
      error: {
        code: "WFS_SERVICE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error querying buildings service",
      },
    };
  }
}
