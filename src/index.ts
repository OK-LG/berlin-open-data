#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  TOOL_METADATA,
  addressInputSchema,
  coordinatesInputSchema,
} from "./tools/definitions.js";
import { geocodeAddress } from "./tools/geocode-address.js";
import { getParcelInfo } from "./tools/get-parcel.js";
import { getBuildingFootprints } from "./tools/get-buildings.js";
import { getLandUsePlan } from "./tools/get-land-use.js";
import { getDevelopmentPlans } from "./tools/get-development-plans.js";
import { getRedevelopmentAreas } from "./tools/get-redevelopment-areas.js";
import { getBodenrichtwert } from "./tools/get-bodenrichtwert.js";
import { lookupProperty } from "./tools/lookup-property.js";
import type { AddressInput, WGS84Coordinates } from "./types.js";

// Create MCP server
const server = new McpServer(
  {
    name: "berlin-open-data",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register geocode_address tool
server.tool(
  "geocode_address",
  TOOL_METADATA.geocode_address.description,
  addressInputSchema,
  async (args) => {
    const input: AddressInput = {
      street: args.street,
      house_number: args.house_number,
      postal_code: args.postal_code,
    };

    const result = await geocodeAddress(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_parcel_info tool
server.tool(
  "get_parcel_info",
  TOOL_METADATA.get_parcel_info.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getParcelInfo(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_building_footprints tool
server.tool(
  "get_building_footprints",
  TOOL_METADATA.get_building_footprints.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getBuildingFootprints(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_land_use_plan tool
server.tool(
  "get_land_use_plan",
  TOOL_METADATA.get_land_use_plan.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getLandUsePlan(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_development_plans tool
server.tool(
  "get_development_plans",
  TOOL_METADATA.get_development_plans.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getDevelopmentPlans(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_redevelopment_areas tool
server.tool(
  "get_redevelopment_areas",
  TOOL_METADATA.get_redevelopment_areas.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getRedevelopmentAreas(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register get_bodenrichtwert tool
server.tool(
  "get_bodenrichtwert",
  TOOL_METADATA.get_bodenrichtwert.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = {
      lat: args.lat,
      lon: args.lon,
    };

    const result = await getBodenrichtwert(coords);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Register lookup_property tool
server.tool(
  "lookup_property",
  TOOL_METADATA.lookup_property.description,
  addressInputSchema,
  async (args) => {
    const input: AddressInput = {
      street: args.street,
      house_number: args.house_number,
      postal_code: args.postal_code,
    };

    const result = await lookupProperty(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Berlin Open Data MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
