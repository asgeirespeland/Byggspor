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
| Styling | Tailwind CSS 4 |
| UI Primitives | shadcn/ui (Base UI + CVA) |
| Icons | Lucide React |
| Auth | Clerk React SDK |
| Server State | TanStack Query (React Query) |
| Routing | React Router 7 |
| Toasts | Sonner |
| Testing | Vitest + React Testing Library |
| Linting | ESLint |
| Formatting | Prettier |

## Project Structure

```
frontend/src/
├── app/                          # App shell
│   ├── App.tsx                   # Provider tree (Clerk, QueryClient, Router, Toaster)
│   └── routes.tsx                # All route definitions
│
├── components/ui/                # shadcn/ui primitives
│   ├── button.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── sheet.tsx
│   ├── sonner.tsx
│   ├── textarea.tsx
│   └── tooltip.tsx
│
├── features/                     # Feature modules (see below)
│   ├── auth/
│   ├── dashboard/
│   ├── energy/
│   ├── invoice/
│   ├── onboarding/
│   ├── organization/
│   ├── project/
│   ├── settings/
│   ├── transport/
│   └── user/
│
├── shared/                       # Cross-cutting concerns
│   ├── api/                      # API client and query config
│   ├── components/               # Reusable layout and form components
│   ├── context/                  # AppContext (current organization)
│   ├── hooks/                    # Shared hooks
│   └── types/                    # Shared TypeScript types
│
├── lib/                          # General utilities (cn helper)
├── test/                         # Test setup (Vitest + jsdom)
├── main.tsx                      # Entry point
└── index.css                     # Tailwind imports
```

## Provider Tree

The app wraps all routes in a nested provider stack defined in `App.tsx`:

```
ClerkProvider               → Authentication
  QueryClientProvider        → Server state (TanStack Query)
    TooltipProvider           → shadcn tooltip context
      BrowserRouter            → Client-side routing
        AppRoutes               → Route definitions
      Toaster                  → Toast notifications (bottom-right)
```

## Route Map

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/sign-in/*` | `AuthLayout` | Public | Clerk sign-in with branded split layout |
| `/sign-up/*` | `AuthLayout` | Public | Clerk sign-up |
| `/onboarding` | `OnboardingPage` | Protected | Organization creation (required before dashboard access) |
| `/` | `GlobalDashboard` | Protected | All projects overview with stat cards |
| `/projects/:projectId` | `ProjectDashboard` | Protected | Single project with tabbed data entry |
| `/profile` | `UserProfile` | Protected | User profile settings |
| `/organization` | `OrgSettings` | Protected | Organization member management |
| `/settings` | `SettingsPage` | Protected | App settings (placeholder) |
| `*` | — | — | Redirects to `/` |

Protected routes are wrapped in `ProtectedRoute`, which:
1. Waits for Clerk to initialize
2. Redirects unauthenticated users to `/sign-in`
3. Fetches `/users/me` to sync user and get `organization_id`
4. Fetches organization data and provides it via `AppContext`
5. Redirects users without an organization to `/onboarding`

## Feature Modules

Each feature encapsulates its own components, hooks, API calls, types, and tests. Features export their public API through an `index.ts` barrel file.

### auth

**Components:**
- `AuthLayout` — Split-screen layout with branding panel (left) and Clerk sign-in/sign-up form (right). Responsive: branding panel hidden on mobile.
- `ProtectedRoute` — Auth gate that syncs user profile and provides `AppContext`.

### dashboard

**Components:**
- `GlobalDashboard` — Organization-level overview showing stat cards (project count, transport, invoices, CO₂ estimate) and a searchable project list with create dialog.
- `ProjectDashboard` — Single project view with:
  - Breadcrumb navigation with project status badge
  - KPI row showing CO₂ totals per category (materials, transport, waste, energy) with icons
  - Tabbed content panel for data entry (Materials, Transport, Waste, Energy)
  - Project sidebar with details and confidence gauge
- `KpiCard` — Stat card displaying a label, value, unit, and icon with accent background.
- `ProjectCard` — Clickable project card showing name, status, customer, and project number.
- `ProjectSidebar` — Right-side panel showing project metadata and overall confidence score.
- `ConfidenceGauge` — Visual confidence indicator.
- `CreateProjectDialog` — Form dialog for creating new projects with name, project number, and customer.

**Hooks:**
- `useCo2Summary` — Fetches the CO₂ summary from `/report/project/:id/co2-summary`.

**Tabs:**
- `EnergyTab` — Renders the `EnergyInput` component.
- `TransportTab` — Renders the `TransportUpload` component.
- `WasteTab` — Placeholder ("Avfallsregistrering kommer snart").

### energy

**Components:**
- `EnergyInput` — Form for manual kWh entry with price zone and date selection. Displays a scrollable table of existing entries with inline editing (edit, delete). Shows summary cards for total kWh and total CO₂.

**Hooks:**
- `useEnergies` — Fetches energy entries for a project.
- `usePriceZones` — Fetches available Norwegian price zones.
- `useCalculateEnergy` — Mutation to create a new energy entry.
- `useUpdateEnergy` — Mutation to update an existing entry (recalculates CO₂).
- `useDeleteEnergy` — Mutation to delete an entry.

**Types:**
- `EnergyEntry`, `EnergyUpdateInput`, `PriceZone`

### invoice

**Components:**
- `InvoiceUpload` — File drop zone for EHF XML upload. After upload, displays uploaded invoices grouped by source with material line items.
- `InvoiceGroupCard` — Collapsible card showing an invoice's supplier, date, and material line items with CO₂ data.
- `InvoiceTable` — Table displaying material line items with product name, GTIN, quantity, price, CO₂, and EPD badge.
- `InvoiceTotalCo2` — Summary bar showing total CO₂ for an invoice group.
- `EpdBadge` — Badge indicating EPD status (has EPD / no EPD / flagged).
- `Co2Value` — Formatted CO₂ value display with unit.

**Hooks:**
- `useInvoiceParse` — Parses an uploaded EHF file (preview, no persistence).
- `useProjectMaterials` — Fetches all materials for a project grouped by invoice.
- `useUploadInvoice` — Mutation to upload and persist an invoice for a project.
- `useDeleteInvoice` — Mutation to delete an invoice and its materials.

**Types:**
- `ParsedInvoice`, `InvoiceLineItem`, `NobbData`, `EpdData`

### transport

**Components:**
- `TransportUpload` — File drop zone for Abax XML upload plus manual trip entry toggle. After parsing, shows trip table with confirm/remove actions. Below, displays previously uploaded reports.
- `TransportTripTable` — Table of parsed trips with vehicle info, distance, CO₂, and confidence. Supports per-trip removal and bulk confirm.
- `TransportManualInput` — Manual trip entry form.
- `ReportGroupCard` — Collapsible card for an uploaded transport report with its trips.
- `TransportTotalCo2` — Summary bar for transport CO₂.
- `Co2Badge` — CO₂ value badge with confidence coloring.
- `VehicleInfoModal` — Modal showing vehicle details with edit capability.

**Hooks:**
- `useTransportParse` — Parses an Abax file and persists trips.
- `useProjectTransports` — Fetches all transport trips for a project grouped by report.
- `useDeleteTransportReport` — Mutation to delete a report and its trips.

**Types:**
- `TransportParseResult`, `TransportTrip`, `VehicleInfo`

### onboarding

**Components:**
- `OnboardingPage` — Organization creation form (name, org number). Required on first login before accessing the dashboard. Creates a `COMPANY` type organization and assigns the user as `OWNER`.

### organization

**Components:**
- `OrgSettings` — Organization member list with search and add dialog.
- `MemberCard` — Displays a member's name, email, and role.
- `AddMemberDialog` — Dialog for adding members by user ID with role selection.

### project

**Hooks:**
- `useProjects` — Fetches all projects for the user's organization.
- `useProject` — Fetches a single project by ID.
- `useCreateProject` — Mutation to create a new project.

**Constants:**
- `STATUS_CONFIG` — Visual config for project statuses (active/completed/archived) including labels, colors, and dot styles.

### settings

**Components:**
- `SettingsPage` — Placeholder page ("Kommer snart").

### user

**Components:**
- `UserProfile` — User profile page.

## Shared Module

### API Client (`shared/api/client.ts`)

Two functions for communicating with the backend:

- **`apiRequest<T>(endpoint, options?)`** — Generic JSON request. Adds `Authorization: Bearer <token>` when provided. Parses JSON response and throws on non-OK status.
- **`postFile<T>(endpoint, file, token?)`** — Multipart file upload using `FormData`. Used for invoice and transport XML uploads.

Both use `VITE_API_URL` (defaults to `http://localhost:5000`) as the base URL.

### Query Client (`shared/api/queryClient.ts`)

TanStack Query configured with:
- **Stale time:** 30 seconds
- **Refetch on window focus:** disabled

### Shared Hooks

| Hook | Purpose |
|------|---------|
| `useAppContext` | Access current `organizationId` and `organization` from `AppContext` |
| `useRequireToken` | Get Clerk auth token with error throw on missing auth |
| `useDeferredLoading` | Prevents loading spinner flicker on fast responses using `useDeferredValue` |
| `useFileSelect` | File selection state with validation (accepts/rejects, error message, clear) |
| `useScrollIndicators` | Detects horizontal scroll overflow for tab bars (shows chevron indicators) |

### Shared Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Collapsible navigation sidebar with logo, nav links, and Clerk `UserButton`. Collapsed on mobile, expands on hover. |
| `FileDropZone` | Drag-and-drop file upload area with visual feedback |
| `SelectedFileBar` | Displays selected file name with upload/clear actions and loading state |
| `ItemListPanel` | Generic searchable list with add button and empty state. Used for projects and org members. |
| `CollapsibleGroupCard` | Expandable card for grouped data (invoices, transport reports) |
| `FormDialog` | Generic dialog wrapper for forms |

### Shared Types

```typescript
UserDto        { id, clerk_id, email, name, phone, is_system_admin }
OrgDto         { id, name, org_type, org_number }
OrgMemberDto   { id, user_id, role, user: { name, email } }
```

## UI and Styling

### Tailwind CSS 4

Utility-first CSS framework. Imports are in `index.css`. No custom Tailwind config file — uses CSS-based configuration (Tailwind 4 default).

### shadcn/ui

Pre-built accessible UI primitives based on Base UI and styled with CVA (Class Variance Authority). Components are installed directly into `components/ui/` and can be customized. Current primitives: Button, Checkbox, Dialog, Input, Label, Sheet, Textarea, Tooltip, Sonner (toasts).

### Design Patterns

- **Accent colors:** Violet for branding/active states, category-specific colors for KPI cards (blue=materials, orange=transport, red=waste, yellow=energy, emerald=totals)
- **Layout:** Sidebar navigation (left) + main content area. Project dashboard has a right sidebar for metadata.
- **Norwegian UI text:** All user-facing text is in Norwegian (Bokmål). Error messages, labels, placeholders, and status text are all Norwegian.
- **Responsive:** Sidebar collapses to icon-only on mobile and expands on hover. Auth layout hides branding panel on mobile. KPI grid adjusts columns for screen size.

## Path Aliases

The `@/` path alias resolves to `frontend/src/`, configured in both:
- `tsconfig.json` (TypeScript: `"@/*": ["./src/*"]`)
- `vite.config.ts` (Vite: `resolve.alias`)

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | **Frontend** | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)
