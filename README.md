# Berlin Open Data MCP Server

An MCP (Model Context Protocol) server that wraps Berlin's WFS geodata services, enabling AI agents to look up property and planning information for Berlin addresses.

## Features

- **Address Geocoding**: Convert Berlin addresses to coordinates
- **Parcel Information**: Get cadastral data (Flurstück) for any location
- **Land Use Plans**: Query the FNP (Flächennutzungsplan) designation
- **Development Plans**: Find applicable B-Pläne (Bebauungspläne)
- **Redevelopment Areas**: Check Sanierungsgebiet status

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "berlin-open-data": {
      "command": "node",
      "args": ["/path/to/berlin-open-data/dist/index.js"]
    }
  }
}
```

### Available Tools

#### `geocode_address`
Geocode a Berlin address to coordinates.

```json
{
  "street": "Unter den Linden",
  "house_number": "77",
  "postal_code": "10117"
}
```

#### `get_parcel_info`
Get cadastral parcel information at coordinates.

```json
{
  "lat": 52.5170365,
  "lon": 13.3888599
}
```

#### `get_land_use_plan`
Get FNP (land use plan) designation at coordinates.

```json
{
  "lat": 52.5170365,
  "lon": 13.3888599
}
```

#### `get_development_plans`
Get development plans (B-Pläne) at coordinates.

```json
{
  "lat": 52.5170365,
  "lon": 13.3888599
}
```

#### `get_redevelopment_areas`
Check if location is in a redevelopment area.

```json
{
  "lat": 52.5170365,
  "lon": 13.3888599
}
```

#### `lookup_property`
Combined lookup - geocodes address then queries all property data.

```json
{
  "street": "Pariser Platz",
  "house_number": "1"
}
```

## Data Sources

All data is queried from Berlin's official WFS (Web Feature Service) endpoints:

- **Addresses**: `gdi.berlin.de/services/wfs/adressen_berlin`
- **Parcels**: `gdi.berlin.de/services/wfs/alkis_flurstuecke`
- **Land Use Plan**: `gdi.berlin.de/services/wfs/fnp_ak`
- **Development Plans**: `gdi.berlin.de/services/wfs/bplan`
- **Redevelopment Areas**: `gdi.berlin.de/services/wfs/sanier`

## Coordinate Systems

The server handles coordinate transformation automatically:

- Input/Output: WGS84 (EPSG:4326) - standard lat/lon
- Berlin WFS: ETRS89 / UTM zone 33N (EPSG:25833)

## Error Handling

All tools return structured responses:

```typescript
// Success
{
  "success": true,
  "data": { /* tool-specific data */ }
}

// Error
{
  "success": false,
  "error": {
    "code": "ADDRESS_NOT_FOUND" | "WFS_SERVICE_ERROR" | "NO_DATA_AT_LOCATION" | "TIMEOUT",
    "message": "Human-readable error description"
  }
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT
