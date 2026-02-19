# Byggspor

Construction CO₂ footprint calculator. Upload invoices, look up materials via NOBB, calculate emissions, and generate enriched EHF invoices with CO₂ data.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Python + Flask
- **Database:** PostgreSQL

## Getting Started

### *PNPM used for all commands*

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
source venv/bin/activate
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
