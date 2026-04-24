# widgets/

Reusable composed UI blocks. A widget combines primitives + feature hooks +
entity data into a self-contained chunk that drops into pages.

**Belongs here:**
- Tab orchestrators (`materials-tab/`, `transport-tab/`, etc.) that wire
  import features, edit mutations, and entity reads into one surface
- Domain-agnostic composed primitives (`data-table/`, `file-upload/`) — they
  compose smaller pieces into reusable shells
- Single-file display widgets at the root (`Co2TotalBadge.tsx`, `ConfidenceGauge.tsx`,
  `CategoryDonut.tsx`)

**Does not belong here:**
- Pure primitives without composition — those go in `shared/components/`
- Anything tied to a specific route — that's `pages/`
- Anything that represents a user action — that's a `feature`

**Slice structure** (folder-based widgets):
- `index.ts` — public API (re-exports the slice's main component + any hooks/types)
- Segments as needed: `ui/` may be flat at the slice root for simple widgets

**Import direction:** widgets may import from `features`, `entities`, `shared`.
Never from `pages` or `app`. Other widgets may import each other, but prefer
composition at the page level when possible.
