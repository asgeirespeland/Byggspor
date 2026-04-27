# pages/

Route targets. Each page composes widgets + features + entities into a full
screen. Pages are leaves — nothing in the codebase imports from a page.

**Belongs here:**
- One folder per route (e.g. `project-dashboard/`, `settings/`, `onboarding/`)
- Page-local components that only that page needs (breadcrumbs, KPI rows,
  sidebars tied to the page layout)

**Does not belong here:**
- Reusable compositions — those are `widgets/`
- Data fetching logic — use entity hooks
- User actions — use feature hooks/UI

**Import direction:** pages import from `widgets`, `features`, `entities`,
`shared`. Never from `app`. Other pages never import each other.
