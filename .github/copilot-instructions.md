# Copilot Instructions — AI Sales Visit Logger

---

## Core Directive

You are an AI development assistant. Your primary role is to help build products efficiently while maintaining quality standards. These instructions will evolve based on each project's specific needs.

## Fundamental Protocol

### 1. Always Ask First
Before writing any code or making architectural decisions, you MUST:
- **Clarify Requirements**: Ask about unclear specifications, edge cases, or missing details
- **Understand Context**: Ask about target users, business goals, and technical constraints
- **Validate Assumptions**: Confirm your understanding before proceeding
- **Surface Options**: Present multiple approaches when they exist, with trade-offs
- **Flag Risks**: Highlight potential issues early in the conversation

**Never assume. Always ask when in doubt about ANY aspect of the project.**

### 2. Update These Instructions
When you encounter project-specific requirements, you MUST update this document by adding:
- New technical requirements or constraints discovered
- Specific tools, frameworks, or technologies being used
- Project-specific quality standards or processes
- Business domain rules or compliance requirements
- Team preferences or organizational standards

Add these updates under "Project-Specific Adaptations" section below.

### 3. Code Quality Standards
- Write production-ready code that works reliably
- Prioritize readability and maintainability over complexity
- Include appropriate error handling and logging
- Add tests for new functionality when requested
- Follow consistent naming and structure patterns
- Document complex logic and architectural decisions

### 4. Documentation Discipline
For every significant change or feature:
- **What**: Describe what was built or changed
- **Why**: Explain the business or technical reasoning
- **How**: Document key implementation decisions
- **Impact**: Note effects on users, performance, or other systems
- **Next Steps**: Identify any follow-up work needed

### 5. Problem-Solving Approach
When faced with technical challenges:
1. Ask clarifying questions about requirements and constraints
2. Research best practices for the specific technology stack
3. Present multiple solution options with pros/cons
4. Recommend the approach that best fits the context
5. Implement with clear, well-documented code
6. Suggest testing strategies for the solution

### 6. Collaboration Guidelines
- Communicate clearly about technical decisions and trade-offs
- Ask for feedback on architectural choices
- Provide regular progress updates
- Document decisions and reasoning for future reference
- Be transparent about limitations or areas of uncertainty

---

## Project-Specific Adaptations

> This section documents all implementations, features, and tech stack decisions made during development.

### ✅ Completed Features (March 15, 2026)

#### 1. **AI Summary Generation** (Server-Side)
- **AI Provider:** Google Generative AI (Gemini) — replaced Anthropic Claude
- **Model:** `gemini-2.5-flash` (fast) / `gemini-pro` (accurate)
- **Trigger:** Auto-generates on POST (create), auto-regenerates on PUT if notes change
- **Context:** Uses complete visit details (customer, location, date, outcome, follow-up date, notes) for better summaries
- **Response Handling:** Custom JSON parser handles markdown code blocks from Gemini
- **Summary Fields:**
  - `meetingSummary` — 2-3 sentence overview
  - `painPoints` — Array of identified problems/challenges
  - `actionItems` — Array of concrete next steps
  - `recommendedNextStep` — Single most important action
  - `generatedAt` — ISO 8601 timestamp

#### 2. **Background Sync System**
- **Monitoring:** Network connectivity (online/offline), app state (foreground/background)
- **Triggers:** 
  - Device comes online
  - App returns to foreground
  - New draft visits detected
- **Batching:** 500ms delay to prevent sync storms
- **Sync Flow:** `syncFromServer()` → merge with local drafts → `syncAll()` on pending visits
- **ID Mapping:** MongoDB `_id` ↔ local ID conversion, safe delete-and-insert for updates
- **Cleanup:** Removes synced visits that no longer exist on server
- **Visibility:** `SyncIndicator` component shows real-time status (idle/syncing/success/error/offline)

#### 3. **Data Synchronization Improvements**
- MongoDB ID mapping: Server returns `_id`, app normalizes to `id`
- Local-to-server ID conversion: Timestamps→MongoDB ID on first sync
- Captures `aiSummary` from sync responses and stores in SQLite
- UNIQUE constraint fix: Delete-and-insert approach for primary key updates
- Null ID filtering: Prevents corrupted entries from propagating
- DELETE sync: Removes server-deleted visits from app

#### 4. **Type System Fixes**
- Fixed Mongoose deprecation: `new: true` → `returnDocument: 'after'`
- Fixed React Native setTimeout types: `NodeJS.Timeout` → `ReturnType<typeof setTimeout>`
- Type assertions for database query results (`.lean()` returns untyped data)

#### 5. **UI/UX Features**
- **AISummaryPanel Component:** Displays AI summary with color-coded bullets and recommendations
- **VisitCard:** Shows AI summary preview (fallback to raw notes if unavailable)
- **Visit Details Screen:** Shows complete AI summary with all fields
- **SyncBadge:** Status indicators (draft/syncing/synced/failed)
- **Sync Indicator:** App-wide status bar showing sync activity

## Project Context

You are helping build two things:
1. A **React Native mobile app** for field sales reps to log customer visits
2. A **Node.js + Express REST API server** that handles auth, visit sync, and AI summary generation

The app and server live in **separate sibling folders**. The AI summary is generated **server-side only** using Google Gemini — the app never calls the AI API directly.

Follow every rule in this file precisely and consistently across all files you generate or modify.

---

## Project Identity

### Mobile App (`app/`)
- **Framework:** Expo (with expo-router)
- **Language:** TypeScript (strict mode)
- **Package manager:** npm
- **Target platform:** Android (primary), iOS (secondary)

### Server (`server/`)
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript (strict mode)
- **Package manager:** npm
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (self-signed, `jsonwebtoken`)
- **AI:** Google Generative AI (Gemini) — server-side only

### Top-Level Folder Layout
```
healeasy/        # root workspace (not a monorepo — two independent projects)
├── app/         # Expo React Native app
└── server/      # Express + MongoDB API
```

---

## Tech Stack — Use Exactly These

### Mobile App

| Concern | Library / Tool |
|---|---|
| Navigation | `expo-router` (built on `@react-navigation`) |
| Local persistence | `expo-sqlite` (raw SQL) |
| State management | `zustand` |
| Auth token storage | `react-native-default-preference` |
| Server communication | `fetch` (no axios) |
| Forms & validation | `react-hook-form` + `zod` |
| Date/time | `dayjs` |
| UI primitives | Custom components only — no UI kit unless specified |
| Icons | `react-native-vector-icons` (Ionicons set) |
| Network status | `@react-native-community/netinfo` |
| Env vars | `react-native-config` |

### Server

| Concern | Library / Tool |
|---|---|
| Framework | `express` |
| Language | TypeScript via `ts-node-dev` (dev) / `tsc` (prod) |
| Database | `mongoose` (MongoDB ODM) |
| Auth | `jsonwebtoken` + `bcryptjs` |
| Validation | `zod` |
| AI | `@google/generative-ai` (`gemini-2.5-flash` / `gemini-pro`) |
| Env vars | `dotenv` |
| Logging | `morgan` |

**Changed from:** `@anthropic-ai/sdk` (Claude) → `@google/generative-ai` (Gemini)

Do **not** introduce libraries outside these lists without explicit instruction.

---

## Folder Structure — Enforce Strictly

### Mobile App (`app/`)

```
app/
├── android/
├── ios/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout
│   ├── modal.tsx                 # Modal route
│   └── (tabs)/                   # Tab navigation group
│       ├── _layout.tsx           # Tab layout
│       ├── index.tsx             # Home tab
│       └── explore.tsx           # Explore tab
├── components/                   # Reusable components
│   ├── VisitCard.tsx
│   ├── SyncBadge.tsx
│   ├── AISummaryPanel.tsx
│   ├── FormField.tsx
│   └── ui/                       # UI primitives
├── constants/
│   └── colors.ts
├── hooks/
│   ├── useVisits.ts
│   └── useSync.ts
├── db/                           # Local database
│   └── client.ts                 # Expo SQLite client with raw SQL
├── store/                        # Zustand stores
│   ├── authStore.ts
│   └── visitStore.ts
├── services/                     # API and business logic
│   ├── apiClient.ts              # Base fetch wrapper with JWT header injection
│   ├── authService.ts            # login(), logout(), restoreSession()
│   └── syncService.ts            # Sync local visits → server
├── types/
│   └── index.ts
├── utils/
│   ├── validation.ts
│   └── dateHelpers.ts
├── assets/
│   └── images/
├── scripts/
│   └── reset-project.js
├── App.tsx
├── index.js
├── .env
├── .env.example
├── app.json
├── babel.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
├── expo-env.d.ts
├── eslint.config.js
└── README.md
```

### Server (`server/`)

```
server/
├── api/
│   └── index.ts                   # Vercel serverless entry point
├── src/
│   ├── config/
│   │   └── db.ts                        # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts                      # JWT verification middleware
│   │   └── errorHandler.ts              # Global error handler
│   ├── models/
│   │   ├── User.ts                      # Mongoose User model
│   │   └── Visit.ts                     # Mongoose Visit model
│   ├── repositories/                    # DB abstraction layer — only place Mongoose is called
│   │   ├── base.repository.ts           # Generic CRUD interface
│   │   ├── user.repository.ts           # User DB operations
│   │   └── visit.repository.ts          # Visit DB operations
│   ├── services/                        # Business logic layer — sits between routes and repos
│   │   ├── auth.service.ts              # Register, login, token logic
│   │   ├── visit.service.ts             # Visit CRUD orchestration
│   │   └── ai.service.ts               # Claude API — only place Anthropic SDK is used
│   ├── controllers/
│   │   ├── auth.controller.ts           # Thin — delegates to auth.service
│   │   └── visits.controller.ts         # Thin — delegates to visit.service
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── visits.routes.ts
│   ├── utils/
│   │   └── response.ts                  # Standardized API response helpers
│   ├── types/
│   │   └── index.ts
│   └── app.ts                           # Express app setup
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vercel.json                          # Vercel deployment config
└── README.md
```

---

## Abstraction Layer Architecture

All four layers below are mandatory. Never bypass them — e.g. never call Mongoose directly from a controller, never call a repository from a route.

```
Route → Controller → Service → Repository → Mongoose Model
```

---

### Layer 1 — Repository Pattern (`server/src/repositories/`)

Repositories are the **only** place Mongoose is called. Services never import Mongoose or models directly.

#### Base Repository Interface (`base.repository.ts`)

```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
```

#### Visit Repository (`visit.repository.ts`)

```typescript
import { IRepository } from './base.repository';
import { Visit, IVisit } from '../models/Visit';

export class VisitRepository implements IRepository<IVisit> {
  async findById(id: string) {
    return Visit.findById(id).lean();
  }
  async findAll(filter: Partial<IVisit> = {}) {
    return Visit.find(filter).sort({ visitDateTime: -1 }).lean();
  }
  async findByUserId(userId: string) {
    return Visit.find({ userId }).sort({ visitDateTime: -1 }).lean();
  }
  async create(data: Partial<IVisit>) {
    return Visit.create(data);
  }
  async update(id: string, data: Partial<IVisit>) {
    return Visit.findByIdAndUpdate(id, data, { new: true }).lean();
  }
  async delete(id: string) {
    const result = await Visit.findByIdAndDelete(id);
    return result !== null;
  }
  async updateAiSummary(id: string, summary: IVisit['aiSummary']) {
    return Visit.findByIdAndUpdate(id, { aiSummary: summary }, { new: true }).lean();
  }
}

export const visitRepository = new VisitRepository();
```

#### Rules
- Always instantiate repositories as singletons and export the instance (not the class)
- Repositories return plain objects (use `.lean()`) — never return Mongoose documents to services
- No business logic in repositories — only DB queries

---

### Layer 2 — Service Layer (`server/src/services/`)

Services contain all business logic. They call repositories, orchestrate multi-step operations, and call `ai.service.ts` when needed.

#### Rules
- Services never import `express`, `Request`, or `Response`
- Services never call Mongoose or models directly — always go through repositories
- Services throw typed `AppError` instances (see Layer 4) on failure — never send HTTP responses
- One service per domain: `auth.service.ts`, `visit.service.ts`, `ai.service.ts`

#### Example pattern (`visit.service.ts`)

```typescript
import { visitRepository } from '../repositories/visit.repository';
import { AppError } from '../utils/response';

export const visitService = {
  async getVisitForUser(visitId: string, userId: string) {
    const visit = await visitRepository.findById(visitId);
    if (!visit) throw new AppError('Visit not found', 404);
    if (visit.userId.toString() !== userId) throw new AppError('Forbidden', 403);
    return visit;
  },

  async createVisit(data: CreateVisitDto, userId: string) {
    return visitRepository.create({ ...data, userId });
  },
  // ...
};
```

---

### Layer 3 — Standardized API Response (`server/src/utils/response.ts`)

Every API response — success or error — must use these helpers. No controller may call `res.json()` with a raw object.

```typescript
import { Response } from 'express';

// Standardized success shape
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

// Standardized error shape
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? null,
  });
}

// Typed application error — thrown by services, caught by errorHandler middleware
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

#### Global Error Handler (`server/src/middleware/errorHandler.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }
  console.error('[Unhandled Error]', err);
  return sendError(res, 'Internal server error', 500);
}
```

#### Response Shape Contract (all endpoints must conform)

```typescript
// Success
{ success: true, message: string, data: T }

// Error
{ success: false, message: string, errors: unknown | null }
```

#### Controller pattern — thin, no logic

```typescript
// visits.controller.ts
import { Request, Response, NextFunction } from 'express';
import { visitService } from '../services/visit.service';
import { sendSuccess } from '../utils/response';

export async function getVisits(req: Request, res: Response, next: NextFunction) {
  try {
    const visits = await visitService.getVisitsByUser(req.user.sub);
    sendSuccess(res, visits, 'Visits fetched');
  } catch (err) {
    next(err); // always delegate to errorHandler
  }
}
```

---

### Layer 4 — App-Side API Client (`src/services/apiClient.ts`)

The `apiClient` is the **only** place `fetch` is called in the React Native app. All services (`authService`, `syncService`) call `apiClient` — never `fetch` directly.

```typescript
import Config from 'react-native-config';
import DefaultPreference from 'react-native-default-preference';
import { ApiResponse } from '../types';

const BASE_URL = Config.API_BASE_URL!;

export class ApiError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: 'auth_token' });
  return credentials ? credentials.password : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const json = await response.json() as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new ApiError(json.message ?? 'Request failed', response.status);
  }

  return json;
}

// Convenience wrappers
export const apiGet = <T>(path: string) =>
  apiRequest<T>(path, { method: 'GET' });

export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) =>
  apiRequest<T>(path, { method: 'DELETE' });
```

Add `ApiResponse` to `src/types/index.ts`:

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}
```

#### Rules
- All app services use `apiGet`, `apiPost`, `apiPut`, `apiDelete` — never raw `fetch`
- Catch `ApiError` in services/hooks — never let it bubble to components unhandled
- Token injection is automatic — never manually set `Authorization` header outside `apiClient.ts`

---

Define in `src/types/index.ts`. Do not redefine inline in components.

```typescript
export type SyncStatus = 'draft' | 'syncing' | 'synced' | 'failed';

export type OutcomeStatus =
  | 'deal_closed'
  | 'follow_up_needed'
  | 'no_interest'
  | 'pending';

export interface Visit {
  id: string;                  // uuid
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: string;       // ISO 8601
  rawNotes: string;
  outcomeStatus: OutcomeStatus;
  nextFollowUpDate: string | null;  // ISO 8601, required when outcome = follow_up_needed
  aiSummary: AISummary | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AISummary {
  meetingSummary: string;
  painPoints: string[];
  actionItems: string[];
  recommendedNextStep: string;
  generatedAt: string;         // ISO 8601
}

export interface AuthUser {
  id: string;
  email: string;
  token: string;
}
```

---

## Mobile App — Local Database (Expo SQLite)

### Schema

Tables are created using raw SQL in `db/client.ts` on app initialization:
- Table name: `visits`
- Columns mirror the `Visit` type
- `ai_summary` stored as JSON string, parsed on read
- `sync_status` stored as TEXT with default value 'draft'
- Includes `created_at` and `updated_at` columns with CURRENT_TIMESTAMP defaults

### Client (`app/db/client.ts`)

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('visits.db');

db.execSync(`CREATE TABLE IF NOT EXISTS visits (...)`);

export { db };
```

### Rules

- All DB operations must be in `app/store/visitStore.ts` — never in components
- Use parameterized queries to prevent SQL injection: `db.runSync(sql, [params])`
- All queries use `db.runSync()` for INSERT/UPDATE/DELETE or `db.getAllSync()` for SELECT
- Table is created automatically in `db/client.ts` on first app load

---

## State Management — Zustand

### `authStore.ts`
- State: `user: AuthUser | null`, `isLoading: boolean`
- Actions: `login(email, password)`, `logout()`, `restoreSession()`
- Persist JWT token using `react-native-default-preference`, not AsyncStorage

### `visitStore.ts`
- State: `visits: Visit[]`, `isSyncing: boolean`
- Actions: `loadVisits()`, `createVisit(data)`, `updateVisit(id, data)`, `syncAll()`, `retrySyncForVisit(id)`
- Always write to SQLite first, then update Zustand state — never the reverse
- When creating a visit, set `syncStatus: 'draft'` immediately

---

## Authentication

### App Side
- Call `POST /auth/login` with `{ email, password }` — server returns `{ token, user }`
- Store the JWT token in `react-native-default-preference` under key `auth_token`
- On app launch, call `restoreSession()` — read token from keychain, validate it is not expired (`jwt-decode`), redirect to `LoginScreen` if missing or expired
- On logout, clear keychain and reset Zustand auth state
- All authenticated API calls must include `Authorization: Bearer <token>` header — injected automatically by `apiClient.ts`
- Every visit record must store `userId` (decoded from JWT `sub` field)

### `apiClient.ts` — Base Fetch Wrapper

```typescript
// src/services/apiClient.ts
import Config from 'react-native-config';
import DefaultPreference from 'react-native-default-preference';

const BASE_URL = Config.API_BASE_URL; // e.g. http://10.0.2.2:3000 for Android emulator

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await DefaultPreference.get('auth_token');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

### Server Side — Auth Routes (`server/src/routes/auth.routes.ts`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create user, return JWT |
| `POST` | `/auth/login` | Validate credentials, return JWT |

- Passwords hashed with `bcryptjs` (salt rounds: 10)
- JWT signed with `JWT_SECRET` from `.env`, expiry: `7d`
- JWT payload: `{ sub: userId, email }`

### Server Side — JWT Middleware (`server/src/middleware/auth.ts`)

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
```

---

## Visit List Screen (`src/screens/visits/VisitListScreen.tsx`)

- Load all visits from Zustand store on mount
- Sort by `visitDateTime` descending (newest first)
- Each `VisitCard` must display:
  - Customer name (bold)
  - Visit date/time formatted as `MMM D, YYYY h:mm A` using dayjs
  - Short summary: first 80 chars of `aiSummary.meetingSummary` if available, else first 80 chars of `rawNotes`, followed by `…`
  - `SyncBadge` showing sync status
- Tapping a card navigates to `VisitDetailScreen` with `visitId` param
- FAB (floating action button) in bottom-right navigates to `CreateVisitScreen`
- Show empty state with illustration text when no visits exist

---

## Create / Edit Visit Form

Use `react-hook-form` + `zod` for all form logic.

### Zod Schema (`src/utils/validation.ts`)

```typescript
import { z } from 'zod';

export const visitFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  location: z.string().min(1, 'Location is required'),
  visitDateTime: z.string().min(1, 'Visit date/time is required'),
  rawNotes: z.string().min(10, 'Notes must be at least 10 characters'),
  outcomeStatus: z.enum(['deal_closed', 'follow_up_needed', 'no_interest', 'pending']),
  nextFollowUpDate: z.string().nullable(),
}).superRefine((data, ctx) => {
  if (data.outcomeStatus === 'follow_up_needed' && !data.nextFollowUpDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nextFollowUpDate'],
      message: 'Follow-up date is required when outcome is "Follow-up needed"',
    });
  }
});
```

### Form Behaviour Rules

- Show inline error messages beneath each field immediately on blur
- `nextFollowUpDate` field must be hidden (not just disabled) when `outcomeStatus !== 'follow_up_needed'`
- Disable submit button while form is invalid or submitting
- On successful save, navigate back to visit list
- On edit screen, pre-populate all fields from the existing visit object

---

## AI Summary Feature

> ⚠️ The app **never** calls the Google Generative AI API directly. All AI logic lives in `server/src/services/ai.service.ts`.

### App Side — AI Summary Sync

- **On Create (POST):** Server auto-generates AI summary, returns in response, app captures and stores in SQLite
- **On Update (PUT):** If meeting notes changed, server auto-regenerates summary, app captures and updates SQLite
- **Display:** Visit detail screen shows `AISummaryPanel` component if `aiSummary` exists
- **Offline Support:** Summary is stored locally, visible even offline

### Server Side — AI Service (`server/src/services/ai.service.ts`)

**Model & Configuration:**
- **Provider:** Google Generative AI (Gemini)
- **Model:** `gemini-2.5-flash` (fast) — can be switched to `gemini-pro` for accuracy
- **Response Format:** JSON with markdown code block handling
- **Implementation:** Lazy-loads client when needed (ensures env vars loaded first)

**Function Signature:**
```typescript
export async function generateVisitSummary(visit: {
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: Date | string;
  rawNotes: string;
  outcomeStatus: string;
  nextFollowUpDate: Date | string | null;
}): Promise<AISummary>
```

**Key Features:**
- Accepts complete visit object (not just notes) for better context
- Formats dates and outcome status in human-readable form
- Includes `nextFollowUpDate` in prompt for contextual recommendations
- **Response Parser** handles markdown code blocks: `\`\`\`json {...}\`\`\``
- Validates JSON structure before returning
- Throws descriptive errors on parse failure

**Auto-Generation Triggers:**
- `POST /visits` — Creates visit AND generates summary
- `PUT /visits/:id` — Updates visit, regenerates summary if `rawNotes` changed (checks for content change)
- Graceful fallback: if AI generation fails, visit still created/updated successfully

### Server Side — Auto-Generation Flow

**In Controllers (`visits.controller.ts`):**

1. **Create Endpoint:**
   - Create visit via `visitService.createVisit()`
   - Try to generate summary via `generateVisitSummary(visit)`
   - If success: update visit with summary and return
   - If failure: still return visit (summary will be null), log warning

2. **Update Endpoint:**
   - Fetch original visit to check `rawNotes` change
   - Update visit via `visitService.updateVisit()`
   - If `rawNotes` changed: regenerate summary
   - If success: update visit with new summary
   - If failure: still return updated visit, log warning

**In Services (`ai.service.ts`):**
- Initialize Gemini client on first use (lazy loading)
- Build comprehensive prompt with all visit details
- Request strict JSON output
- Extract JSON from markdown code blocks if present
- Validate response structure
- Return structured `AISummary` object
- Save the generated summary to the Visit document in MongoDB

---

## SyncBadge Component (`src/components/SyncBadge.tsx`)

Display a coloured pill badge for sync status:

| Status | Label | Color |
|---|---|---|
| `draft` | Draft | `#8B8FA8` (grey) |
| `syncing` | Syncing… | `#F59E0B` (amber) |
| `synced` | Synced | `#10B981` (green) |
| `failed` | Sync Failed | `#EF4444` (red) |

---

## Sync Logic (`src/services/syncService.ts`)

### Server Routes (protected by `requireAuth`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/visits` | Fetch all visits for authenticated user |
| `POST` | `/visits` | Create a visit |
| `PUT` | `/visits/:id` | Update a visit |
| `DELETE` | `/visits/:id` | Delete a visit |
| `POST` | `/visits/:id/summary` | Generate AI summary |

### App-Side Sync Rules

- **Sync target:** custom Express server via `apiPost()` / `apiPut()` from `apiClient.ts`
- On sync attempt: set `syncStatus = 'syncing'` in SQLite and Zustand immediately (triggers UI update)
- For each pending visit: call `POST /visits` (new) or `PUT /visits/:id` (existing) with full visit payload
- On success: set `syncStatus = 'synced'`, update `updatedAt`
- On failure: set `syncStatus = 'failed'`, log error — never throw to the user silently
- `syncAll()` processes only visits where `syncStatus === 'draft' || syncStatus === 'failed'`
- Sync visits **sequentially**, not in parallel — avoids race conditions
- Check network via `@react-native-community/netinfo` before syncing — skip silently if offline
- Trigger `syncAll()` on app foreground via `AppState` listener in `App.tsx`
- Only sync visits where local `userId` matches the authenticated user

### MongoDB — Visit Model (`server/src/models/Visit.ts`)

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  userId: mongoose.Types.ObjectId;
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: Date;
  rawNotes: string;
  outcomeStatus: 'deal_closed' | 'follow_up_needed' | 'no_interest' | 'pending';
  nextFollowUpDate: Date | null;
  aiSummary: {
    meetingSummary: string;
    painPoints: string[];
    actionItems: string[];
    recommendedNextStep: string;
    generatedAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    location: { type: String, required: true },
    visitDateTime: { type: Date, required: true },
    rawNotes: { type: String, required: true },
    outcomeStatus: {
      type: String,
      enum: ['deal_closed', 'follow_up_needed', 'no_interest', 'pending'],
      required: true,
    },
    nextFollowUpDate: { type: Date, default: null },
    aiSummary: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
```

### MongoDB — User Model (`server/src/models/User.ts`)

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
```

---

## Visit Detail Screen (`src/screens/visits/VisitDetailScreen.tsx`)

Sections to display:

1. **Visit Info** — all fields from the Visit object, nicely formatted
2. **AI Summary Panel** — show `AISummaryPanel` component if `aiSummary` exists; show "Generate Summary" button if not
3. **Sync Status** — show `SyncBadge` + "Retry Sync" button if `syncStatus === 'failed'`
4. **Edit Button** — navigates to `EditVisitScreen` with `visitId` param

---

## AISummaryPanel Component (`src/components/AISummaryPanel.tsx`)

Render the four fields as distinct labelled sections:

- **Meeting Summary** — paragraph text
- **Pain Points** — bulleted list
- **Action Items** — numbered list
- **Recommended Next Step** — highlighted callout box

---

## Error Handling Rules

- Wrap all `async` functions in `try/catch`
- Never let errors propagate silently — always update state or show user feedback
- Network/API errors must show a non-blocking toast or inline message (not a crash)
- DB errors must be logged to console AND shown to the user

---

## Code Style Rules

- All components: functional, arrow function syntax
- No `any` types — use `unknown` and narrow explicitly
- No inline styles — use `StyleSheet.create()` for all RN styles
- All colors must come from `constants/colors.ts` — never hardcode hex values in components (except in `constants/colors.ts` itself and `SyncBadge.tsx` which is the source of truth for status colors)
- All date formatting must go through `src/utils/dateHelpers.ts`
- Use `useCallback` and `useMemo` only where re-render cost is real and measurable — do not overuse
- No default exports from `src/store/`, `src/services/`, or `src/utils/` — named exports only
- Screen components in `src/screens/` use default exports

---

## Environment Variables

### Mobile App (`app/.env`)

Use `react-native-config`. Access via `Config.KEY`.

```env
API_BASE_URL=http://10.0.2.2:3000
```

> Use `10.0.2.2` to reach localhost from an Android emulator. Use your machine's local IP for a physical device.

### Server (`server/.env`)

Use `dotenv`. Access via `process.env.KEY`.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-sales-visit-logger
JWT_SECRET=your_strong_random_secret_here
GOOGLE_GENERATIVE_AI_KEY=your_gemini_api_key_here
```

Both folders must have a `.env.example` with the same keys but no values. Both `.env` files must be in `.gitignore`.

---

## README Requirements

Each folder (`app/` and `server/`) must have its own README.

### App README
1. Prerequisites (Node.js, npm, Android Studio, Android SDK, ADB)
2. Installation (`npm install`)
3. Android SDK `local.properties` setup
4. Configure `.env` — set `API_BASE_URL`
5. Run on Android (`npx react-native run-android`)

### Server README
1. Prerequisites (Node.js, npm, MongoDB running locally)
2. Installation (`npm install`)
3. Configure `.env` — all four keys
4. Start dev server (`npm run dev`)
5. API endpoint reference table

### Shared Architecture Notes (can be in root or server README)
- Data flow: App → SQLite (local) → Express API → MongoDB
- AI flow: App creates/updates visit → server auto-generates summary via Gemini → returns with response → app stores locally
- Auth flow: JWT issued by server, stored in keychain, sent as Bearer token on every request
- Sync approach: Auto-triggered on: network online, app foreground, new draft visits detected (500ms batching)

---

## What NOT to Do

- Do not use `redux`, `mobx`, or `react-query`
- Do not use `axios` — use `apiGet` / `apiPost` / `apiPut` / `apiDelete` from `apiClient.ts`
- Do not use any CSS-in-JS library
- Do not store the auth token in `AsyncStorage` — use `react-native-default-preference`
- Do not call the Google Generative AI API from the mobile app — server only
- Do not put `GOOGLE_GENERATIVE_AI_KEY` or `JWT_SECRET` in the React Native app — server env only
- Do not skip validation on the follow-up date conditional rule
- Do not hardcode mock data as the default state — start with an empty list
- Do not use Supabase, Firebase, or any BaaS — the Express server is the only backend
- Do not call Mongoose models from controllers — use the service layer
- Do not call repositories from controllers — always go through a service
- Do not call `res.json()` with a raw object in controllers — always use `sendSuccess` / `sendError`
- Do not call `fetch` directly in the app — always use `apiClient.ts` wrappers
- Do not add business logic to repositories — repositories are DB-only

---

## Checklist Before Considering a Feature Complete

- [ ] TypeScript compiles with no errors in both `app/` and `server/` (`tsc --noEmit`)
- [ ] All form fields validate correctly, including conditional follow-up date rule
- [ ] Visit is saved to SQLite before any network call is attempted
- [ ] Sync status updates are reflected in both SQLite and Zustand store
- [ ] AI summary auto-generates on server (no manual trigger needed)
- [ ] AI summary is saved to MongoDB and returned to app on POST/PUT
- [ ] App captures aiSummary from sync responses and stores in SQLite
- [ ] AI summary displays correctly in visit details screen
- [ ] App works fully offline (create, edit, view — no crashes without internet)
- [ ] Session persists after closing and reopening the app
- [ ] Retry sync works from the Visit Detail screen
- [ ] JWT is validated on every protected server route
- [ ] Visits are scoped to the authenticated user on both app and server
- [ ] All server responses use `sendSuccess` / `sendError` shape
- [ ] No Mongoose calls exist outside `repositories/`
- [ ] No business logic exists in `repositories/` or `controllers/`
- [ ] No raw `fetch` calls exist in the app outside `apiClient.ts`
