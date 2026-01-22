/**
 * Manual test script for Berlin Open Data MCP server
 * Run with: npx tsx test/manual-test.ts
 */

import { geocodeAddress } from "../src/tools/geocode-address.js";
import { getParcelInfo } from "../src/tools/get-parcel.js";
import { getLandUsePlan } from "../src/tools/get-land-use.js";
import { getDevelopmentPlans } from "../src/tools/get-development-plans.js";
import { getRedevelopmentAreas } from "../src/tools/get-redevelopment-areas.js";
import { lookupProperty } from "../src/tools/lookup-property.js";

async function test() {
  console.log("=== Berlin Open Data MCP Server Tests ===\n");

  // Test 1: Geocode address
  console.log("1. Testing geocode_address (Pariser Platz 1)...");
  const geocodeResult = await geocodeAddress({
    street: "Pariser Platz",
    house_number: "1",
  });
  console.log("Result:", JSON.stringify(geocodeResult, null, 2));
  console.log();

  if (!geocodeResult.success) {
    console.error("Geocoding failed, cannot continue with spatial queries");
    return;
  }

  const { lat, lon } = geocodeResult.data.coordinates.wgs84;
  console.log(`Coordinates: ${lat}, ${lon}\n`);

  // Test 2: Get parcel info
  console.log("2. Testing get_parcel_info...");
  const parcelResult = await getParcelInfo({ lat, lon });
  console.log("Result:", JSON.stringify(parcelResult, null, 2));
  console.log();

  // Test 3: Get land use plan
  console.log("3. Testing get_land_use_plan...");
  const landUseResult = await getLandUsePlan({ lat, lon });
  console.log("Result:", JSON.stringify(landUseResult, null, 2));
  console.log();

  // Test 4: Get development plans
  console.log("4. Testing get_development_plans...");
  const plansResult = await getDevelopmentPlans({ lat, lon });
  console.log("Result:", JSON.stringify(plansResult, null, 2));
  console.log();

  // Test 5: Get redevelopment areas
  console.log("5. Testing get_redevelopment_areas...");
  const areasResult = await getRedevelopmentAreas({ lat, lon });
  console.log("Result:", JSON.stringify(areasResult, null, 2));
  console.log();

  // Test 6: Full lookup
  console.log("6. Testing lookup_property (Unter den Linden 77)...");
  const lookupResult = await lookupProperty({
    street: "Unter den Linden",
    house_number: "77",
  });
  console.log("Result:", JSON.stringify(lookupResult, null, 2));
  console.log();

  console.log("=== Tests Complete ===");
}

test().catch(console.error);
