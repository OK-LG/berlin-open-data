import type { AddressInput, PropertyLookupResult, ToolResult } from "../types.js";
import { geocodeAddress } from "./geocode-address.js";
import { getParcelInfo } from "./get-parcel.js";
import { getLandUsePlan } from "./get-land-use.js";
import { getBodenrichtwert } from "./get-bodenrichtwert.js";
import { getDevelopmentPlans } from "./get-development-plans.js";
import { getRedevelopmentAreas } from "./get-redevelopment-areas.js";

/**
 * Comprehensive property lookup by address
 * Orchestrates all individual tools to provide complete property information
 */
export async function lookupProperty(
  input: AddressInput
): Promise<ToolResult<PropertyLookupResult>> {
  // Step 1: Geocode the address
  const geocodeResult = await geocodeAddress(input);

  if (!geocodeResult.success) {
    return geocodeResult;
  }

  const address = geocodeResult.data;
  const { wgs84 } = address.coordinates;

  // Step 2: Run all spatial queries in parallel
  const [parcelResult, landUseResult, bodenrichtwertResult, plansResult, areasResult] =
    await Promise.all([
      getParcelInfo(wgs84),
      getLandUsePlan(wgs84),
      getBodenrichtwert(wgs84),
      getDevelopmentPlans(wgs84),
      getRedevelopmentAreas(wgs84),
    ]);

  // Aggregate results (partial data is acceptable)
  const result: PropertyLookupResult = {
    address,
    parcel: parcelResult.success ? parcelResult.data : undefined,
    land_use_plan: landUseResult.success ? landUseResult.data : undefined,
    bodenrichtwert: bodenrichtwertResult.success ? bodenrichtwertResult.data : undefined,
    development_plans: plansResult.success ? plansResult.data : [],
    redevelopment_areas: areasResult.success ? areasResult.data : [],
  };

  return {
    success: true,
    data: result,
  };
}
