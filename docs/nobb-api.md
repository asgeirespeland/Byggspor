# NOBB Export API

## Overview

The NOBB Export API provides access to the Norwegian building materials database. We use it to look up products by GTIN or NOBB number (from EHF invoices) and retrieve EPD (Environmental Product Declaration) data for CO2 calculations.

- **Base URL**: `https://export.byggtjeneste.no`
- **Auth**: Basic authentication (username/password)
- **Rate limit**: 200 requests/minute (HTTP 429 when exceeded)
- **Format**: JSON
- **Docs**: https://support.byggtjeneste.no/nea/v1/
- **Swagger**: https://export.byggtjeneste.no/swagger/index.html

## Credentials

Stored in environment variables (`NOBB_API_USERNAME`, `NOBB_API_PASSWORD`). See `.env.example`.

## What We Get From Invoices

An Optimera invoice line looks like this (from PDF — XML/EHF will be structured):

```
Standard identifisering: 7038840000020 [0160]
Tilleggsegenskaper: NOBB: 20004859
...
```

- `[0160]` is the GS1/EHF element identifier for GTIN
- GTIN can be 8, 12, 13, or 14 digits (GTIN-8, GTIN-12, GTIN-13, GTIN-14)
- The NOBB number is also provided directly as a plain integer

We should support lookup by **both** GTIN and NOBB number. Some invoices will not follow the exact same format, so we should be flexible in parsing, but we can't support every possible variation. Some assumptions must be made here.
GTIN is searchable in NOBB as string, NOBB number is searchable as integer. Becomes clear under the "Lookup Flow" section below.

## Lookup Flow

### Option A: Search by GTIN

```
POST /api/v2/items/search
Content-Type: application/json

{
  "gtinNos": ["7038840000020"]
}
```

### Option B: Search by NOBB Number. Though NOBB is directly searchable by GET, it is probably recommended using the search endpoint for both GTIN and NOBB to keep the flow consistent and handle cases where we only have GTIN or only have NOBB. Should be discussed.

```
POST /api/v2/items/search
Content-Type: application/json

{
  "nobbNos": [20004859]
}
```

Note: as stated the `gtinNos` is an array of **strings**, `nobbNos` is an array of **integers**.

Both return minimal data. Example response (from GTIN search):

```json
[
  {
    "nobbNo": 20004859,
    "gtin": "7038840000020",
    "productText1": "ARBOR SPONPL GULV 2420 STD",
    "productText2": "22X620X2420 N/F 4S STANDARD",
    "productDescription": "Arbor Standard Gulv 22 mm er godkjent brukt som ...",
    "ownerParticipantNo": 58222,
    "ownerParticipantName": "Arbor AS"
  }
]
```

**Note**: When searching by `nobbNos`, the `gtin` field is NOT included in the response. When searching by `gtinNos`, it is.

### Step 2: Get Full Item Details

Use the NOBB number from the search (or directly from the invoice):

```
GET /api/v2/items?nobbnos=20004859
```

This returns the full item with properties, suppliers, packages, and EPD data.

## Response Structure

Key fields from `GET /api/v2/items`:

```
nobbNumber          - NOBB item number
primaryText         - Product name
secondaryText       - Brand/variant
description         - Full product description
productGroupNumber  - Category number
productGroupName    - Category name (e.g. "Sponplater Ubehandlet")
moduleNumber        - Module number
environmentLabels   - Array of labels (e.g. ["PEFC"])

suppliers[]
  .name                     - Supplier name
  .participantNumber        - Supplier ID
  .packages[]
    .class                  - Package type: "F-PAK" (consumer), "D-PAK" (trade), "T-PAK" (logistics)
    .gtin                   - GTIN for this package level
    .weight                 - Weight in kg
    .unit                   - Unit code (e.g. "STK", "ESK", "KRT")
    .consistsOfCount        - How many base units in this package
    .consistsOfUnit         - Base unit

properties.marketing[]      - Marketing properties (model name, series, etc.)
properties.environment[]    - Environmental certifications (EPD exists, PEFC, BREEAM, etc.)
properties.epd[]            - EPD data with GWP values (see below)
properties.etim[]           - ETIM classification properties
```

## EPD Data (CO2/GWP Values)

EPD properties are in `properties.epd[]`. Each entry has `propertyName`, `value`, and `unit`.

### Key EPD Fields

| Field | Example Value | Description |
|-------|--------------|-------------|
| `EPD registration number` | NEPD-4131-3358 | EPD identifier |
| `Declared unit` | 1 m3 | Reference unit for all GWP values |
| `Conversion factor to mass (kg)` | 632.26 | kg per declared unit |
| `Calcuation factor to NOBB price unit` | 0.022 | Multiply by this to convert from declared unit to per-item |
| `Reference service life` | 60 | Years |
| `EN 15804:2012+A2:2019` | True | Which standard the EPD follows |

### GWP Values (kg CO2 eq. per declared unit)

Life cycle stages according to EN 15804:

| Stage | Description | Example Value |
|-------|-------------|---------------|
| `Tot A1 To A3 GWP Total` | **Production** (raw materials + manufacturing) | -10.626 |
| `Tot A1 To A3 Fossil` | Production — fossil CO2 only | 3.762 |
| `Tot A1 To A3 Biogenic` | Production — biogenic CO2 (carbon stored in wood = negative) | -14.388 |
| `A4 GWP Total` | Transport to construction site | 0.5214 |
| `A5 GWP Total` | Installation/construction | 0.231 |
| `C1 GWP Total` | Demolition | 0.000157 |
| `C2 GWP Total` | Waste transport | 0.19668 |
| `C3 GWP Total` | Waste processing (e.g. incineration — releases biogenic carbon) | 14.498 |
| `C4 GWP Total` | Disposal | 0.000013 |
| `D GWP Total` | Benefits beyond system boundary (recycling credits) | -0.6094 |

Each stage also has `Fossil`, `Biogenic`, and `LULUC` (land use) breakdowns.

**GWP-IOBC** values are also provided (identical to Fossil for most stages). These exclude biogenic carbon, useful for simplified reporting.

### Calculating CO2 per Item

1. Get `Calcuation factor to NOBB price unit` from EPD (e.g. `0.022`)
2. Get the relevant GWP Total value (e.g. A1-A3: `3.762` kg CO2 eq. fossil per m3)
3. Multiply: `0.022 * 3.762 = 0.083 kg CO2 eq.` per item (fossil only)

For a full lifecycle estimate, sum stages A1-A3 + A4 + A5 + C1-C4.

## Items Without EPD

Not all products have EPD data. Simple accessories (tools, hooks, screws) typically don't. The `properties.epd` array will be empty.

For these items, possible fallbacks:
- Use product group averages
- Flag for manual input (confidence score = low)
- Use weight-based estimates from the package data

## Available Endpoints

### Items
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/items` | Get items. Params: `nobbnos`, `suppliers`, `from`, `to`, `pageSize`, `pageToken` |
| POST | `/api/v2/items` | Get items by list of NOBB numbers (body: array of ints) |
| POST | `/api/v2/items/search` | Search by `gtinNos`, `nobbNos`, or `nrfNos` |

### Properties
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/properties/items/{nobbno}` | Get all properties for an item |
| GET | `/api/v1/properties` | List all property definitions |
| GET | `/api/v1/properties/groups` | List property groups |

### Prices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/prices` | Get prices. Params: `nobbnos`, `suppliers`, `from`, `to` |
| POST | `/api/v2/prices` | Get prices for list of NOBB numbers |

### Product Groups
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/productgroups` | Get all product groups |

### Media
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/media/{guid}` | Get media content by GUID |
| GET | `/api/v2/media/images/items/{nobbno}/{imagetype}` | Get product image |
| GET | `/api/v1/media/documents/items/{nobbno}/{publicationtype}` | Get product document (e.g. EPD PDF) |

## Pagination

Use `pageSize` (max 10000, default 1000) and `pageToken` (opaque token from previous response) for paginated endpoints.

## Example: Full Lookup with curl

```bash
# Search by GTIN
curl -u "$NOBB_API_USERNAME:$NOBB_API_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"gtinNos": ["7038840000020"]}' \
  https://export.byggtjeneste.no/api/v2/items/search

# Search by NOBB number
curl -u "$NOBB_API_USERNAME:$NOBB_API_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"nobbNos": [20004859]}' \
  https://export.byggtjeneste.no/api/v2/items/search

# Get full item details (with EPD)
curl -u "$NOBB_API_USERNAME:$NOBB_API_PASSWORD" \
  https://export.byggtjeneste.no/api/v2/items?nobbnos=20004859
```
