# entities/

Domain data models. Each slice represents a noun in the domain: `project/`,
`materials/`, `transport/`, `waste/`, `energy/`, `report/`, `organization/`,
`user/`, `settings/`.

**Belongs here:**
- `api.ts` (or `api/`) — backend client functions for the domain
- `types.ts` — shared domain types
- `hooks/` — **read-only** React Query hooks (`useProject`, `useProjectMaterials`,
  `useCo2Summary`)
- `ui/` — pure display components with no side effects (`columns.tsx`,
  badges like `EpdBadge.tsx`, `SourceBadge.tsx`)
- `lib/` — pure helpers specific to the domain (`getGwpA1A3`, `STATUS_CONFIG`)

**Does not belong here:**
- Mutation hooks — those are `features/<feature>/hooks/`
- Components with mutation calls inline — those are either widget-level
  compositions or belong to a feature
- Cross-entity logic — if materials needs transport, the caller composes both

**Strict rule:** entities are **read-only**. If you find yourself writing a
`useAuthMutation` in an entity hook file, it belongs in a feature.

**Slice structure:**
- `index.ts` — public API
- Segments above as needed

**Import direction:** entities may import from `shared` only. Never from
other entities, features, widgets, pages, or app. If one entity needs another,
that's a sign the consumer (feature/widget/page) should compose both.
