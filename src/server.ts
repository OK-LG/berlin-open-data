#!/usr/bin/env node
/**
 * HTTP server entry point for remote MCP hosting
 * Uses stateless request handling - creates new server per request
 */
import { createServer, IncomingMessage, ServerResponse } from "node:http";
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

// Store active transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

// Function to create and configure a new MCP server instance
function createMcpServer(): McpServer {
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

  // Register all tools
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
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_parcel_info",
    TOOL_METADATA.get_parcel_info.description,
    coordinatesInputSchema,
    async (args) => {
      const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
      const result = await getParcelInfo(coords);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_land_use_plan",
    TOOL_METADATA.get_land_use_plan.description,
    coordinatesInputSchema,
    async (args) => {
      const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
      const result = await getLandUsePlan(coords);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_development_plans",
    TOOL_METADATA.get_development_plans.description,
    coordinatesInputSchema,
    async (args) => {
      const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
      const result = await getDevelopmentPlans(coords);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_redevelopment_areas",
    TOOL_METADATA.get_redevelopment_areas.description,
    coordinatesInputSchema,
    async (args) => {
      const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
      const result = await getRedevelopmentAreas(coords);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_bodenrichtwert",
    TOOL_METADATA.get_bodenrichtwert.description,
    coordinatesInputSchema,
    async (args) => {
      const coords: WGS84Coordinates = { lat: args.lat, lon: args.lon };
      const result = await getBodenrichtwert(coords);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

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
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

// Handle MCP requests with session management
async function handleMcpRequest(req: IncomingMessage, res: ServerResponse) {
  // Get session ID from header or query param
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const sessionId = req.headers["mcp-session-id"] as string || url.searchParams.get("sessionId");

  // For new sessions (no session ID or initialize request), create new transport
  if (!sessionId || req.method === "POST") {
    // Check if this is an initialize request by peeking at the body
    const newSessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
    });

    // Create and connect a new MCP server for this session
    const mcpServer = createMcpServer();
    await mcpServer.connect(transport);

    // Store for future requests in this session
    transports.set(newSessionId, transport);

    // Clean up old sessions (keep last 100)
    if (transports.size > 100) {
      const oldestKey = transports.keys().next().value;
      if (oldestKey) transports.delete(oldestKey);
    }

    await transport.handleRequest(req, res);
    return;
  }

  // For existing sessions, use stored transport
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    // Session not found - create new one
    const newTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });
    const mcpServer = createMcpServer();
    await mcpServer.connect(newTransport);
    transports.set(sessionId, newTransport);
    await newTransport.handleRequest(req, res);
  }
}

// Create HTTP server
const httpServer = createServer(async (req, res) => {
  // CORS headers for remote access
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "berlin-open-data" }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
    try {
      await handleMcpRequest(req, res);
    } catch (error) {
      console.error("MCP request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
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

// Start server
httpServer.listen(PORT, () => {
  console.log(`Berlin Open Data MCP server running on http://0.0.0.0:${PORT}`);
  console.log(`MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});
