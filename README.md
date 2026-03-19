# Byggspor

Construction CO₂ footprint calculator. Upload invoices, look up materials via NOBB, calculate emissions, and generate enriched EHF invoices with CO₂ data.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Python + Flask
- **Database:** PostgreSQL

## Getting Started

### *PNPM used for all commands*

### Prerequisites

- Node.js 22+
- pnpm 10+
- Python 3.12+
- Docker (Docker Desktop for Windows/macOS, Docker Engine for Linux)
- pipx (for installing pre-commit)

**Install pnpm:**

```bash
npm install -g pnpm
```

**Install pipx (not strictly needed for macOS or Windows, pip can be used as well, but pipx isolates the install.):**

| OS | Command |
|---|---|
| Linux (Debian/Ubuntu) | `sudo apt install pipx` |
| macOS | `brew install pipx` |
| Windows | `pip install --user pipx` |

Then run `pipx ensurepath` and restart your terminal.

### Pre-commit Hooks (one-time setup)

```bash
pipx install pre-commit
pre-commit install
```

This enables automatic linting and formatting checks on every commit. Commits directly to `main` are blocked.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open <http://localhost:5173> — you should see a centered page with "Byggspor" as a heading and "Construction CO₂ footprint calculator" below it.

### Database

```bash
cp .env.example .env           # uses default local credentials
docker compose up -d           # starts PostgreSQL on port 5432
```

Verify it's running:
Cant find docs/testing.md.
Cant see any changes to github workflow ci.yml file either..
Is "pnpm test" command added somewhere else?
Is "pytest" command added somewhere else?

When testing, both commands worked locally, but cant see them in the ci.yml file.
```bash
docker compose ps              # should show byggspor-db-1 as "running"
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Linux/macOS
# venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head           # creates all database tables
flask --app app.main run --debug
```

Open <http://localhost:5000/health> — you should see:

```json
{"status": "ok"}
```

### Clerk Auth (local setup)

This project uses Clerk for authentication.

1. Ask a teammate/project admin for shared Clerk dev values.
2. Copy `.env.example` to `.env` and set:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_ISSUER`
   - `CLERK_JWT_AUDIENCE` (optional)
   - `CLERK_JWKS_URL` (optional)
3. Start frontend and backend as usual.

Sign-in routes:

- `http://localhost:5173/sign-in`
- `http://localhost:5173/sign-up`

### Verify Frontend Build

```bash
cd frontend
pnpm build
```

Should complete with no errors and output built files to `frontend/dist/`.

## CI/CD

GitHub Actions runs on every PR to `main`:

- **Frontend:** lint (ESLint) + format check (Prettier) + build (TypeScript + Vite)
- **Backend:** lint + format check (Ruff)

PRs must pass all checks before merging.
