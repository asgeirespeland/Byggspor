[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | **Deployment** | [Development](development.md)

---

# Deployment

## Overview

| Component | Hosting | URL |
|-----------|---------|-----|
| Frontend | Vercel | `https://byggspor.ksterud.dev` |
| Backend (API) | OCI VM (Ubuntu 24) | `https://api.byggspor.ksterud.dev` |
| Database | Docker on OCI VM | `localhost:5432` (not exposed) |
| DNS | Cloudflare | — |
| Auth | Clerk (hosted) | — |

```mermaid
graph LR
    subgraph Cloudflare["Cloudflare DNS"]
        CNAME["byggspor.ksterud.dev<br/>CNAME → Vercel"]
        A["api.byggspor.ksterud.dev<br/>A → OCI VM IP"]
    end

    subgraph Vercel["Vercel"]
        FE["Frontend SPA<br/>React + Vite build"]
    end

    subgraph OCI["OCI VM (Ubuntu 24)"]
        Caddy["Caddy reverse proxy<br/>ports 80/443<br/>auto TLS (Let's Encrypt)"]
        Flask["Gunicorn (gevent)<br/>port 5000"]
        PG["PostgreSQL 16<br/>Docker container<br/>port 5432"]
    end

    CNAME --> FE
    A --> Caddy
    Caddy --> Flask
    Flask --> PG
    FE -->|"REST API calls"| A
```

## Frontend (Vercel)

### How It Works

The frontend is deployed on [Vercel](https://vercel.com/) as a static SPA. Vercel auto-builds and deploys on push.

**Build process:**
1. Vercel detects the `frontend/` directory
2. Runs `pnpm install` and `pnpm build` (Vite produces static assets in `dist/`)
3. Serves the built files from Vercel's edge network

**SPA routing:** The `vercel.json` configuration rewrites all paths to `index.html`, so React Router handles client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### DNS

`byggspor.ksterud.dev` is a **CNAME** record in Cloudflare pointing to Vercel. Vercel handles TLS termination and provides an SSL certificate automatically.

### Environment Variables

Set in the Vercel project dashboard (not committed to the repo):

| Variable | Purpose |
|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend SDK key |
| `VITE_API_URL` | Backend API URL (`https://api.byggspor.ksterud.dev`) |

## Backend (OCI VM)

### Infrastructure

The backend runs on a personal Oracle Cloud Infrastructure (OCI) VM:

- **OS:** Ubuntu 24.04
- **Reverse proxy:** Caddy (automatic TLS via Let's Encrypt)
- **Services:** Gunicorn (Flask/gevent) + PostgreSQL (Docker)
- **Code:** Cloned directly from the repository — same codebase as development

### Current Setup

The backend runs behind **Gunicorn** (WSGI server) with gevent async workers, managed as a systemd service:

```ini
# /etc/systemd/system/byggspor.service
[Unit]
Description=Byggspor Flask Backend
After=network.target docker.service
Requires=docker.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/repos/byggspor/backend
EnvironmentFile=/home/ubuntu/repos/byggspor/.env
ExecStart=/home/ubuntu/repos/byggspor/backend/venv/bin/gunicorn --bind 0.0.0.0:5000 --worker-class gevent --workers 2 --timeout 120 app.main:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl status byggspor      # Check status
sudo systemctl restart byggspor     # Restart
sudo journalctl -u byggspor -f      # View logs
```

PostgreSQL runs via `docker-compose.yml`, bound to localhost only:

```bash
# On the VM
cd byggspor
docker compose up -d
```

### Reverse Proxy (Caddy)

[Caddy](https://caddyserver.com/) runs as a systemd service on the VM, configured via `/etc/caddy/Caddyfile`. It provides:
- **Automatic TLS** — Obtains and renews Let's Encrypt certificates for `api.byggspor.ksterud.dev` automatically via ACME
- **Reverse proxy** — Forwards HTTPS traffic on ports 80/443 to Gunicorn on `127.0.0.1:5000`
- **HTTP → HTTPS redirect** — Automatic

Caddy is managed via systemd:

```bash
sudo systemctl status caddy     # Check status
sudo systemctl restart caddy    # Restart after config changes
sudo journalctl -u caddy -f     # View logs
```

### DNS

`api.byggspor.ksterud.dev` is an **A** record in Cloudflare pointing to the OCI VM's public IP. Cloudflare proxy is **OFF** (DNS-only mode) — this is correct because Caddy handles TLS termination directly on the VM. Turning on Cloudflare proxy would cause a double-proxy setup and potentially interfere with Caddy's ACME certificate renewal.

### Environment Variables

Set in the `.env` file on the VM:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NOBB_API_USERNAME` | NOBB API credentials |
| `NOBB_API_PASSWORD` | NOBB API credentials |
| `SVV_API_KEY` | Vegvesen API key |
| `CLERK_ISSUER` | Clerk JWT issuer URL |
| `CLERK_JWT_AUDIENCE` | Clerk JWT audience (optional) |
| `CLERK_JWKS_URL` | Clerk JWKS endpoint override (optional) |

### Database Migrations

After pulling new code with model changes:

```bash
cd byggspor/backend
source venv/bin/activate
alembic upgrade head
```

## CI/CD Pipeline

GitHub Actions runs on every pull request to `main` and `development`. See [Testing](testing.md) for the full pipeline. Both frontend and backend jobs must pass before merging.

### Continuous Deployment

- **Frontend:** Vercel auto-deploys when changes are pushed/merged to `main`. No manual steps required.
- **Backend:** A systemd timer on the OCI VM polls for changes every 3 minutes. When new commits are detected on `main`, it automatically pulls, installs dependencies (if changed), runs database migrations, restarts the service, and verifies the health check.

The deploy script lives at `~/scripts/deploy-byggspor.sh` on the VM. Logs are tagged `byggspor-deploy` in the system journal:

```bash
journalctl -t byggspor-deploy        # View deploy history
journalctl -t byggspor-deploy -f     # Follow live
sudo systemctl status byggspor-deploy.timer   # Check timer status
sudo systemctl stop byggspor-deploy.timer     # Pause auto-deploy
```

### Manual Deploy

If needed, you can trigger a deploy manually:

```bash
ssh ubuntu@<vm-ip>
~/scripts/deploy-byggspor.sh
```

### Database

PostgreSQL runs as a Docker container, bound to `127.0.0.1` (not exposed externally). Data is persisted in a Docker volume (`pgdata`), so the container can be recreated without data loss:

```bash
docker compose up -d      # Start/restart
docker compose down        # Stop (data preserved)
docker compose down -v     # Stop and DELETE all data
```

### Database Backups

Nightly backups run at 03:00 UTC via a systemd timer (`db-backup.timer`). Both PostgreSQL and MongoDB are backed up to `~/backups/` with 7-day retention.

```bash
journalctl -t db-backup              # View backup logs
sudo systemctl status db-backup.timer # Check timer
~/scripts/backup-databases.sh        # Run manually
ls ~/backups/                        # List backups
```

## Production Readiness Issues

The current deployment has addressed several foundational issues but still has items to resolve before real production use.

### Resolved

- **~~Flask Development Server~~** — Now using Gunicorn with gevent async workers (2 workers) behind a systemd service with automatic restart.
- **~~No Automated Deployment~~** — Backend auto-deploys via systemd timer (3-minute polling) with health check verification.
- **~~No Database Backups~~** — Nightly backups of PostgreSQL and MongoDB with 7-day retention.

### Clerk Development Mode

The application uses Clerk's **development instance** (`suitable-dassie-90.clerk.accounts.dev`) in all environments, including the deployed VM. Clerk development instances:
- Display a "Development mode" banner
- Have relaxed security defaults
- Are not intended for production use
- May have different rate limits and SLAs than production instances

Before real production use, create a Clerk production instance and update `CLERK_ISSUER`, `CLERK_JWKS_URL`, and `VITE_CLERK_PUBLISHABLE_KEY` in both the VM `.env` and Vercel environment variables.

### Database Credentials

PostgreSQL uses the default `postgres:postgres` credentials from `docker-compose.yml`. These should be changed to non-default values in production, even though the database port is not exposed publicly.

### CORS

The backend allows all origins (`CORS(app)` with no restrictions). In production, this should be restricted to the frontend origin:

```python
CORS(app, origins=["https://byggspor.ksterud.dev"])
```

### Debug Logging

The auth middleware prints authorization headers to stdout (see [Security](security.md)). This must be removed before production.

---

[Home](../README.md) | [Setup Guide](setup.md) | [Architecture](architecture.md) | [Backend](backend.md) | [Frontend](frontend.md) | [Testing](testing.md) | [Security](security.md) | **Deployment** | [Development](development.md)
