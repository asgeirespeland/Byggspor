# features/

User actions. Each slice is one cohesive user-facing capability named by its
verb: `import-invoice/`, `create-project/`, `edit-profile/`, `invite-member/`.

**Belongs here:**
- Mutation hooks (everything that writes to the backend)
- UI components that represent the action (dialogs, forms, preview panels)
- Feature-internal helpers

**Does not belong here:**
- Read hooks — those are `entities/<entity>/hooks/`
- Pure display components — those are `entities/<entity>/ui/` or `shared/`
- Tab orchestrators that wire multiple features together — those are `widgets/`

**Naming convention:** verb-noun (`createUncaught SyntaxError: The requested module '/src/widgets/ResponsiveConfidenceGauge.tsx?t=1777031619969' does not provide an export named 'ResponsiveConfidenceGauge' (at ProjectCardDrawer.tsx:6:10)-project`, `edit-settings`, `log-waste`).
Avoid generic umbrellas like `settings/` or `projects/` — that recreates the
entity layer inside features.

**Exception — `edit-uploaded-data/`:** holds post-upload edit/delete mutations
for all four category verticals (materials/transport/waste/energy) because
they share structurally identical optimistic-delete logic, deduped via
`useGroupDelete`, `useItemDelete`, and `useOptimisticDelete`.

**Slice structure:**
- `index.ts` — public API
- `ui/` — components for the action
- `hooks/` — React Query mutations + orchestration
- `api/`, `model/`, `lib/` — only when needed; many single-hook features have
  only `hooks/`

**Import direction:** features may import from `entities` and `shared`. Never
from `widgets`, `pages`, `app`, or other features. If two features need the
same code, lift it to `entities` or `shared`.
