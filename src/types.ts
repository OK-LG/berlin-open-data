// Coordinate types
export interface WGS84Coordinates {
  lat: number;
  lon: number;
}

export interface UTMCoordinates {
  x: number;
  y: number;
  epsg: "EPSG:25833";
}

export interface Coordinates {
  wgs84: WGS84Coordinates;
  utm: UTMCoordinates;
}

// Address types
export interface AddressInput {
  street: string;
  house_number: string;
  postal_code?: string;
}

export interface GeocodedAddress {
  street: string;
  house_number: string;
  postal_code: string;
  district: string;
  coordinates: Coordinates;
}

// Parcel (Flurstück) types
export interface ParcelInfo {
  flurstueck_id: string;
  gemarkung: string;
  flur: string;
  zaehler: string;
  nenner?: string;
  area_sqm: number;
  boundary_wgs84: GeoJSONPolygon;
}

// Building types
export interface Building {
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown>;
}

// GeoJSON types
export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type GeoJSONGeometry = GeoJSONPolygon | GeoJSONPoint | GeoJSONMultiPolygon;

// Land Use Plan (FNP) types
export type FNPDesignationCode =
  | "W"      // Wohnbaufläche
  | "M"      // Gemischte Baufläche
  | "GE"     // Gewerbliche Baufläche
  | "GI"     // Industriegebiet
  | "S"      // Sonderbaufläche
  | "G"      // Grünfläche
  | "W/M"    // Wohnbaufläche/Gemischte Baufläche
  | string;  // Allow other codes

export interface FNPDesignation {
  code: FNPDesignationCode;
  name: string;
  description?: string;
}

export interface LandUsePlan {
  designation: FNPDesignation;
  boundary_wgs84?: GeoJSONGeometry;
}

// Development Plan (B-Plan) types
export type BPlanStatus =
  | "in_preparation"   // In Aufstellung
  | "legally_binding"  // Festgesetzt
  | "lifted";          // Aufgehoben

export interface DevelopmentPlan {
  name: string;
  status: BPlanStatus;
  gazette_date?: string;
  boundary_wgs84?: GeoJSONGeometry;
}

// Redevelopment Area (Sanierungsgebiet) types
export type RedevelopmentType =
  | "comprehensive"  // Umfassend
  | "simplified"     // Einfach
  | "lifted";        // Aufgehoben

export interface RedevelopmentArea {
  name: string;
  type: RedevelopmentType;
  designation_date?: string;
  boundary_wgs84?: GeoJSONGeometry;
}

// Bodenrichtwert (land value) types - single year
export interface BodenrichtwertEntry {
  brw: number;              // Land value in €/m²
  brw_with_gfz?: number;    // Land value × GFZ (effective value per buildable m²)
  stichtag: string;         // Reference date
  nutzung: string;          // Land use type
  gfz?: number;             // Floor area ratio (Geschossflächenzahl)
  beitragszustand?: string; // Development contribution status
  bezirk: string;           // District
}

// Bodenrichtwert with historical data (last 3 years)
export interface Bodenrichtwert {
  current: BodenrichtwertEntry;           // Most recent (2025)
  history: BodenrichtwertEntry[];         // Previous years (2024, 2023)
  trend?: {
    change_1y_percent?: number;           // Change from previous year
    change_2y_percent?: number;           // Change from 2 years ago
  };
  boundary_wgs84?: GeoJSONGeometry;
}

// Combined property lookup result
export interface PropertyLookupResult {
  address: GeocodedAddress;
  parcel?: ParcelInfo;
  buildings: Building[];
  land_use_plan?: LandUsePlan;
  bodenrichtwert?: Bodenrichtwert;
  development_plans: DevelopmentPlan[];
  redevelopment_areas: RedevelopmentArea[];
}

// Error types
export type BerlinWFSErrorCode =
  | "ADDRESS_NOT_FOUND"
  | "WFS_SERVICE_ERROR"
  | "NO_DATA_AT_LOCATION"
  | "INVALID_COORDINATES"
  | "TIMEOUT";

export interface BerlinWFSError {
  code: BerlinWFSErrorCode;
  message: string;
  layer?: string;
}

// Tool result types
export interface ToolSuccess<T> {
  success: true;
  data: T;
}

export interface ToolError {
  success: false;
  error: BerlinWFSError;
}

export type ToolResult<T> = ToolSuccess<T> | ToolError;

// WFS response types
export interface WFSFeature<P = Record<string, unknown>> {
  type: "Feature";
  id: string;
  geometry: GeoJSONGeometry | null;
  properties: P;
}

export interface WFSFeatureCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: WFSFeature<P>[];
  numberMatched?: number;
  numberReturned?: number;
}

// WFS endpoint configuration
export interface WFSEndpoint {
  baseUrl: string;
  typeName: string;
  geometryColumn: string;
}
