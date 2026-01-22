import type { WFSEndpoint, WFSFeatureCollection, BerlinWFSError, UTMCoordinates } from "../types.js";

const REQUEST_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 1;

interface WFSQueryOptions {
  endpoint: WFSEndpoint;
  cqlFilter?: string;
  maxFeatures?: number;
  propertyNames?: string[];
}

/**
 * Build a WFS GetFeature URL
 */
function buildWfsUrl(options: WFSQueryOptions): string {
  const { endpoint, cqlFilter, maxFeatures, propertyNames } = options;

  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typenames: endpoint.typeName,
    outputFormat: "application/json",
  });

  if (cqlFilter) {
    params.set("CQL_FILTER", cqlFilter);
  }

  if (maxFeatures) {
    params.set("count", maxFeatures.toString());
  }

  if (propertyNames && propertyNames.length > 0) {
    params.set("propertyName", propertyNames.join(","));
  }

  return `${endpoint.baseUrl}?${params.toString()}`;
}

/**
 * Execute a WFS request with timeout and retry logic
 */
async function executeRequest(url: string, retryCount = 0): Promise<WFSFeatureCollection> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WFSFeatureCollection;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw { code: "TIMEOUT", message: "WFS request timed out" } as BerlinWFSError;
    }

    // Retry on transient errors
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return executeRequest(url, retryCount + 1);
    }

    throw {
      code: "WFS_SERVICE_ERROR",
      message: error instanceof Error ? error.message : "Unknown WFS error",
    } as BerlinWFSError;
  }
}

/**
 * Query WFS with a CQL filter
 */
export async function queryWfs<P = Record<string, unknown>>(
  options: WFSQueryOptions
): Promise<WFSFeatureCollection<P>> {
  const url = buildWfsUrl(options);
  return executeRequest(url) as Promise<WFSFeatureCollection<P>>;
}

/**
 * Build a CQL spatial intersection filter for a point
 * Note: Berlin WFS uses EPSG:25833 (UTM) coordinates
 */
export function buildPointIntersectionFilter(
  geometryColumn: string,
  utm: UTMCoordinates
): string {
  // Round to reasonable precision (millimeters)
  const x = utm.x.toFixed(3);
  const y = utm.y.toFixed(3);
  return `INTERSECTS(${geometryColumn}, POINT(${x} ${y}))`;
}

/**
 * Build a CQL text filter for address matching
 * Field names from Berlin WFS: str_name, hnr (numeric), plz
 */
export function buildAddressFilter(
  street: string,
  houseNumber: string,
  postalCode?: string
): string {
  // Escape single quotes in street name
  const escapedStreet = street.replace(/'/g, "''");

  // hnr is a numeric field, so no quotes around the value
  let filter = `str_name ILIKE '%${escapedStreet}%' AND hnr=${houseNumber}`;

  if (postalCode) {
    filter += ` AND plz='${postalCode}'`;
  }

  return filter;
}

/**
 * Query features at a specific point location
 */
export async function queryAtPoint<P = Record<string, unknown>>(
  endpoint: WFSEndpoint,
  utm: UTMCoordinates,
  maxFeatures?: number
): Promise<WFSFeatureCollection<P>> {
  const cqlFilter = buildPointIntersectionFilter(endpoint.geometryColumn, utm);
  return queryWfs<P>({ endpoint, cqlFilter, maxFeatures });
}
