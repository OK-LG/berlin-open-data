import type {
  WGS84Coordinates,
  RedevelopmentArea,
  RedevelopmentType,
  ToolResult,
  WFSFeatureCollection,
  BerlinWFSError,
} from "../types.js";
import { queryAtPoint } from "../wfs/client.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { wgs84ToUtm, transformGeometryToWgs84 } from "../utils/coordinates.js";

// WFS Sanierungsgebiet properties
interface SanierungProperties {
  bezeichnung?: string;
  name?: string;
  festsetz_datum?: string;
  aufhebung_datum?: string;
}

// Empty feature collection for error fallback
const emptyCollection = <P>(): WFSFeatureCollection<P> => ({
  type: "FeatureCollection",
  features: [],
});

/**
 * Get redevelopment areas (Sanierungsgebiete) at a location
 */
export async function getRedevelopmentAreas(
  coords: WGS84Coordinates
): Promise<ToolResult<RedevelopmentArea[]>> {
  try {
    const utm = wgs84ToUtm(coords);

    // Query all three Sanierung layers in parallel
    const [comprehensive, simplified, lifted] = await Promise.all([
      queryAtPoint<SanierungProperties>(
        ENDPOINTS.sanierungComprehensive,
        utm
      ).catch(() => emptyCollection<SanierungProperties>()),
      queryAtPoint<SanierungProperties>(
        ENDPOINTS.sanierungSimplified,
        utm
      ).catch(() => emptyCollection<SanierungProperties>()),
      queryAtPoint<SanierungProperties>(ENDPOINTS.sanierungLifted, utm).catch(
        () => emptyCollection<SanierungProperties>()
      ),
    ]);

    const areas: RedevelopmentArea[] = [];

    // Process comprehensive redevelopment areas
    for (const feature of comprehensive.features) {
      areas.push(mapToArea(feature, "comprehensive"));
    }

    // Process simplified redevelopment areas
    for (const feature of simplified.features) {
      areas.push(mapToArea(feature, "simplified"));
    }

    // Process lifted redevelopment areas
    for (const feature of lifted.features) {
      areas.push(mapToArea(feature, "lifted"));
    }

    return {
      success: true,
      data: areas,
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

function mapToArea(
  feature: WFSFeatureCollection<SanierungProperties>["features"][0],
  type: RedevelopmentType
): RedevelopmentArea {
  const props = feature.properties;
  const boundaryWgs84 = transformGeometryToWgs84(feature.geometry);

  return {
    name: props.bezeichnung || props.name || "Unknown",
    type,
    designation_date: props.festsetz_datum || props.aufhebung_datum,
    boundary_wgs84: boundaryWgs84 || undefined,
  };
}
