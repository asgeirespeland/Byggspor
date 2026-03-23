[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | **Development**

---

# Development

## Branching Strategy

The repository uses a **feature branch** workflow with `main` as the production branch.

### Branch Types

| Pattern | Purpose | Example |
|---------|---------|---------|
| `feature/<name>` | New features | `feature/energy-input`, `feature/transport-parsing` |
| `feat/<name>` | New features (alternate) | `feat/vercel-deploy` |
| `ui/<name>` | UI-focused changes | `ui/cohesion` |
| `<issue-number>-<description>` | Issue-linked branches | `15-user-and-organization-management-with-roles-mh3-sh2` |

There is no `development` or `staging` branch. This is a deliberate choice — with GitHub free-tier private repos, branch protection rules are not available. A `development` branch without protection creates a risk of accidentally branching off or merging into the wrong branch, leading to diverged histories and painful merges. Keeping `main` as the single target branch keeps the workflow simple and avoids this class of problems.

### Branch Protection (Pre-commit Workaround)

GitHub free-tier private repos do not support repository rules or branch protection. As a workaround, direct commits to `main` and `development` are blocked locally via a pre-commit hook:

```yaml
- id: no-commit-to-branch
  args: [--branch, main, --branch, development]
```

This only works if developers have pre-commit installed. It does not prevent force-pushes or merges outside of the PR workflow. Ideally these would be repository rules, but that requires a paid GitHub plan.

## Pull Request Workflow

The team follows these conventions (within the constraints of a GitHub free-tier private repo):

1. **Create a feature branch** from `main`
2. **Push and open a PR** against `main`
3. **One team member must approve** before merging
4. **CI must pass** — GitHub Actions runs lint, format check, tests, and build for both frontend and backend
5. **Author merges their own PR** after approval and CI pass

PRs are merged (not squashed or rebased) — the git history shows merge commits on `main`:

```
f712df8 Merge pull request #43 from Naerverk/feature/energy-input
a7bbc40 Merge pull request #42 from Naerverk/feat/vercel-deploy
158b16e Merge pull request #41 from Naerverk/feature/tanstack-query-caching
```

## Commit Messages

The team is not strict on commit message format but aims to prefix messages with a **category** (`feat`, `fix`, `refactor`, `chore`, `ui`, `doc`, etc.) to make the history scannable. Beyond the prefix, messages should be descriptive of the changes.

Some commits use full conventional commit style with scope (`feat(frontend): ...`), others use just the prefix. Both are acceptable. Examples from the history:

**Good — category prefix + descriptive:**

```
feat(frontend): add toast notifications and deferred loading states (#21)
feat(backend): add CO₂ summary endpoint and missing transport routes (#19)
fix: correct price_zone type in EnergyRow onUpdate callback
```

**Not great — missing category prefix, vague:**

```
Redesigned the material Invoice
Added first backendtests, setup test folder in backend
```

These should have been something like `ui: redesign material invoice` or `test: add first backend tests and test folder setup`.

Backend and frontend changes should be committed separately when possible.

## Code Quality Tools

### Backend (Python)

**Ruff** handles both linting and formatting. Config in `ruff.toml`:

| Setting | Value |
|---------|-------|
| Line length | 88 |
| Target | Python 3.12 |
| Quote style | Double quotes |
| Rules | `E` (pycodestyle), `F` (pyflakes), `I` (isort), `W` (warnings) |
| Ignored | `F821` (undefined names — needed for SQLAlchemy string forward references) |
| Excluded | `alembic/versions/` |

```bash
cd backend
ruff check .         # Lint
ruff check --fix .   # Lint with auto-fix
ruff format .        # Format
ruff format --check . # Check formatting without modifying
```

### Frontend (TypeScript)

**ESLint** for linting, **Prettier** for formatting.

**ESLint** (`eslint.config.js`):
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` (Vite)
- Targets: `**/*.{ts,tsx}`
- Ignores: `dist/`

**Prettier** (`.prettierrc`):

| Setting | Value |
|---------|-------|
| Semicolons | No |
| Quotes | Single |
| Trailing commas | All |
| Tab width | 2 |
| Print width | 80 |

```bash
cd frontend
pnpm lint                # ESLint
pnpm format              # Prettier (write)
pnpm format:check        # Prettier (check only)
```

## Pre-commit Hooks

Pre-commit hooks enforce code quality on every `git commit`. Install with:

```bash
pipx install pre-commit
pre-commit install
```

### Hook Pipeline

| Order | Hook | Scope | Action |
|-------|------|-------|--------|
| 1 | `trailing-whitespace` | All files | Removes trailing whitespace |
| 2 | `end-of-file-fixer` | All files | Ensures files end with a newline |
| 3 | `check-added-large-files` | All files | Blocks accidentally committed large files |
| 4 | `no-commit-to-branch` | Git | Blocks commits to `main` and `development` |
| 5 | `ruff` | `backend/` | Python linting with auto-fix |
| 6 | `ruff-format` | `backend/` | Python formatting |
| 7 | `frontend-lint` | `frontend/src/**/*.{ts,tsx}` | ESLint |
| 8 | `frontend-prettier` | `frontend/src/**/*.{ts,tsx,css,json}` | Prettier formatting with auto-fix |

If a hook fails, the commit is blocked. Hooks 5, 6, and 8 auto-fix issues — stage the fixes (`git add`) and commit again.

To run all hooks manually:

```bash
pre-commit run --all-files
```

## CI Pipeline

GitHub Actions runs on every pull request to `main` and `development`. Both jobs must pass before a PR can be merged.

### Frontend Job

```
1. Checkout code
2. Install pnpm 10 + Node.js 22 (with lockfile cache)
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

### Free-Tier Limitations

The repository is a private repo on GitHub's free tier. The main limitation is that **all repository rules are unavailable**:

- **No required status checks** — CI pass is enforced by team convention, not branch protection rules
- **No required reviewers** — The one-approval requirement is enforced by team agreement
- **No branch protection** — Handled via pre-commit hooks as a local workaround (see above)
- **No CODEOWNERS** — Review routing is informal

Many of the pre-commit hooks (lint, format, branch protection) would ideally be repository rules enforced server-side, but the free tier does not support this. The hooks serve as a best-effort local substitute.

Actions minutes are sufficient for the current pipeline, and E2E tests are planned as a future addition.

## Project Scripts

### Root (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `docker compose up -d && concurrently ...` | Start everything (DB + backend + frontend) |
| `pnpm dev:backend` | `flask --app app.main run --reload` | Start backend only |
| `pnpm dev:frontend` | `cd frontend && pnpm dev` | Start frontend only |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `vite` | Dev server on port 5173 |
| `pnpm build` | `tsc -b && vite build` | Type-check and build |
| `pnpm lint` | `eslint .` | Run ESLint |
| `pnpm format` | `prettier --write ...` | Format all source files |
| `pnpm format:check` | `prettier --check ...` | Check formatting |
| `pnpm test` | `vitest run` | Run tests once |
| `pnpm test:watch` | `vitest watch` | Run tests in watch mode |
| `pnpm preview` | `vite preview` | Preview production build |

### Backend

No `package.json` — Python commands run directly:

| Command | Description |
|---------|-------------|
| `flask --app app.main run --debug` | Dev server on port 5000 |
| `pytest` | Run test suite |
| `pytest -v` | Verbose test output |
| `ruff check .` | Lint |
| `ruff format .` | Format |
| `alembic upgrade head` | Apply migrations |
| `alembic revision --autogenerate -m "desc"` | Generate migration |

## Adding New Features

### Backend

1. **Model** — Add/modify SQLAlchemy model in `backend/app/models/`. Update `__init__.py` if adding a new model.
2. **Migration** — Run `alembic revision --autogenerate -m "description"` and review the generated migration.
3. **Service** — Add business logic in `backend/app/services/`. Keep route handlers thin.
4. **Route** — Add a new blueprint in `backend/app/routes/` or extend an existing one. Register new blueprints in `main.py`.
5. **Tests** — Add tests in `backend/tests/`. Use the `client` fixture for route tests, direct function calls for service tests.

### Frontend

1. **Feature module** — Create a new directory under `frontend/src/features/<name>/` with `components/`, `hooks/`, `types/`, and `index.ts`.
2. **API hooks** — Use TanStack Query (`useQuery`/`useMutation`) in feature hook files. Use `useRequireToken()` for auth.
3. **Route** — Add the route in `frontend/src/app/routes.tsx`. Wrap in `ProtectedRoute` if authenticated.
4. **UI components** — Use shadcn/ui primitives from `components/ui/`. Add new primitives with `pnpm dlx shadcn@latest add <component>`.
5. **Tests** — Co-locate tests in `__tests__/` directories within the feature module.

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | **Development**
