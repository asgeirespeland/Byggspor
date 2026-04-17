[Home](../README.md) | **Setup Guide** | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)

---

# Setup Guide

This guide walks you through getting Byggspor running locally from a fresh clone.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 22+ | `node -v` |
| pnpm | 10+ | `pnpm -v` |
| Python | 3.12+ | `python3 --version` |
| Docker | Any recent | `docker --version` |
| pipx | Any | `pipx --version` |

### Installing pnpm

```bash
npm install -g pnpm
```

### Installing pipx

| OS | Command |
|---|---|
| Linux (Debian/Ubuntu) | `sudo apt install pipx` |
| macOS | `brew install pipx` |
| Windows | `pip install --user pipx` |

After installing, run `pipx ensurepath` and restart your terminal.

## 1. Clone the Repository

```bash
git clone <repo-url>
cd byggspor
```

## 2. Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

The `.env` file is read by both the backend (via `python-dotenv`) and the frontend (Vite reads `VITE_`-prefixed vars automatically).

### Variable Reference

#### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/byggspor` | PostgreSQL connection string |

The default value matches the Docker Compose config, so you only need to change this if you're using a different database setup.

#### External APIs

| Variable | Required | Description |
|----------|----------|-------------|
| `NOBB_API_USERNAME` | Yes | NOBB Export API username (ask a teammate for shared credentials) |
| `NOBB_API_PASSWORD` | Yes | NOBB Export API password |
| `SVV_API_KEY` | Yes | Statens vegvesen vehicle data API key |

These are needed for material lookups (NOBB) and vehicle emission lookups (Vegvesen). Without them, invoice parsing and transport enrichment will fail.

#### Clerk Authentication (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_ISSUER` | Yes | Clerk issuer URL (e.g. `https://suitable-dassie-90.clerk.accounts.dev/`) |
| `CLERK_JWT_AUDIENCE` | No | Expected JWT audience claim. Leave empty to skip audience verification |
| `CLERK_JWKS_URL` | No | Override JWKS endpoint. Defaults to `<CLERK_ISSUER>/.well-known/jwks.json` |

#### Clerk Authentication (Frontend)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for the React SDK |

#### Frontend API URL

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:5000` | Backend API base URL |

Only change this if your backend runs on a different host or port.

> **Note:** The `.env.example` file ships with the shared Clerk dev instance values pre-filled. Ask a teammate or project admin if you need fresh credentials for any of the external APIs.

## 3. Database

Start PostgreSQL and run migrations:

```bash
docker compose up -d db
docker compose run --rm migrate
```

`docker compose up -d db` starts the PostgreSQL container and waits until it passes a health check. `docker compose run --rm migrate` then applies all pending Alembic migrations and exits. **You never need to run `alembic upgrade head` manually.**

PostgreSQL details:
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `byggspor`
- **Port:** `5432`
- **Data:** Persisted in a Docker volume (`pgdata`)

### Useful Database Commands

```bash
docker compose down              # Stop containers
docker compose down -v           # Stop and wipe all data (fresh start)
docker compose run --rm migrate  # Apply any new migrations (run after git pull)
docker compose logs db           # View database logs
```

To connect directly with psql:

```bash
docker compose exec db psql -U postgres byggspor
```

## 4. Backend

### Create a virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Linux/macOS
# venv\Scripts\activate        # Windows
```

### Install dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, SQLAlchemy, Alembic, PyJWT, requests, and other dependencies.

### Start the server

```bash
flask --app app.main run --debug
```

The API runs on http://localhost:5000. The `--debug` flag enables auto-reload on code changes and detailed error pages.

### Verify

```bash
curl http://localhost:5000/health
# {"status":"ok"}
```

## 5. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The app runs on http://localhost:5173.

### Verify

Open http://localhost:5173 in your browser. You should see the Clerk sign-in page (or the dashboard if you're already authenticated).

## 6. Pre-commit Hooks

Pre-commit hooks run automatically on every `git commit` to enforce code quality:

```bash
pipx install pre-commit
pre-commit install
```

### What the hooks check

| Hook | Scope | Action |
|------|-------|--------|
| `trailing-whitespace` | All files | Removes trailing whitespace |
| `end-of-file-fixer` | All files | Ensures files end with a newline |
| `check-added-large-files` | All files | Blocks accidentally committed large files |
| `no-commit-to-branch` | Git | Blocks direct commits to `main` and `development` |
| `ruff` | `backend/` | Python linting with auto-fix |
| `ruff-format` | `backend/` | Python formatting |
| `frontend-lint` | `frontend/src/` | ESLint on `.ts`/`.tsx` files |
| `frontend-prettier` | `frontend/src/` | Prettier formatting on `.ts`, `.tsx`, `.css`, `.json` |

If a hook fails, the commit is blocked. Fix the issues (many are auto-fixed) and commit again.

## Full Startup Checklist

Once everything is set up, this is the daily workflow:

```bash
# 1. Start the database and apply any pending migrations
docker compose up -d db
docker compose run --rm migrate

# 2. Start the backend
cd backend
source venv/bin/activate
flask --app app.main run --debug

# 3. Start the frontend (in a separate terminal)
cd frontend
pnpm dev
```

Alternatively, run everything with a single command from the project root:

```bash
pnpm run dev
```

This starts PostgreSQL, waits for it to be healthy, runs migrations, then starts the backend and frontend concurrently. Backend output is shown in blue, frontend in green.

| Service | URL | What to expect |
|---------|-----|---------------|
| Frontend | http://localhost:5173 | Sign-in page or dashboard |
| Backend | http://localhost:5000/health | `{"status": "ok"}` |
| Database | `localhost:5432` | PostgreSQL accepting connections |

## Troubleshooting

### Database connection refused

Make sure Docker is running and the container is up:

```bash
docker compose ps
docker compose up -d    # restart if needed
```

### Migrations fail

- Ensure the database container is running: `docker compose up -d db`
- If the database is in a broken state, reset it completely: `docker compose down -v && docker compose up -d db && docker compose run --rm migrate`
- Rebuild the migrate image if dependencies changed: `docker compose build migrate`

### Backend returns 401 on all routes

- Verify `CLERK_ISSUER` is set correctly in `.env`
- Make sure you're signed in on the frontend (the Bearer token is sent automatically)
- `/health` is the only public route; all others require authentication

### Frontend shows blank page or Clerk error

- Check that `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`
- The frontend must be restarted after changing `VITE_` variables (`pnpm dev` again)

### Pre-commit hooks fail

- Run `pre-commit run --all-files` to see what fails
- Most formatting issues are auto-fixed. Just `git add` the changes and commit again
- If hooks aren't running at all, re-run `pre-commit install`

---

[Home](../README.md) | **Setup Guide** | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | [Deployment](deployment.md) | [Development](development.md)
