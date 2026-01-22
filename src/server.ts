#!/usr/bin/env node
/**
 * HTTP server entry point for remote MCP hosting
 */
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

import {
  TOOL_METADATA,
  addressInputSchema,
  coordinatesInputSchema,
} from "./tools/definitions.js";
import { geocodeAddress } from "./tools/geocode-address.js";
import { getParcelInfo } from "./tools/get-parcel.js";
import { getLandUsePlan } from "./tools/get-land-use.js";
import { getDevelopmentPlans } from "./tools/get-development-plans.js";
import { getRedevelopmentAreas } from "./tools/get-redevelopment-areas.js";
import { getBodenrichtwert } from "./tools/get-bodenrichtwert.js";
import { lookupProperty } from "./tools/lookup-property.js";
import type { AddressInput, WGS84Coordinates } from "./types.js";

const PORT = parseInt(process.env.PORT || "8080", 10);

// Create MCP server
const mcpServer = new McpServer(
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

// Register all tools (same as index.ts)
mcpServer.tool(
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
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  "get_parcel_info",
  TOOL_METADATA.get_parcel_info.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
    const result = await getParcelInfo(coords);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  "get_land_use_plan",
  TOOL_METADATA.get_land_use_plan.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
    const result = await getLandUsePlan(coords);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  "get_development_plans",
  TOOL_METADATA.get_development_plans.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
    const result = await getDevelopmentPlans(coords);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  "get_redevelopment_areas",
  TOOL_METADATA.get_redevelopment_areas.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
    const result = await getRedevelopmentAreas(coords);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  "get_bodenrichtwert",
  TOOL_METADATA.get_bodenrichtwert.description,
  coordinatesInputSchema,
  async (args) => {
    const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
    const result = await getBodenrichtwert(coords);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
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
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Create HTTP transport
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

// Create HTTP server
const httpServer = createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "berlin-open-data" }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
    await transport.handleRequest(req, res);
    return;
  }

  // Root endpoint - info
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "berlin-open-data",
      version: "1.0.0",
      description: "MCP server for Berlin Open Data WFS services",
      mcp_endpoint: "/mcp",
      tools: Object.keys(TOOL_METADATA),
    }));
    return;
  }

  // 404 for everything else
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// Connect MCP server to transport
async function main() {
  await mcpServer.connect(transport);

  httpServer.listen(PORT, () => {
    console.log(`Berlin Open Data MCP server running on http://0.0.0.0:${PORT}`);
    console.log(`MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
    console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
