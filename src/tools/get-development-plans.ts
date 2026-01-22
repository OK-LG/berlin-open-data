import type {
  WGS84Coordinates,
  DevelopmentPlan,
  BPlanStatus,
  ToolResult,
  WFSFeatureCollection,
  BerlinWFSError,
} from "../types.js";
import { queryAtPoint } from "../wfs/client.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { wgs84ToUtm, transformGeometryToWgs84 } from "../utils/coordinates.js";

// WFS B-Plan properties
interface BPlanProperties {
  bezeichnung?: string;
  name?: string;
  festsetz_datum?: string;
  abl_datum?: string;
}

// Empty feature collection for error fallback
const emptyCollection = <P>(): WFSFeatureCollection<P> => ({
  type: "FeatureCollection",
  features: [],
});

/**
 * Get development plans (B-Pläne) at a location
 */
export async function getDevelopmentPlans(
  coords: WGS84Coordinates
): Promise<ToolResult<DevelopmentPlan[]>> {
  try {
    const utm = wgs84ToUtm(coords);

    // Query all three B-Plan layers in parallel
    const [inPrep, legallyBinding, lifted] = await Promise.all([
      queryAtPoint<BPlanProperties>(ENDPOINTS.bplanInPreparation, utm).catch(
        () => emptyCollection<BPlanProperties>()
      ),
      queryAtPoint<BPlanProperties>(ENDPOINTS.bplanLegallyBinding, utm).catch(
        () => emptyCollection<BPlanProperties>()
      ),
      queryAtPoint<BPlanProperties>(ENDPOINTS.bplanLifted, utm).catch(
        () => emptyCollection<BPlanProperties>()
      ),
    ]);

    const plans: DevelopmentPlan[] = [];

    // Process in-preparation plans
    for (const feature of inPrep.features) {
      plans.push(mapToPlan(feature, "in_preparation"));
    }

    // Process legally binding plans
    for (const feature of legallyBinding.features) {
      plans.push(mapToPlan(feature, "legally_binding"));
    }

    // Process lifted plans
    for (const feature of lifted.features) {
      plans.push(mapToPlan(feature, "lifted"));
    }

    return {
      success: true,
      data: plans,
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

function mapToPlan(
  feature: WFSFeatureCollection<BPlanProperties>["features"][0],
  status: BPlanStatus
): DevelopmentPlan {
  const props = feature.properties;
  const boundaryWgs84 = transformGeometryToWgs84(feature.geometry);

  return {
    name: props.bezeichnung || props.name || "Unknown",
    status,
    gazette_date: props.festsetz_datum || props.abl_datum,
    boundary_wgs84: boundaryWgs84 || undefined,
  };
}
