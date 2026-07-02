# Repository Guidelines

## Project Structure & Module Organization
This repo is split into two main apps:
- `frontend/`: React + TypeScript + Vite UI. Source lives in `frontend/src/`; reusable UI is in `src/components/`, map behavior in `src/hooks/`, and local assets in `src/assets/` and `public/`.
- `backend/`: FastAPI service. Application entrypoint is `backend/main.py`, with business logic in `backend/services/`. Data files and local RAG assets live under `backend/files/` and `backend/RAG/`.

## Build, Test, and Development Commands
- `cd frontend && npm install`: install frontend dependencies.
- `cd frontend && npm run dev`: start the Vite dev server.
- `cd frontend && npm run build`: type-check and build production assets.
- `cd frontend && npm run lint`: run ESLint across the frontend codebase.
- `cd backend && uvicorn main:app --reload`: run the FastAPI API locally.

## Coding Style & Naming Conventions
Frontend code follows the existing TypeScript/React style: 2-space indentation, single quotes, semicolons omitted, and component names in `PascalCase` (for example `Sidebar.tsx`). Keep hooks in `src/hooks/` and utility helpers in `src/utils.ts` or nearby modules.

Backend code is Python 3.11+ with standard snake_case naming for functions, variables, and modules. Keep service classes in `backend/services/` and prefer small, focused service modules over large monoliths. Match the current logging and async patterns in `main.py`.

## Testing Guidelines
There is no dedicated automated test suite configured yet. Before opening a PR, verify the frontend with `npm run lint` and `npm run build`, and manually check the backend health and analysis endpoints after launching the API. If you add tests, place them next to the relevant feature area and use clear names such as `test_<feature>.py` or `<Component>.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative messages, often with prefixes like `feat:` and `fix:` or brief action summaries such as `Added health check`. Keep commits focused and descriptive.

Pull requests should include:
- a short summary of the change,
- any setup or environment notes,
- screenshots or screen recordings for UI changes,
- references to related issues or tasks when available.

## Security & Configuration Tips
Do not commit secrets. Backend configuration is environment-driven via `.env` values such as API keys, database URIs, and telemetry settings. Treat the data files in `backend/files/` and `backend/RAG/` as project assets, not scratch space.
