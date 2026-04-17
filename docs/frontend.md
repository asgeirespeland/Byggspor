[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | **Frontend** | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)

---

# Frontend

The frontend is a React single-page application that provides the user interface for managing construction projects and their CO₂ emissions.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 4 (CSS-config) |
| UI Primitives | shadcn/ui (Base UI + CVA) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Auth | Clerk React SDK |
| Server State | TanStack Query (React Query) |
| Routing | React Router 7 |
| Toasts | Sonner |
| Testing | Vitest + React Testing Library |
| Linting | ESLint |
| Formatting | Prettier |

## Architecture: Feature-Sliced Design

The frontend follows [Feature-Sliced Design](https://feature-sliced.design/) (FSD). Modules are organized into horizontal **layers** that may only depend on layers below them, and vertical **slices** within each layer that own a single business concept.

**Layer dependency rule (top depends on bottom, never the reverse):**

```
app        → composition: providers, routes
pages      → route-level screens
widgets    → reusable UI clusters (data tables, file uploads, charts)
entities   → business domain slices (materials, transport, waste, energy, …)
shared     → generic code with no domain knowledge (api client, auth, utils)
```

`components/ui/` holds shadcn primitives installed verbatim; treated as vendor code.

## Project Structure

```
frontend/src/
├── app/                      # Provider tree + routes
│   ├── App.tsx               # Clerk + QueryClient + Router + Toaster
│   ├── routes.tsx            # Route definitions + AppShell layout
│   └── auth/                 # AuthLayout, ProtectedRoute
│
├── pages/                    # Route screens (one folder per page)
│   ├── global-dashboard/
│   ├── onboarding/
│   ├── organization/
│   ├── profile/
│   ├── project-dashboard/
│   └── settings/
│
├── widgets/                  # Cross-slice UI building blocks
│   ├── CategoryDonut, TopEmitters, ConfidenceGauge, Co2TotalBadge, …
│   ├── data-table/           # DataTable, InlineUndoBar, RowActions,
│   │                         # useOptimisticDelete, useInlineUndo, useInlineEdit
│   └── file-upload/          # FileUploadShell, ParsePreviewShell,
│                             # FileDropZone, SelectedFileBar, useFileSelect, useFileParse
│
├── entities/                 # Domain slices (see table below)
│   └── <slice>/
│       ├── api.ts            # HTTP calls
│       ├── hooks/            # React Query hooks, local state hooks
│       ├── ui/               # Components + columns.tsx (cell renderers)
│       ├── lib/              # Pure helpers + config (utils, constants, meta)
│       └── types.ts          # Shared types for the slice
│
├── shared/                   # Domain-free infrastructure
│   ├── api/                  # client, queryClient, queryKeys
│   ├── auth/                 # getToken, useAuthQuery, useAuthMutation,
│   │                         # useRequireToken, useUserSync
│   ├── categories/           # CATEGORY_THEME, CATEGORY_KEYS (icons + colors)
│   ├── components/           # TabBar, FormDialog, FullscreenDialog,
│   │                         # ErrorMessage, ItemListPanel, layout/Sidebar
│   ├── context/              # AppContext (current organization)
│   ├── hooks/                # useAppContext, useDeferredLoading,
│   │                         # useDismiss, useScrollIndicators
│   └── utils/                # collections (groupBy, sumBy)
│
├── components/ui/            # shadcn/ui primitives (vendor)
├── lib/utils.ts              # shadcn cn() helper
├── test/setup.ts             # Vitest setup
├── main.tsx                  # Entry point
└── index.css                 # Tailwind imports + design tokens
```

## Entity Slices

Each slice owns its own `api.ts`, `hooks/`, `ui/`, `lib/` (optional), and `types.ts`.

| Slice | Responsibility |
|-------|----------------|
| `materials` | EHF invoice parsing, product enrichment, invoice groups. Key UI: `InvoiceUpload`, `InvoicePreview`, `InvoiceGroupCard`, `EpdBadge`. |
| `transport` | Abax XML parsing, trip reports, manual trips. Key UI: `TransportUpload`, `TransportPreview`, `TransportGroupCard`, `TransportForm`. |
| `waste` | Waste report XML, manual waste. Key UI: `WasteUpload`, `WastePreview`, `WasteGroupCard`, `WasteForm`. |
| `energy` | Manual kWh entry, price zones. Key UI: `EnergyTab`, `EnergyForm`, `EnergySummary`. |
| `report` | CO₂ summary + detailed report. Key UI: `ReportView`, per-category `Section` components, `ReportGroupRow`, `MethodologySection`. Holds shared report utils (`lib/utils.tsx`, `lib/confidence.ts`). |
| `export` | EHF invoice generation. Key UI: `GenerateInvoiceDialog` + `InvoiceDetailsCard` / `CustomerCard` / `LineItemsTable` / `AttachmentsPanel`. |
| `settings` | Calculation settings at org + project level. Key UI: `CalculationSettingsPanel`, `OrgSettingsPanel`, `ProjectSettingsPanel`, `SettingRow`, `SourceBadge`. |
| `project` | Project CRUD (used by `pages/global-dashboard` + `pages/project-dashboard`). |
| `organization` | Organization + member fetch (used by `pages/organization`). |
| `user` | Current user fetch. |

**Slice-to-slice dependencies** are kept minimal. Two known exceptions:
- `energy/ui/columns.tsx` imports formatters from `report/lib/utils` (report-format helpers are shared in practice across category tabs).
- `widgets/data-table/useOptimisticDelete` imports the `Co2Summary` type from `entities/report` for typed cache updates.

## Layer Cheat Sheet

**When adding new code, place it by the *most specific* consumer:**

- One slice only → `entities/<slice>/`
- Consumed by many slices but domain-free → `shared/`
- Consumed by many slices with UI coupling → `widgets/`
- Route-specific → `pages/<page>/`
- Provider or router plumbing → `app/`

## Provider Tree

Defined in [app/App.tsx](../frontend/src/app/App.tsx):

```
ClerkProvider                   → Authentication
  QueryClientProvider           → Server state (TanStack Query)
    BrowserRouter               → Client-side routing
      TooltipProvider           → shadcn tooltip context
        AppRoutes               → Route tree
        Toaster                 → Toast notifications
```

## Route Map

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/sign-in/*` | `AuthLayout` | Public | Clerk sign-in |
| `/sign-up/*` | `AuthLayout` | Public | Clerk sign-up |
| `/onboarding` | `OnboardingPage` | Protected | Organization creation (required) |
| `/` | `GlobalDashboard` | Protected | All projects overview |
| `/projects/:projectId` | `ProjectDashboard` | Protected | Project detail with tabbed data entry |
| `/profile` | `UserProfile` | Protected | User profile |
| `/organization` | `OrgSettings` | Protected | Org member management |
| `/settings` | `SettingsPage` | Protected | Calculation settings (org + project) |
| `*` | — | — | Redirects to `/` |

Protected routes run through `ProtectedRoute` (waits for Clerk, syncs `/users/me`, loads the user's organization into `AppContext`, redirects to `/onboarding` if missing).

## Data Access

### API Client (`shared/api/client.ts`)

- `apiRequest<T>(endpoint, options?)` — JSON request with optional Bearer token. Parses JSON, throws `ApiError` on non-OK status.
- `postFile<T>(endpoint, file, token?)` — Multipart upload for XML files.

Base URL comes from `VITE_API_URL` (defaults to `http://localhost:5000`). `ApiError` carries `code` and `suggestion` fields matching the backend's error shape; rendered by `shared/components/ErrorMessage`.

### Query Keys (`shared/api/queryKeys.ts`)

Centralized key factory (`qk`). Slices import from here rather than spelling keys inline to keep cache invalidation consistent.

### Auth Helpers (`shared/auth/`)

| Helper | Purpose |
|--------|---------|
| `useAuthQuery` | `useQuery` with auto token injection |
| `useAuthMutation` | `useMutation` with auto token + query invalidation + toasts |
| `useRequireToken` | Imperative token getter that throws on missing auth |
| `getTokenOrThrow` | Pure helper shared by all of the above |
| `useUserSync` | Fetches `/users/me` + organization on first login |

### React Query Defaults

- Stale time: 30 seconds
- Refetch on window focus: disabled

## Widget Clusters

### `widgets/data-table/`

- `DataTable<T>` — generic table with optional per-column inline edit + per-row delete. Locks column widths on edit to prevent layout shift.
- `RowActions` — pencil/trash button pair shown on row hover.
- `InlineUndoBar` — inline "Angre" bar shown after optimistic delete.
- `useInlineUndo` — delayed-commit primitive (schedule/undo/flush).
- `useOptimisticDelete` — shared hook across every entity slice: snapshot list cache, apply caller-supplied patch, adjust CO₂ summary cache, fire real delete via `useInlineUndo`, roll back on undo or error.
- `useInlineEdit` — small controller for inline edit row state.
- `DataTabShell` — layout shell used by every data tab (`materials`, `transport`, `waste`). Takes upload slot + optional manual-entry form slot + heading + list.

### `widgets/file-upload/`

- `FileUploadShell<T>` — upload → analyze → preview shell. Composes `FileDropZone` + `SelectedFileBar` + `useFileSelect` + `useRequireToken`. Each entity's tab passes in its own `parse` + `reset` callbacks.
- `ParsePreviewShell<T>` — preview table used by invoice/transport/waste preview components. Supports inline edit, row delete, fullscreen expand, confirm/cancel.
- `useFileParse<T>` — generic parse-file state machine.

## UI and Styling

### Tailwind CSS 4

CSS-based configuration in `index.css` (no `tailwind.config.js`). Imports Tailwind + declares design tokens.

### Design Tokens

Domain and semantic colors are exposed as CSS variables and mapped to Tailwind utility classes like `bg-success`, `text-danger-strong`, `border-materials`. Never hardcode raw hex values. Category colors live in `shared/categories/` as `CATEGORY_THEME` (`materials` = blue, `transport` = orange, `waste` = red, `energy` = yellow, `total` = emerald).

### shadcn/ui

Installed primitives live in `components/ui/`: Badge, Button, Card, Chart, Checkbox, Collapsible, Dialog, Form, Input, Label, Select, Sheet, Sonner, Switch, Textarea, Tooltip. Treated as vendor code — customize via props and CVA variants, not by editing the primitive files.

### Forms

All forms use React Hook Form + Zod via shadcn's `Form` primitive. Validation schemas are colocated with the form component.

### Localization

All user-facing text is in Norwegian Bokmål. Error messages, labels, placeholders, and status text are all Norwegian.

## Path Aliases

`@/` resolves to `frontend/src/`, configured in both `tsconfig.json` and `vite.config.ts`.

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | **Frontend** | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)
