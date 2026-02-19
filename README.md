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
- pipx (for installing pre-commit)

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

Open http://localhost:5173 — you should see a centered page with "Byggspor" as a heading and "Construction CO₂ footprint calculator" below it.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Linux/macOS
# venv\Scripts\activate        # Windows
pip install -r requirements.txt
flask --app app.main run --debug
```

Open http://localhost:5000/health — you should see:

```json
{"status": "ok"}
```

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
