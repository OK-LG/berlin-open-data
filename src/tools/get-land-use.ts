import type {
  WGS84Coordinates,
  LandUsePlan,
  ToolResult,
  BerlinWFSError,
} from "../types.js";
import { queryAtPoint } from "../wfs/client.js";
import { ENDPOINTS, FNP_DESIGNATIONS } from "../wfs/endpoints.js";
import { wgs84ToUtm, transformGeometryToWgs84 } from "../utils/coordinates.js";

// WFS FNP properties
interface FNPProperties {
  nutzungsart?: string;
  nutzung?: string;
  art?: string;
  bezeichnung?: string;
}

/**
 * Get land use plan (FNP) designation at a location
 */
export async function getLandUsePlan(
  coords: WGS84Coordinates
): Promise<ToolResult<LandUsePlan>> {
  try {
    const utm = wgs84ToUtm(coords);

    const result = await queryAtPoint<FNPProperties>(
      ENDPOINTS.landUsePlan,
      utm,
      1
    );

    if (result.features.length === 0) {
      return {
        success: false,
        error: {
          code: "NO_DATA_AT_LOCATION",
          message: "No land use plan data at this location",
          layer: "fnp_ak",
        },
      };
    }

    const feature = result.features[0];
    const props = feature.properties;

    // Try different property names that might contain the designation code
    const code = props.nutzungsart || props.nutzung || props.art || props.bezeichnung || "Unknown";

    // Look up the designation details
    const designationInfo = FNP_DESIGNATIONS[code] || {
      name: code,
      description: "Unknown designation",
    };

    // Transform geometry to WGS84
    const boundaryWgs84 = transformGeometryToWgs84(feature.geometry);

    return {
      success: true,
      data: {
        designation: {
          code,
          name: designationInfo.name,
          description: designationInfo.description,
        },
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
