import type { WFSEndpoint } from "../types.js";

// Berlin GDI WFS endpoints
const GDI_BASE = "https://gdi.berlin.de/services/wfs";

export const ENDPOINTS = {
  // Address geocoding
  addresses: {
    baseUrl: `${GDI_BASE}/adressen_berlin`,
    typeName: "adressen_berlin:adressen_berlin",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  // Cadastral parcels (Flurstücke)
  parcels: {
    baseUrl: `${GDI_BASE}/alkis_flurstuecke`,
    typeName: "alkis_flurstuecke:flurstuecke",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  // Land use plan (Flächennutzungsplan)
  landUsePlan: {
    baseUrl: `${GDI_BASE}/fnp_ak`,
    typeName: "fnp_ak:fnp_ak_vektor",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  // Development plans (B-Pläne)
  bplanInPreparation: {
    baseUrl: `${GDI_BASE}/bplan`,
    typeName: "bplan:a_bp_iv",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  bplanLegallyBinding: {
    baseUrl: `${GDI_BASE}/bplan`,
    typeName: "bplan:b_bp_fs",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  bplanLifted: {
    baseUrl: `${GDI_BASE}/bplan`,
    typeName: "bplan:c_bp_ak",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  // Redevelopment areas (Sanierungsgebiete)
  sanierungComprehensive: {
    baseUrl: `${GDI_BASE}/sanier`,
    typeName: "sanier:a_sanier_umfassend",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  sanierungSimplified: {
    baseUrl: `${GDI_BASE}/sanier`,
    typeName: "sanier:b_sanier_einfach",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  sanierungLifted: {
    baseUrl: `${GDI_BASE}/sanier`,
    typeName: "sanier:c_sanier_aufgehoben",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,
  // Bodenrichtwerte (BORIS) - land values by year
  bodenrichtwerte2025: {
    baseUrl: `${GDI_BASE}/brw2025`,
    typeName: "brw2025:brw_2025_vector",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  bodenrichtwerte2024: {
    baseUrl: `${GDI_BASE}/brw2024`,
    typeName: "brw2024:brw_2024_vector",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,

  bodenrichtwerte2023: {
    baseUrl: `${GDI_BASE}/brw2023`,
    typeName: "brw2023:brw_2023_vector",
    geometryColumn: "geom",
  } satisfies WFSEndpoint,
} as const;

// FNP designation code mappings
export const FNP_DESIGNATIONS: Record<string, { name: string; description: string }> = {
  W: { name: "Wohnbaufläche", description: "Residential area" },
  M: { name: "Gemischte Baufläche", description: "Mixed-use area" },
  GE: { name: "Gewerbliche Baufläche", description: "Commercial area" },
  GI: { name: "Industriegebiet", description: "Industrial area" },
  S: { name: "Sonderbaufläche", description: "Special building area" },
  G: { name: "Grünfläche", description: "Green space" },
  "W/M": { name: "Wohnbaufläche/Gemischte Baufläche", description: "Residential/Mixed-use area" },
  V: { name: "Verkehrsfläche", description: "Traffic/Transportation area" },
  F: { name: "Fläche für die Landwirtschaft", description: "Agricultural area" },
  WA: { name: "Waldgebiet", description: "Forest area" },
  WS: { name: "Wasserfläche", description: "Water body" },
};
