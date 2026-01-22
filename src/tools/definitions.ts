// MCP Tool definitions for Berlin Open Data
import * as z from "zod/v4";

// Zod schemas for tool inputs
export const addressInputSchema = {
  street: z.string().describe("Street name (e.g., 'Unter den Linden')"),
  house_number: z.string().describe("House number (e.g., '77')"),
  postal_code: z.string().optional().describe("Optional postal code to narrow down results (e.g., '10117')"),
};

export const coordinatesInputSchema = {
  lat: z.number().describe("Latitude (WGS84)"),
  lon: z.number().describe("Longitude (WGS84)"),
};

// Tool metadata
export const TOOL_METADATA = {
  geocode_address: {
    description:
      "Geocode a Berlin address to get coordinates. Returns the normalized address with WGS84 (lat/lon) and UTM (EPSG:25833) coordinates.",
  },
  get_parcel_info: {
    description:
      "Get cadastral parcel (Flurstück) information for a location. Returns the parcel ID, Gemarkung, area, and boundary polygon.",
  },
  get_land_use_plan: {
    description:
      "Get the land use plan (Flächennutzungsplan/FNP) designation for a location. Returns the FNP code (e.g., W, GE, M) with full name.",
  },
  get_development_plans: {
    description:
      "Get development plans (Bebauungspläne/B-Pläne) for a location. Returns an array of B-Plans with their status (in_preparation, legally_binding, or lifted).",
  },
  get_redevelopment_areas: {
    description:
      "Check if a location is within a redevelopment area (Sanierungsgebiet). Returns array of areas with type (comprehensive, simplified, or lifted).",
  },
  get_bodenrichtwert: {
    description:
      "Get the Bodenrichtwert (official land value) from BORIS Berlin for a location. Returns data for the last 3 years (2023-2025) including: raw land value (brw) in €/m², effective value with GFZ (brw_with_gfz = brw × floor area ratio), land use type, and trend analysis showing year-over-year changes.",
  },
  lookup_property: {
    description:
      "Comprehensive property lookup by address. Geocodes the address then retrieves all available information: parcel data, land use plan, Bodenrichtwert (land value), development plans, and redevelopment area status.",
  },
} as const;

export type ToolName = keyof typeof TOOL_METADATA;
