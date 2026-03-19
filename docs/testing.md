# Testing

## Frontend

Tests use [Vitest](https://vitest.dev/) with React Testing Library.

```bash
cd frontend
pnpm install
pnpm test          # run once
pnpm test:watch    # watch mode
```

Test files live in `frontend/src/` alongside the code they test (`*.test.tsx`).

## Backend

Tests use [pytest](https://pytest.org/) with an in-memory SQLite database (no PostgreSQL required).

```bash
cd backend
pip install -r requirements.txt
pip install pytest
pytest
```

Test files live in `backend/tests/`. Auth middleware is bypassed automatically via fixtures in `conftest.py`, so no real credentials are needed.

## CI

Both test suites run automatically on every pull request to `main` and `development` via GitHub Actions (`.github/workflows/ci.yml`).
