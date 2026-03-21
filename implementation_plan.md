# Conduit — Full Implementation Plan

---

# Step 1: Backend Foundation ✅ DONE

Build the core backend infrastructure — config, storage layer, encryption — so the app starts cleanly in `local` mode with zero external dependencies.

## Completed Changes

### POM & Build Config

#### [MODIFY] [pom.xml](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/pom.xml)
- Set `<groupId>com.conduit</groupId>`
- Removed JPA, PostgreSQL, Flyway, Redis, WebSocket dependencies (not needed for local mode)
- Added JJWT dependencies for JWT RS256

### Application Config

#### [MODIFY] [application.yaml](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/resources/application.yaml)
- Simplified to local-only config (no profile-based DB config)
- Set `conduit.mode: local`, `conduit.data-dir`, `conduit.port`

### Package Restructure

- Moved main app class from `com.conduit.services` → `com.conduit`
- Created package-by-feature structure: `config/`, `common/`, `storage/`, `health/`, `auth/`

### Config & Encryption

#### [NEW] [ConduitProperties.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/config/ConduitProperties.java)
- `@ConfigurationProperties(prefix = "conduit")` — mode, dataDir, port, secretKey, jwtPrivateKey, jwtPublicKey

#### [NEW] [EncryptionService.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/common/EncryptionService.java)
- AES-256 CBC, random IV prepended, base64 encoded

### Storage Layer

#### [NEW] [StorageService.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/storage/StorageService.java)
- Interface: `read()`, `readList()`, `write()`, `delete()`, `list()`

#### [NEW] [JsonFileStorageService.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/storage/JsonFileStorageService.java)
- Encrypted JSON file storage, atomic writes, path resolution relative to `data-dir`

### Data Directory Init & Health

#### [NEW] [DataDirectoryInitializer.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/config/DataDirectoryInitializer.java)
- Creates `~/.conduit/` directory structure on startup
- Generates `conduit.yml` with AES-256 key + RS256 JWT key pair
- Creates default admin user (`admin`/`admin`)

#### [NEW] [HealthController.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/health/HealthController.java)
- `GET /api/health` → `{"status":"ok","mode":"local","version":"0.1.0"}`

---

# Step 2: Authentication ✅ DONE

JWT RS256 auth with bcrypt password hashing, refresh tokens, and brute-force lockout.

## Completed Changes

### Backend (`com.conduit.auth`)

#### [NEW] [User.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/User.java)
- Fields: id, username, email, passwordHash, role, apiTokens, revokedRefreshTokens, failedAttempts, lockedUntil, timestamps

#### [NEW] [Role.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/Role.java)
- Enum: ADMIN, MANAGER, DEVELOPER, VIEWER, SERVICE_ACCOUNT

#### [NEW] [AuthRequest.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/AuthRequest.java)
- DTO: username, password, rememberMe

#### [NEW] [AuthResponse.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/AuthResponse.java)
- DTO: accessToken, expiresIn, sanitized user map

#### [NEW] [JwtService.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/JwtService.java)
- RS256 key pair, 15-min access tokens, 7-day/30-day refresh tokens

#### [NEW] [AuthService.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/AuthService.java)
- Login (bcrypt verify + brute-force lockout: 5 fails → 15-min lock)
- Refresh (revocation check), Logout (revoke refresh token)
- Default admin creation, user CRUD (changePassword, createUser, listUsers, updateRole, deleteUser)

#### [NEW] [AuthController.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/AuthController.java)
- `POST /api/auth/login` — returns access token + sets refresh cookie
- `POST /api/auth/refresh` — refreshes access token
- `POST /api/auth/logout` — revokes refresh token

#### [NEW] [JwtAuthFilter.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/JwtAuthFilter.java)
- Extracts Bearer token, validates JWT, sets SecurityContext

#### [NEW] [UserController.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/auth/UserController.java)
- `GET /api/users/me` — current profile
- `PUT /api/users/me/password` — change password
- `GET /api/users` — list all (admin/manager)
- `POST /api/users` — create user (admin)
- `PUT /api/users/{id}/role` — update role (admin)
- `DELETE /api/users/{id}` — delete user (admin)

#### [MODIFY] [SecurityConfig.java](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-bakcend/src/main/java/com/conduit/config/SecurityConfig.java)
- JWT filter registration, BCrypt encoder, CORS config for localhost:3000

### Frontend

#### [NEW] [api.ts](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/lib/api.ts)
- Fetch wrapper with Bearer token injection, auto-refresh on 401

#### [NEW] [auth.ts](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/lib/auth.ts)
- Typed login/refresh/logout service

#### [NEW] [users.ts](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/lib/users.ts)
- User management API: listUsers, createUser, updateRole, deleteUser, changePassword

#### [MODIFY] [store/index.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/store/index.tsx)
- Rewrote auth store: login, logout, tryRestore (session persistence)

#### [NEW] [AuthGuard.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/components/AuthGuard.tsx)
- Route protection + session restore on page refresh

#### [MODIFY] [login/page.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/app/(routes)/(auth)/login/page.tsx)
- Username-based login, real API calls, error banner, remember me checkbox

#### [MODIFY] [Topbar.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/components/Topbar.tsx)
- User profile dropdown: avatar initials, username, role badge, sign out

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/components/Sidebar.tsx)
- User profile at bottom: avatar + name + role + logout (expanded), avatar → profile link (collapsed)

#### [NEW] [team/page.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/app/(routes)/team/page.tsx)
- User list table, inline role editing, delete confirmation, "Add Member" dialog, role permissions card

#### [NEW] [settings/page.tsx](file:///c:/Users/vedpa/Documents/Ved/Conduit/con-frontend/src/app/(routes)/settings/page.tsx)
- Profile card, change password form with validation

---

# Step 3: Pipeline Model + CRUD 🔴 NEXT

The core feature — create/read/update/delete pipelines stored as encrypted JSON.

## Proposed Changes

### Backend (`com.conduit.pipeline`)

#### [NEW] Pipeline.java
- Fields: `id` (UUID), `name`, `repoUrl`, `branch`, `trigger` (MANUAL/WEBHOOK/CRON), `stages` (list of Stage), `status`, `createdBy`, `createdAt`, `updatedAt`
- Nested `Stage`: `id`, `name`, `type`, `command`, `dependsOn`, `position` (x/y for React Flow)

#### [NEW] PipelineService.java
- CRUD via `StorageService` (`data/pipelines/`)

#### [NEW] PipelineController.java
- `GET /api/pipelines` — list all
- `GET /api/pipelines/{id}` — get by ID
- `POST /api/pipelines` — create
- `PUT /api/pipelines/{id}` — update
- `DELETE /api/pipelines/{id}` — delete
- `POST /api/pipelines/{id}/trigger` — manual trigger

### Frontend

#### [NEW] `pipelines/page.tsx`
- Pipeline list table (name, repo, branch, status, last run, actions)

#### [NEW] `pipelines/[id]/page.tsx`
- Pipeline detail: stages visualization, config, run history

#### [NEW] `pipelines/new/page.tsx`
- Pipeline builder form: name, repo, branch, trigger type, stage editor

#### [NEW] `src/lib/pipelines.ts`
- API service: list, get, create, update, delete, trigger

---

# Step 4: Runs Model + Live View 🟡

Track pipeline execution runs with stage-by-stage progress.

## Proposed Changes

### Backend (`com.conduit.run`)

#### [NEW] Run.java
- Fields: `id`, `pipelineId`, `pipelineName`, `branch`, `trigger`, `status` (QUEUED/RUNNING/PASSED/FAILED/CANCELLED), `stageResults`, `startedAt`, `finishedAt`, `duration`, `triggeredBy`

#### [NEW] RunService.java
- CRUD + status transitions via `StorageService` (`data/runs/`)

#### [NEW] RunController.java
- `GET /api/runs` — list (filters: pipelineId, status, branch)
- `GET /api/runs/{id}` — detail with stage logs
- `POST /api/runs/{id}/cancel` — cancel running

### Frontend

#### [NEW] `runs/page.tsx`
- Runs list table with filter bar (pipeline, status, branch)

#### [NEW] `runs/[id]/page.tsx`
- Run detail: stage progress, logs viewer, timing

---

# Step 5: Integrations 🟢

First-party extension stubs for GitHub, GitLab, Docker, Slack, etc.

## Proposed Changes

### Backend (`com.conduit.integration`)

#### [NEW] Integration.java
- Fields: `id`, `type` (GITHUB/GITLAB/DOCKER/SLACK), `name`, `config` (Map), `enabled`, `createdAt`

#### [NEW] IntegrationController.java
- CRUD for integrations

### Frontend

#### [NEW] `integrations/page.tsx`
- Integration cards with enable/disable toggle, config dialog

---

# Step 6: Pipeline Builder Canvas 🟢

n8n-style visual pipeline editor using React Flow.

## Proposed Changes

### Frontend

#### [NEW] Pipeline builder component
- React Flow canvas for stage arrangement
- Drag-and-drop stage nodes
- Connection lines for dependencies
- Stage config panel (command, type, env vars)

---

## Priority Order

| # | Step | Status | Effort |
|---|------|--------|--------|
| 1 | Backend Foundation | ✅ Done | — |
| 2 | Authentication + User Management | ✅ Done | — |
| 3 | **Pipeline CRUD** | 🔴 Next | High |
| 4 | Runs | 🟡 Upcoming | High |
| 5 | Integrations | 🟢 Later | Medium |
| 6 | Pipeline Builder Canvas | 🟢 Later | High |
