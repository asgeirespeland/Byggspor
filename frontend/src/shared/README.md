# shared/

Infrastructure and primitives with no domain knowledge. Anything here should
be usable in a completely different project without modification.

**Belongs here:**
- `api/` — generic HTTP client, query-key helpers
- `auth/` — auth plumbing (useAuthQuery, useAuthMutation, token helpers)
- `components/` — domain-agnostic UI primitives (`FormDialog`, `TabBar`,
  `ItemListPanel`, `FullscreenDialog`, layout pieces)
- `hooks/` — generic hooks (`useDeferredLoading`, `useDismiss`, `useAppContext`)
- `utils/` — pure data utilities (`sumBy`, `collections`)
- `categories/` — the CO₂ category theme/colour/icon map (app-wide constant)
- `context/` — context providers without domain coupling
- `types/` — cross-slice type contracts (`tableColumn.ts`)

**Does not belong here:**
- Anything that mentions materials/transport/waste/energy/projects/etc. — that's
  a domain concern and belongs in `entities/` or a feature
- "Utility components that are sort of generic but we only use in one place" —
  keep those colocated with the consumer

**Health check:** if `shared/` starts accumulating vaguely-generic things
that other slices happen to share, push back. A growing `shared/` is the
main way FSD codebases lose their shape.

**Import direction:** shared may not import from any other layer. If it
needs to know something the domain knows, you're going in the wrong direction.
