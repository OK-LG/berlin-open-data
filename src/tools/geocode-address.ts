import type {
  AddressInput,
  GeocodedAddress,
  ToolResult,
  WFSFeature,
  BerlinWFSError,
} from "../types.js";
import { queryWfs, buildAddressFilter } from "../wfs/client.js";
import { ENDPOINTS } from "../wfs/endpoints.js";
import { coordinatesFromUtm } from "../utils/coordinates.js";

// WFS address properties (actual field names from Berlin WFS)
interface AddressProperties {
  str_name: string;
  hnr: number;
  hnr_zusatz: string | null;
  plz: string;
  bez_name: string;
  ort_name: string;
}

/**
 * Geocode a Berlin address to coordinates
 */
export async function geocodeAddress(
  input: AddressInput
): Promise<ToolResult<GeocodedAddress>> {
  try {
    const cqlFilter = buildAddressFilter(
      input.street,
      input.house_number,
      input.postal_code
    );

    const result = await queryWfs<AddressProperties>({
      endpoint: ENDPOINTS.addresses,
      cqlFilter,
      maxFeatures: 1,
    });

    if (result.features.length === 0) {
      return {
        success: false,
        error: {
          code: "ADDRESS_NOT_FOUND",
          message: `No address found for: ${input.street} ${input.house_number}${input.postal_code ? ` (${input.postal_code})` : ""}`,
        },
      };
    }

    const feature = result.features[0] as WFSFeature<AddressProperties>;
    const props = feature.properties;
    const geometry = feature.geometry;

    if (!geometry || geometry.type !== "Point") {
      return {
        success: false,
        error: {
          code: "WFS_SERVICE_ERROR",
          message: "Address feature has no point geometry",
        },
      };
    }

    // Geometry coordinates are in EPSG:25833 (UTM)
    const [x, y] = geometry.coordinates;
    const coordinates = coordinatesFromUtm(x, y);

    // Build house number string (may include suffix like "1A")
    const houseNumber = props.hnr_zusatz
      ? `${props.hnr}${props.hnr_zusatz}`
      : String(props.hnr);

    return {
      success: true,
      data: {
        street: props.str_name,
        house_number: houseNumber,
        postal_code: props.plz,
        district: props.bez_name,
        coordinates,
      },
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
