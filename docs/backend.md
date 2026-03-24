[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | **Backend** | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)

---

# Backend

The backend is a Python Flask REST API that handles authentication, data persistence, file parsing, external API integrations, and CO₂ calculations.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Flask |
| Language | Python 3.12+ |
| ORM | SQLAlchemy 2.0 (mapped columns) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Auth | PyJWT + Clerk JWKS |
| HTTP Client | requests (with retry) |
| Linting/Formatting | Ruff |

## Project Structure

```
backend/
├── alembic/                  # Database migrations
│   ├── versions/             # Migration files
│   └── env.py                # Reads DATABASE_URL from .env
├── alembic.ini
├── app/
│   ├── main.py               # Flask app, middleware, blueprint registration
│   ├── errors.py             # ApiError exception class and error handlers
│   ├── database.py           # SQLAlchemy engine and session factory
│   ├── middleware/
│   │   ├── auth.py           # Clerk JWT verification, user sync
│   │   └── roles.py          # @require_org_role / @require_project_role decorators
│   ├── models/               # SQLAlchemy ORM models (16 models)
│   ├── routes/               # Flask blueprints (8 route modules)
│   └── services/             # Business logic and external API clients
├── tests/
│   ├── conftest.py           # Fixtures (in-memory SQLite, auth bypass)
│   ├── test_ehf_parser.py
│   ├── test_nobb_client.py
│   └── test_routes/
│       └── test_invoice.py
├── requirements.txt
└── ruff.toml
```

## Error Handling

All API errors use a consistent JSON shape via the `ApiError` exception class:

```json
{
  "error": "Human-readable message (Norwegian)",
  "code": "MACHINE_READABLE_CODE",
  "suggestion": "Optional guidance for the user"
}
```

Route handlers raise `ApiError(message, code=..., status=..., suggestion=...)` instead of manually building error responses. Error handlers registered on the Flask app catch `ApiError`, 404, 405, and 500 errors and return the standardized JSON format.

**File format validation:** The EHF and Abax parsers validate the XML root element before parsing. Non-EHF XML (missing UBL Invoice root) and non-Abax XML (missing DocumentElement root) raise `ValueError` with a descriptive message, which routes convert to `ApiError` with a suggestion.

## Request Lifecycle

Every request passes through this pipeline in order:

1. **`open_session`** — Creates a request-scoped SQLAlchemy session stored on `g.db`
2. **`run_authentication`** — Extracts Bearer token, verifies against Clerk JWKS, syncs user to local DB. Sets `g.current_user`, `g.current_user_id`, and `g.clerk_claims`. Public paths (`/health`) and CORS preflight (`OPTIONS`) skip verification.
3. **Route handler** — The matching blueprint handles business logic
4. **`close_session`** — Closes the DB session. Rolls back on error.

## API Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Returns `{"status": "ok"}` |

### Users (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Authenticated | Return current user profile with org membership |
| PATCH | `/users/<user_id>` | Self or system admin | Update user fields (`name`, `phone`; `is_system_admin` admin-only) |

### Organizations (`/organizations`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/organizations` | Authenticated | Create organization (creator becomes OWNER) |
| GET | `/organizations/<id>` | Any org role | Get organization details |
| PATCH | `/organizations/<id>` | OWNER, ADMIN | Update organization metadata |
| GET | `/organizations/<id>/members` | OWNER, ADMIN | List organization members |
| POST | `/organizations/<id>/members` | OWNER, ADMIN | Add or update member role (upsert) |
| DELETE | `/organizations/<id>/members/<user_id>` | OWNER, ADMIN | Remove member from organization |

**Organization types:** `COMPANY` or `CUSTOMER`

**Organization roles:** `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`

### Projects (`/projects`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects` | Authenticated | Create project (auto-linked to user's org, creator becomes OWNER) |
| GET | `/projects` | Authenticated | List all projects in user's organization |
| GET | `/projects/<id>` | Authenticated | Get single project (scoped to user's org) |

When creating a project, you can pass `customer_name` to auto-create a `CUSTOMER` type organization, or `customer_id` to link an existing one.

**Project statuses:** `ACTIVE`, `COMPLETED`, `ARCHIVED`

**Project roles:** `OWNER`, `EDITOR`, `VIEWER`

### Invoices (`/invoice`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/invoice/parse` | Authenticated | Parse and enrich an EHF invoice (preview, no project link) |
| POST | `/invoice/confirm` | Authenticated | Persist user-reviewed invoice line items to a project |
| POST | `/invoice/upload` | Authenticated | Parse, enrich, and persist invoice for a project (single-step) |
| GET | `/invoice/project/<project_id>` | Authenticated | List all materials for a project, grouped by source invoice |
| PATCH | `/invoice/materials/<material_id>` | Authenticated | Update a project material's CO₂ value manually |
| DELETE | `/invoice/source/<invoice_id>` | Authenticated | Delete invoice and all associated project materials |

**Two-phase invoice flow:**

**`/invoice/parse`** — Upload an EHF XML file as multipart form data (`file` field). Returns enriched line items with NOBB product data and CO₂ values. Uses the material catalog as a cache. Items missing EPD/GWP data are flagged for manual review.

**`/invoice/confirm`** — Accepts a JSON body with `project_id`, `invoice` (the full enriched data from parse), and optional `overrides` mapping line index to `{ total_co2_kg }`. Creates `MaterialInvoice`, upserts `Material` catalog entries, and creates `ProjectMaterial` records. Overridden items get `manual_override=True`, `confidence_score=90`, `flagged=False`.

**`/invoice/upload`** — Single-step alternative: parse, enrich, and persist in one call. Requires `project_id` as a form field. Creates:
- `MaterialInvoice` (source record)
- `Material` catalog entries (upserted)
- `ProjectMaterial` records linking materials to the project

**`PATCH /invoice/materials/<material_id>`** — Update a material's CO₂ value post-confirmation. Accepts `{ total_co2_kg }` (negative values allowed for biogenic carbon). Sets `manual_override=True`, `confidence_score=90`, `flagged=False`.

### NOBB Lookup (`/nobb`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/nobb/lookup?gtin=<gtin>` | Authenticated | Look up product by GTIN |
| GET | `/nobb/lookup?nobb_number=<id>` | Authenticated | Look up product by NOBB number |

Returns product info with EPD/GWP data if available. See [nobb-api.md](nobb-api.md) for details on the NOBB API response format.

**Error responses:**

| Status | When |
|--------|------|
| 400 | No query parameter provided |
| 404 | GTIN/NOBB number not found |
| 502 | NOBB API unreachable or error |

### Energy (`/energy`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/energy/calculate` | Authenticated | Calculate CO₂ from kWh input and persist |
| PATCH | `/energy/entry/<id>` | Authenticated | Update energy entry (recalculates CO₂ if kWh changes) |
| GET | `/energy/<project_id>` | Authenticated | List all energy entries for a project |
| DELETE | `/energy/entry/<id>` | Authenticated | Delete a single energy entry |
| GET | `/energy/zones` | Authenticated | List available Norwegian price zones with labels |

**CO₂ calculation:** `kWh × 0.0119` (NVE klimadeklarasjon 2024 national average: 11.9 g CO₂eq/kWh). Manual entries always get a confidence score of 100.

**Price zones** (NO1–NO5) are stored for future use when regional emission factors become available from NVE. Currently one national factor is used for all zones.

### Transport (`/transport`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transport/parse` | Authenticated | Parse Abax Turrapport XML (preview only, no persistence) |
| POST | `/transport/confirm` | Authenticated | Persist confirmed trips to a project |
| GET | `/transport/project/<project_id>` | Authenticated | List all trips for a project, grouped by source report |
| DELETE | `/transport/report/<report_id>` | Authenticated | Delete report and all associated trips |
| DELETE | `/transport/trips/<trip_id>` | Authenticated | Delete a single trip |
| PATCH | `/transport/vehicles/<vehicle_id>` | Authenticated | Update vehicle details (make, model, fuel_type) |

**Two-phase transport flow:**

**`/transport/parse`** — Upload an Abax Turrapport XML as multipart form data (`file` field). Returns enriched trip data without persisting anything to the project. For each trip, the system:
1. Parses trip data (driver, addresses, distance, expenses)
2. Looks up/creates vehicle by registration number (vehicle catalog entries are persisted)
3. Fetches CO₂/km from Vegvesen API if not cached
4. Calculates `total_co2_kg = distance_km × co2_per_km`
5. Flags trips where vehicle emission data is missing (confidence 20)

**`/transport/confirm`** — Accepts a JSON body with `project_id`, `trips` (the full trip objects from parse), and `file_name`. Creates the `TransportReport` and `ProjectTransport` records. This separation allows users to review, remove, and edit trips before committing them to the database.

### Reports (`/report`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/report/project/<project_id>/co2-summary` | Authenticated | Aggregated CO₂ summary across all four categories |

Returns per-category totals (`materials`, `transport`, `energy`, `waste`) with entry counts, average confidence scores, and an overall weighted confidence score.

## Services

### EHF Parser (`ehf_parser.py`)

Stateless parser for EHF (Elektronisk Handelsformat) invoices following UBL 2.0 / PEPPOL BIS standard.

**Extracts:**
- Invoice metadata (number, date, currency)
- Supplier and buyer party info (name, org number, address)
- Line items with GTIN (from `StandardItemIdentification`, supports both `schemeID="GTIN"` and BEAst Supply 4.0 `schemeID="0160"`) and NOBB number (from `AdditionalItemProperty`)

Items without a GTIN or NOBB number are flagged for manual review. Items with a NOBB match but no EPD/GWP data are also flagged.

### Invoice Enrichment (`invoice_enrichment.py`)

Takes parsed EHF data and enriches each line item:
1. Checks the `materials` catalog table first (avoids redundant API calls)
2. Falls back to NOBB API for cache misses
3. Adds `enriched` (bool), `flagged` (bool), and `nobb_data` (dict) to each item. Items are flagged if they lack GWP data (not just missing identifiers).

### Material Service (`material_service.py`)

Orchestrates the full invoice processing pipeline:
1. Parse EHF XML
2. Enrich via catalog/NOBB
3. Create `MaterialInvoice` source record
4. Upsert `Material` catalog entries
5. Create `ProjectMaterial` records with CO₂ calculations

**CO₂ calculation:** `GWP per unit (from EPD A1-A3 stage) × quantity`

**Confidence scoring:**
| Scenario | Score |
|----------|-------|
| EPD data available, CO₂ calculated | 80 |
| Manual CO₂ override by user | 90 |
| No EPD but item identified | 50 |
| Item flagged (no GTIN/NOBB or no EPD) | 20 |

### Transport Parser (`transport_parser.py`)

Stateless parser for Abax Turrapport (driving log) XML exports. Handles encoded XML tag names (e.g. `_x0020_` for space). Extracts:
- Driver name, department
- Vehicle registration number
- Start/end addresses
- Distance (km), duration (minutes)
- Expenses (toll, ferry, parking)

### Transport Service (`transport_service.py`)

Provides two functions for the two-phase transport flow:

- **`preview_transport_report(session, xml_content)`** — Parses XML, looks up vehicles, calculates CO₂, and returns enriched trip data. Only vehicle catalog entries are persisted; no project data is written.
- **`save_transport_report(session, project_id, trips, file_name)`** — Creates `TransportReport` and `ProjectTransport` records from confirmed trip data.

### Vehicle Lookup (`vehicle_lookup.py`)

Checks the `vehicles` catalog table first. On cache miss, calls the Vegvesen API. Falls back to a stub record if the API fails. Stub records are re-enriched on subsequent lookups.

### Vegvesen Client (`vegvesen_client.py`)

Calls the Statens vegvesen Enkeltoppslag API to fetch vehicle data by registration number. Extracts:
- Vehicle type, make, model, fuel type
- CO₂ per km (prefers WLTP, falls back to NEDC)

Returns CO₂ as kg/km (API provides g/km, client converts).

### NOBB Client (`nobb_client.py`)

Calls the NOBB Export API to look up construction materials. Flow:
1. Search by GTIN or NOBB number
2. Fetch full item details
3. Extract EPD/GWP data from item properties

**EPD GWP parsing** handles two formats:
- Detailed: separate Total/Fossil/Biogenic values per lifecycle stage
- Simple: single combined value per stage

Lifecycle stages extracted: `A1-A3`, `A4`, `A5`, `C1-C4`, `D`

### User Sync (`user_sync.py`)

Syncs Clerk identity to local `User` model on every authenticated request. Handles:
- Creating new users from Clerk claims
- Linking legacy users by email
- Keeping email/clerk_id in sync

## Database Models

### Identity & Access

| Model | Table | Key Fields |
|-------|-------|------------|
| `User` | `users` | `clerk_id`, `email`, `name`, `phone`, `is_system_admin` |
| `Organization` | `organizations` | `name`, `org_number`, `org_type` (COMPANY/CUSTOMER) |
| `OrganizationMember` | `organization_members` | `user_id`, `organization_id`, `role` (OWNER/ADMIN/MEMBER/VIEWER) |
| `ProjectMember` | `project_members` | `user_id`, `project_id`, `role` (OWNER/EDITOR/VIEWER) |

### Projects

| Model | Table | Key Fields |
|-------|-------|------------|
| `Project` | `projects` | `name`, `organization_id`, `created_by_user_id`, `customer_id`, `status` |

Project creators are automatically added as `OWNER` via an `after_insert` SQLAlchemy event.

### Shared Catalogs (caches)

These are not owned by any project — they cache data from external APIs:

| Model | Table | Source | Key Fields |
|-------|-------|--------|------------|
| `Material` | `materials` | NOBB API | `gtin`, `nobb_number`, `gwp_per_unit`, `has_epd`, `epd_id` |
| `Vehicle` | `vehicles` | Vegvesen API | `registration_number`, `make`, `model`, `fuel_type`, `co2_per_km` |

### Source Records (upload metadata)

These store metadata about uploaded files, not linked to projects directly:

| Model | Table | Key Fields |
|-------|-------|------------|
| `MaterialInvoice` | `material_invoices` | `supplier_name`, `invoice_number`, `invoice_date` |
| `TransportReport` | `transport_reports` | `file_name`, `report_period_start/end` |
| `WasteInvoice` | `waste_invoices` | `file_path` |

### Project Data (per-project records)

These link projects to catalogs and source records:

| Model | Table | Key Fields |
|-------|-------|------------|
| `ProjectMaterial` | `project_materials` | `project_id`, `material_id`, `source_id`, `quantity`, `total_co2_kg`, `confidence_score`, `flagged` |
| `ProjectTransport` | `project_transports` | `project_id`, `vehicle_id`, `source_id`, `distance_km`, `total_co2_kg`, `confidence_score`, `flagged` |
| `ProjectWasteItem` | `project_waste_items` | `project_id`, `source_id`, `waste_type`, `quantity_tons`, `total_co2_kg` |
| `Energy` | `energies` | `project_id`, `kwh_used`, `price_zone`, `grid_emission_factor`, `total_co2_kg` |
| `GeneratedInvoice` | `generated_invoices` | `project_id`, `format_type`, per-category CO₂ totals, `overall_confidence_score` |

### Legacy Model

| Model | Table | Note |
|-------|-------|------|
| `Transport` | `transports` | Older transport model with `project_id` FK. Superseded by `ProjectTransport` + `Vehicle` pattern but still in the schema. |

## Database Migrations

Migrations are managed with Alembic. The `env.py` reads `DATABASE_URL` from the `.env` file.

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "description of change"

# Check current migration state
alembic current

# Rollback one migration
alembic downgrade -1
```

## Linting

Ruff handles both linting and formatting:

```bash
ruff check backend/       # lint
ruff format backend/      # format
```

Config in `ruff.toml`: line length 88, Python 3.12, double quotes. `F821` is ignored for SQLAlchemy string forward references. Alembic migration files are excluded.

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | **Backend** | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)
