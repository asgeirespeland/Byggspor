# Backend

## Tech Stack

- **Framework**: Flask
- **Database**: PostgreSQL 16 (via Docker Compose)
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Linting/Formatting**: Ruff
- **Python**: 3.12+

## Setup

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with database `byggspor`.

### 2. Create a virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or: venv\Scripts\activate  # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Copy `.env.example` to `.env` in the project root and fill in the values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `NOBB_API_USERNAME` — NOBB Export API username
- `NOBB_API_PASSWORD` — NOBB Export API password

### 5. Run migrations

```bash
alembic upgrade head
```

### 6. Start the server

```bash
flask --app app.main run
```

The API runs on `http://localhost:5000`.

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py            # Alembic config (reads DATABASE_URL from .env)
├── alembic.ini
├── app/
│   ├── main.py           # Flask app, blueprint registration
│   ├── database.py       # SQLAlchemy engine and session setup
│   ├── models/           # SQLAlchemy ORM models
│   │   ├── energy.py
│   │   ├── generated_invoice.py
│   │   ├── material.py
│   │   ├── material_invoice.py
│   │   ├── organization.py
│   │   ├── project.py
│   │   ├── transport.py
│   │   ├── user.py
│   │   ├── waste_invoice.py
│   │   └── waste_item.py
│   ├── routes/           # Flask blueprints (API endpoints)
│   │   └── nobb.py
│   └── services/         # Business logic and external API clients
│       └── nobb_client.py
├── requirements.txt
└── ruff.toml
```

## Authentication (Clerk JWT)

The backend verifies Clerk JWTs on protected routes and syncs users to the local database on first authenticated request.

### Environment variables

Add these in `.env`:

- `CLERK_ISSUER` (required)
- `CLERK_JWT_AUDIENCE` (optional)
- `CLERK_JWKS_URL` (optional)
If `CLERK_JWKS_URL` is not set, backend uses `<CLERK_ISSUER>/.well-known/jwks.json`

### Behavior

- `/health` is public.
- Other routes require `Authorization: Bearer <token>`.
- Invalid or expired token returns 401.
- Valid token sets request user context (`g.current_user_id`).
- First login creates/updates local user using Clerk claims (`sub`, email, name).

### Local testing

1. Start backend: ```flask --app app.main run```.
2. From frontend, sign in via Clerk.
3. Call `/users/me` from the app (`Hent profil`).
4. Verify:

- Request succeeds with valid token.
- Request fails with `401` without token.
- Local `users` row is created/updated on first login.

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{"status": "ok"}` |

### NOBB Lookup

| Method | Path | Description |
|--------|------|-------------|
| GET | `/nobb/lookup?gtin=<gtin>` | Look up a product by GTIN |
| GET | `/nobb/lookup?nobb_number=<id>` | Look up a product by NOBB number |

Returns product info with EPD/GWP data if available. See [docs/nobb-api.md](nobb-api.md) for details on the NOBB API and EPD data structure.

**Example:**

```bash
curl http://localhost:5000/nobb/lookup?gtin=7038840000020
```

**Response:**

```json
{
  "nobb_number": 20004859,
  "name": "ARBOR SPONPL GULV 2420 STD",
  "product_group": "Sponplater Ubehandlet",
  "has_epd": true,
  "epd": {
    "epd_number": "NEPD-4131-3358",
    "declared_unit": "1 m3",
    "price_unit_factor": 0.022,
    "gwp_stages": {
      "a1_a3": { "total": -10.626, "fossil": 3.762, "biogenic": -14.388 },
      "...": "..."
    }
  }
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Provide 'gtin' or 'nobb_number' query parameter"}` | No query param given |
| 404 | `{"error": "No item found"}` | GTIN/NOBB not in database |
| 502 | `{"error": "NOBB API error: ..."}` | NOBB API unreachable or error |

## Services

### nobb_client.py

NOBB Export API client with automatic retry (3 retries with backoff on 429/5xx).

**Functions:**

- `lookup(gtin=None, nobb_number=None)` — Full lookup: search + fetch details + extract EPD. Returns a structured dict or `None`.
- `search_by_gtin(gtin)` — Search NOBB by GTIN string. Returns list of matches.
- `search_by_nobb(nobb_number)` — Search NOBB by NOBB number (int). Returns list of matches.
- `get_item_details(nobb_number)` — Fetch full item with properties, suppliers, EPD. Returns dict or `None`.
- `extract_epd(item)` — Extract structured EPD/GWP data from a full item response. Returns dict or `None`.

## Database Models

10 models matching the ER diagram:

| Model | Table | Description |
|-------|-------|-------------|
| Organization | `organizations` | Companies and customers |
| User | `users` | Users belonging to an organization |
| Project | `projects` | Construction projects (active/completed/archived) |
| MaterialInvoice | `material_invoices` | Uploaded material invoices |
| Material | `materials` | Individual materials from invoices, with GTIN/NOBB/GWP |
| Transport | `transports` | Transport entries (file or manual) |
| WasteInvoice | `waste_invoices` | Waste reports |
| WasteItem | `waste_items` | Line items from waste invoices |
| Energy | `energies` | Energy consumption entries |
| GeneratedInvoice | `generated_invoices` | Generated CO2 reports |

## Demo Script

There is an interactive demo script for testing NOBB lookups:

```bash
python scripts/nobb_lookup.py
```

Requires `.env` with NOBB credentials. Lets you search by GTIN or NOBB number and view basic info, EPD data, or full JSON.

## Linting

```bash
ruff check backend/
ruff format backend/
```

Config is in `backend/ruff.toml` — line length 88, Python 3.12, double quotes.
