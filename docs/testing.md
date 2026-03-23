[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | **Testing** | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)

---

# Testing

## Overview

| Layer | Framework | Runner | Location |
|-------|-----------|--------|----------|
| Backend | pytest | `pytest` | `backend/tests/` |
| Frontend | Vitest + React Testing Library | `pnpm test` | Co-located `__tests__/` dirs in `frontend/src/` |
| CI | GitHub Actions | Automatic on PR | `.github/workflows/ci.yml` |

## Backend Tests

### Running

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt    # includes pytest
pytest                              # run all tests
pytest -v                           # verbose output
pytest tests/test_ehf_parser.py    # run a specific file
pytest -k "test_extracts_gtin"     # run tests matching a pattern
```

No PostgreSQL or external API credentials are needed — tests use an in-memory SQLite database and mock all external services.

### Test Infrastructure (`conftest.py`)

The shared fixtures provide a fully isolated test environment:

**Database fixtures:**
- `engine` (session-scoped) — Creates an in-memory SQLite engine and builds all tables from SQLAlchemy models. Shared across all tests for speed.
- `db_session` (per-test) — Wraps each test in a transaction that rolls back after the test. Every test starts with a clean database.

**Flask fixtures:**
- `app` — Flask app with two patches applied:
  - `authenticate_request` → returns `None` (auth bypassed, requests proceed as authenticated)
  - `SessionLocal` → returns the test `db_session` (routes use SQLite instead of PostgreSQL)
- `client` — Flask test client. Also patches `SessionLocal` in the invoice routes, which create their own sessions directly.

**Sample data fixtures:**
- `minimal_ehf_xml` — Valid EHF invoice with one line item containing a GTIN
- `ehf_xml_with_nobb` — EHF invoice with a NOBB number in `AdditionalItemProperty`
- `ehf_xml_no_identifiers` — EHF invoice with a line item that has no GTIN or NOBB number (flagged)
- `mock_nobb_item` — Detailed EPD format NOBB API response
- `mock_nobb_search_response` — NOBB search result

### Test Suites

#### EHF Parser (`test_ehf_parser.py`)

Unit tests for the stateless `parse_invoice()` function. No database or network calls.

| Test Class | What it tests |
|-----------|---------------|
| `TestInvoiceMetadata` | Invoice number, date, currency, supplier/buyer extraction |
| `TestLineItemGTIN` | GTIN extraction from standard (`schemeID="GTIN"`) and BEAst (`schemeID="0160"`) formats; unknown schemes |
| `TestLineItemNobb` | NOBB number extraction from `AdditionalItemProperty`; case-insensitive detection |
| `TestLineItemFlagging` | Items without GTIN or NOBB are flagged |
| `TestLineItemNumericFields` | Quantity, unit, line total, price per unit parsing |
| `TestParseErrors` | Malformed XML, empty string, bytes input acceptance |

#### NOBB Client (`test_nobb_client.py`)

Unit tests for the NOBB API client. All HTTP calls are mocked.

| Test Class | What it tests |
|-----------|---------------|
| `TestToFloat` | Helper function for numeric conversion |
| `TestGetSession` | Raises `RuntimeError` when credentials missing |
| `TestSearchByGtin` | Correct payload sent to search endpoint; HTTP error propagation |
| `TestSearchByNobb` | Correct payload sent with NOBB number |
| `TestGetItemDetails` | Returns first result or `None` for empty results |
| `TestExtractEpd` | Detailed EPD format (Total/Fossil/Biogenic), simple format (combined value), empty/missing EPD, absent stages |
| `TestLookup` | Full lookup flow (search → details → EPD); GTIN preferred over NOBB when both provided; `None` returns |

#### Invoice Routes (`test_routes/test_invoice.py`)

Integration tests for the `/invoice` HTTP endpoints using the Flask test client.

| Test Class | What it tests |
|-----------|---------------|
| `TestHealthCheck` | `/health` returns 200 with `{"status": "ok"}` |
| `TestParseInvoiceRoute` | Valid XML returns 200; missing file field returns 400; non-XML extension returns 400; empty file returns 400; malformed XML returns 422; response contains `line_items` key |

### Mocking Strategy

- **Database**: In-memory SQLite with transactional rollback (no PostgreSQL needed)
- **Auth**: `authenticate_request` patched to return `None` (all requests treated as authenticated)
- **NOBB API**: `_get_session` and individual functions patched with `unittest.mock`
- **Vegvesen API**: Not called in tests (vehicle lookup tests not yet implemented)

## Frontend Tests

### Running

```bash
cd frontend
pnpm install
pnpm test              # run once
pnpm test:watch        # watch mode (re-runs on file changes)
```

### Test Infrastructure

- **Vitest** as the test runner, configured in `vite.config.ts`
- **jsdom** as the browser environment
- **React Testing Library** for rendering hooks and components
- **`@testing-library/jest-dom`** for DOM matchers (`toBeInTheDocument`, etc.), wired up in `test/setup.ts`
- **`vi.mock()`** for mocking modules (Clerk, API client)

### Test Suites

#### Invoice Parse Hook (`features/invoice/__tests__/useInvoiceParse.test.ts`)

Tests the `useInvoiceParse` hook's async state management using `renderHook` from React Testing Library.

**Mocks:**
- `@clerk/react` — `useAuth`/`getToken` returns a mock token
- `@/shared/api/client` — `postFile` mocked to control responses

| Test Group | What it tests |
|-----------|---------------|
| Initial state | `data` is null, `loading` is false, `error` is null |
| `parse()` success | Calls `postFile` with correct endpoint/file; sets `data`; clears previous error; clears previous data while pending; `loading` false after success |
| Loading state | `loading` is true while request is in flight |
| Error handling | Sets error message from `Error` objects; fallback message for non-Error throws; `data` stays null on failure; `loading` false after error |
| `reset()` | Clears data, error, and loading |

#### Invoice Utils (`features/invoice/__tests__/utils.test.ts`)

Pure function tests for `getGwpA1A3()` — no React, no mocks.

| Test | What it tests |
|------|---------------|
| Null nobb_data | Returns null |
| Null EPD | Returns null |
| Empty gwp_stages | Returns null |
| Snake_case key (`a1_a3`) | Returns the total value |
| Fallback key (`A1-A3`) | Returns the total value (simple EPD format) |
| Null total | Returns null even when stage exists |

#### Transport Parse Hook (`features/transport/__tests__/useTransportParse.test.ts`)

Tests the `useTransportParse` hook. Same pattern as invoice parse tests.

**Mocks:**
- `@/features/transport/api/transport` — `parseTransportFile` mocked

| Test Group | What it tests |
|-----------|---------------|
| Initial state | `data` null, `loading` false, `error` null |
| `parse()` success | Calls API with file, projectId, token; sets data; loading false after |
| Loading state | `loading` true during request |
| Error handling | Error message from Error objects; Norwegian fallback message for non-Error |
| `reset()` | Clears all state |

#### Utils (`lib/__tests__/utils.test.ts`)

Tests for the `cn()` Tailwind class merging helper (clsx + tailwind-merge).

| Test | What it tests |
|------|---------------|
| Single class | Passed through unchanged |
| Multiple classes | Joined with spaces |
| Tailwind conflicts | Last value wins (e.g. `p-4`, `p-2` → `p-2`) |
| Conditional classes | Truthy included, falsy excluded |
| Null/undefined | Handled gracefully |
| Object syntax | clsx object syntax works |

## CI Pipeline

GitHub Actions runs on every pull request to `main` and `development`.

### Frontend Job

```
1. Checkout code
2. Install pnpm 10 + Node.js 22
3. pnpm install --frozen-lockfile
4. pnpm lint                    (ESLint)
5. pnpm exec prettier --check   (format check)
6. pnpm test                    (Vitest)
7. pnpm build                   (TypeScript + Vite build)
```

### Backend Job

```
1. Checkout code
2. Setup Python 3.12
3. pip install -r requirements.txt
4. pip install ruff pytest
5. ruff check .                 (lint)
6. ruff format --check .        (format check)
7. pytest                       (test suite)
```

Both jobs must pass before a PR can be merged.

## Test Coverage Gaps

As of the current state, notable areas without test coverage include:

- **Backend**: Organization, project, energy, transport, and report route handlers
- **Backend**: Transport parser, transport service, vehicle lookup, invoice enrichment, material service
- **Frontend**: Component rendering tests (all current tests are hook/utility-level)
- **Frontend**: Energy hooks and API calls
- **Integration**: No end-to-end tests covering the full frontend → backend flow

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | **Testing** | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)
