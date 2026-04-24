# app/

Cross-cutting application setup. Lowest-effort layer to reason about: just
wiring that every other layer depends on.

**Belongs here:**
- Router setup and route tree
- Global providers (React Query, Clerk, theme, app context)
- Top-level error boundaries
- Global styles imported once at the root

**Does not belong here:**
- Anything with domain knowledge
- Route target components themselves (those are `pages/`)

**Import direction:** `app` sits at the top. It imports from every layer
below (`pages`, `widgets`, `features`, `entities`, `shared`). Nothing imports
from `app`.
