# IsikCampusOS Copilot Instructions

## Build, test, and lint commands

### Frontend (Vite + React + TypeScript)
- Install deps: `cd frontend && npm install` (or from repo root: `npm run install-all`)
- Dev server: `cd frontend && npm run dev` (or from root: `npm run dev`)
- Build: `cd frontend && npm run build` (or from root: `npm run build`)
- Lint: `cd frontend && npm run lint`
- Single frontend test: no frontend test runner is configured in `frontend/package.json` yet.

### Backend (Maven multi-module)
- Build/test all registered backend modules: `.\mvnw.cmd test`
- Compile without tests: `.\mvnw.cmd clean compile -DskipTests`
- Run one module: `.\mvnw.cmd spring-boot:run -pl services/auth-service`
- Run a single module’s tests: `.\mvnw.cmd -pl services/auth-service test`
- Run one module plus required upstream modules: `.\mvnw.cmd -pl services/auth-service -am test`
- Run a single test class/method (when tests exist):
  - `.\mvnw.cmd -pl services/auth-service -Dtest=AuthServiceTest test`
  - `.\mvnw.cmd -pl services/auth-service -Dtest=AuthServiceTest#login_shouldReturnToken test`
- Filter by pattern in one service (when tests exist): `.\mvnw.cmd -pl services/event-service -Dtest=*Security* test`

### Local infra / full dev startup
- Infra only: `docker compose -f infra/docker-compose.infra.yml up -d`
- Full local dev bootstrap on Windows: `.\start-dev.ps1`
- Backend-only startup on Windows: `.\start-backend-only.ps1`

## High-level architecture

- Monorepo with React frontend (`frontend/`) and Spring Boot microservices (`services/`).
- API entrypoint is `api-gateway` (port `8080`), with service discovery through Eureka (`eureka-server`, `8761`).
- Frontend calls `/api/...`; Vite proxy forwards `/api` to `http://127.0.0.1:8080`.
- Implemented and wired backend modules in the Maven parent are currently:
  - `services/eureka-server`
  - `services/api-gateway`
  - `services/auth-service`
  - `services/profile-service`
  - `services/event-service`
- PostgreSQL/Kafka/Redis/Zipkin/Mailpit are started via `infra/docker-compose.infra.yml`.
- `auth-service` is identity/token issuer and user lifecycle service; `profile-service` consumes `user.registered` Kafka events to create profiles; `event-service` handles clubs/events/RSVP.

### Backend request + auth flow
- User logs in via `POST /api/v1/auth/login` (gateway route to `auth-service`), receives JWT.
- Frontend stores token in `localStorage` and sends `Authorization: Bearer <token>` via Axios interceptor.
- Gateway `AuthenticationFilter` validates JWT and injects `X-User-Id` + `X-User-Roles` for downstream services.
- Service routes currently configured in gateway:
  - `/api/v1/auth/**` and `/api/v1/students/**` -> `auth-service`
  - `/api/v1/profiles/**` -> `profile-service`
  - `/api/v1/events/**` and `/api/v1/clubs/**` -> `event-service`
- `event-service` also validates JWT locally (`JwtAuthFilter`) for defense in depth; keep gateway and service rules aligned when adding endpoints.

## MCP server guidance (web stack)

- Prefer a Playwright MCP server for UI/browser regression checks touching `frontend/src/**`.
- Start stack before MCP-driven browser checks:
  1. `docker compose -f infra/docker-compose.infra.yml up -d`
  2. `.\start-backend-only.ps1`
  3. `cd frontend && npm run dev`
- Use `http://localhost:5173` as browser base URL, and validate API behavior through gateway-backed UI flows (proxy `/api` -> `8080`).
- For auth-required scenarios, log in with dev-seeded users from `auth-service` (`DataSeeder`) instead of bypassing auth.

## Key codebase conventions

- **API versioning/pathing:** backend endpoints use `/api/v1/...`; frontend stores call relative paths like `/auth/...`, `/students/...`, `/events/...` via a shared Axios base URL (`/api/v1`).
- **Gateway auth propagation:** gateway validates bearer JWT and forwards user context via `X-User-Id` and `X-User-Roles` headers.
- **Shared JWT secret:** `security.jwt.secret` must match across `api-gateway`, `auth-service`, and `event-service` (`JWT_SECRET` env var is the intended source).
- **Role format:** roles are stored/handled as Spring-style authority strings (e.g. `ROLE_REGISTRAR`, `ROLE_ADMIN`, `ROLE_STUDENT`, `ROLE_SKS_ADMIN`), often comma-separated in token claims.
- **Gateway routing + filters:** most secured routes explicitly attach `AuthenticationFilter` in gateway route config; keep new secured routes consistent with this pattern.
- **Security layering:** gateway enforces auth on routed paths; services still keep local Spring Security/JWT checks for defense in depth.
- **State management pattern (frontend):** Zustand stores in `frontend/src/store` own async API calls, loading/error/success state, and UI-facing messages.
- **Auth UX flow:** app routing enforces login → email verification → password change before normal dashboard usage.
- **Dev-only seed data:** `auth-service` seeds demo users through `DataSeeder` under `dev` profile only.
- **Env loading for scripts:** PowerShell startup scripts source `tools/load-env.ps1`, which loads `.env` into process environment variables.

