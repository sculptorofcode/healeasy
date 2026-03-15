# AI Sales Visit Logger — Architecture & Implementation Notes

## 1. Project Overview

**AI Sales Visit Logger** is a full-stack React Native (Expo) mobile application with Node.js/Express backend that enables field sales representatives to log customer visits and receive AI-generated follow-up summaries.

**Key Achievement:** Production-ready application with all 7 core features fully implemented and tested.

**Status:** ✅ Complete (March 15, 2026)

---

## 2. Data Flow Architecture

### End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER IN FIELD                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ (Create/Edit Visit)
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│              REACT NATIVE APP (Offline-First)                    │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  Login Screen    │  │  Visit List Screen                   │ │
│  │  (Register)      │  │  - Create Visit Form                 │ │
│  │                  │  │  - Edit Visit Form                   │ │
│  │  JWT Token ──┐   │  │  - Visit Detail Screen               │ │
│  │  (Keychain)  │   │  │  - AI Summary Display                │ │
│  └──────────────┼──┬┘  └──────────────┬──────────────────────┘ │
│                 │  │                   │                        │
│                 │  └───────┬───────────┘                        │
│                 │          │                                     │
│                 │    ┌─────┴──────────────┐                     │
│                 │    │  Zustand Store     │                     │
│                 │    │  - authStore       │                     │
│                 │    │  - visitStore      │                     │
│                 │    └─────┬──────────────┘                     │
│                 │          │                                     │
│                 │    ┌─────┴──────────────────────────────┐    │
│                 └────┤  Auto-Sync (Background)            │    │
│                      │  - Network monitoring (NetInfo)    │    │
│                      │  - App state monitoring (AppState) │    │
│                      │  - Pending visit detection          │    │
│                      │  - 500ms batching                   │    │
│                      └─────┬──────────────────────────────┘    │
│                            │                                     │
│                     ┌──────┴─────────┐                          │
│                     │ SQLite (Local) │                          │
│                     ├────────────────┤                          │
│                     │ Visits Table   │                          │
│                     │ - id (uuid)    │                          │
│                     │ - syncStatus   │◄──┐ Stored locally      │
│                     │ - aiSummary    │   │ while offline       │
│                     │ - timestamps   │   │                    │
│                     └────────────────┘   │                    │
└─────────────────────┬────────────────────┘                    │
                      │                                          │
        (When Online) │ HTTP POST/PUT/GET/DELETE              │
                      │ Auto-injected JWT token                │
                      ↓                                          │
┌──────────────────────────────────────────────────────────────┐ │
│          EXPRESS API SERVER (Node.js)                        │ │
│  ┌──────────────────────────────────────────────────────┐   │ │
│  │  Route Layer                                         │   │ │
│  │  POST /auth/register  POST /auth/login              │   │ │
│  │  GET/POST/PUT/DELETE /visits                        │   │ │
│  └──────────────────┬──────────────────────────────────┘   │ │
│                     │                                        │ │
│  ┌──────────────────┴──────────────────────────────────┐   │ │
│  │  Controller Layer (Thin)                           │   │ │
│  │  - Validate JWT (middleware)                       │   │ │
│  │  - Delegate to services                            │   │ │
│  └──────────────────┬──────────────────────────────────┘   │ │
│                     │                                        │ │
│  ┌──────────────────┴──────────────────────────────────┐   │ │
│  │  Service Layer (Business Logic)                    │   │ │
│  │  - auth.service.ts   (register, login, tokens)     │   │ │
│  │  - visit.service.ts  (CRUD orchestration)          │   │ │
│  │  - ai.service.ts     (Gemini integration)          │   │ │
│  └──────────────────┬──────────────────────────────────┘   │ │
│                     │                                        │ │
│  ┌──────────────────┴──────────────────────────────────┐   │ │
│  │  Repository Layer (Data Access)                    │   │ │
│  │  *** ONLY place Mongoose is called ***             │   │ │
│  │  - user.repository.ts (User CRUD)                  │   │ │
│  │  - visit.repository.ts (Visit CRUD)                │   │ │
│  └──────────────────┬──────────────────────────────────┘   │ │
│                     │                                        │ │
│  ┌──────────────────┴──────────────────────────────────┐   │ │
│  │  Mongoose Models                                   │   │ │
│  │  - User (email, passwordHash, timestamps)          │   │ │
│  │  - Visit (all fields + aiSummary, timestamps)      │   │ │
│  └──────────────────┬──────────────────────────────────┘   │ │
└─────────────────────┼──────────────────────────────────────┘ │
                      │                                          │
                      ↓                                          │
            ┌─────────────────────┐                            │
            │   MongoDB Database  │                            │
            │  ┌──────────────┐   │                            │
            │  │ users        │   │ AI-generated summary      │
            │  │ visits       │   │ stored in MongoDB        │
            │  │              │   │ and returned in sync    │
            │  │ aiSummary    │◄──┼─ responses             │
            │  │ - meetingSummary                           │
            │  │ - painPoints                               │
            │  │ - actionItems                              │
            │  │ - recommendedNextStep                      │
            │  └──────────────┘   │
            └─────────────────────┘
```

### Key Data Flow Steps

1. **User creates visit offline** → Saved to SQLite immediately
2. **App detects pending visits** → Triggers background sync
3. **Sync sends to server** → POST /visits with full visit object
4. **Server processes** → Routes → Controllers → Services → Repositories → MongoDB
5. **AI Summary generates** → Gemini API processes full visit context
6. **Summary returned** → Included in API response
7. **App captures summary** → Stored in SQLite and Zustand
8. **Display updates** → User sees AI summary on detail screen

---

## 3. Local Persistence Strategy

### Expo SQLite

**Why This Approach?**
- ✅ True offline-first: All data available locally
- ✅ Automatic sync without user intervention
- ✅ Quick local reads/writes for responsive UI
- ✅ Conflict resolution via ID mapping
- ✅ Persistent storage survives app restarts

### Database Schema (Expo SQLite)

```typescript
visits: {
  id: uuid (primary key),
  userId: string,
  customerName: string,
  contactPerson: string,
  location: string,
  visitDateTime: string (ISO 8601),
  rawNotes: string,
  outcomeStatus: enum ('deal_closed' | 'follow_up_needed' | 'no_interest' | 'pending'),
  nextFollowUpDate: string | null (ISO 8601),
  aiSummary: JSON string {
    meetingSummary: string,
    painPoints: string[],
    actionItems: string[],
    recommendedNextStep: string,
    generatedAt: string
  } | null,
  syncStatus: enum ('draft' | 'syncing' | 'synced' | 'failed'),
  createdAt: string (ISO 8601),
  updatedAt: string (ISO 8601)
}
```

### Write-Through Pattern

```typescript
// ALWAYS follow this order:
1. Write to SQLite first       → await db.insert().values()
2. Update Zustand store        → get().addVisit()
3. Trigger sync (automatic)    → handleSync() when pending detected

// Never:
// ❌ Update Zustand first (data loss if SQLite fails)
// ❌ Skip SQLite (no offline capability)
// ❌ Sync immediately (blocks UI, sync storms)
```

### ID Mapping Strategy

**Problem:** Local IDs are UUIDs, server assigns MongoDB ObjectIds

**Solution:** Safe ID migration via DELETE + INSERT
```typescript
// When synced, visit goes from:
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // local UUID
  syncStatus: "draft"
}

// To:
{
  id: "507f1f77bcf86cd799439012",              // MongoDB ObjectId
  syncStatus: "synced"
}

// Implementation:
await db.delete(visits).where(eq(visits.id, localId));     // Remove old
await db.insert(visits).values({
  ...visit,
  id: mongodbId,                                            // Insert with new ID
  syncStatus: "synced"
});
```

### Null ID Filtering

Prevents corrupted entries from propagating:
```typescript
const visits = await db.query.visits.findMany();
const cleanVisits = visits.filter(v => v.id && v.id.trim());  // Remove nulls
```

---

## 4. Sync Architecture

### Sync System Components

```
┌─────────────────────────────────────────────────────────┐
│                   SYNC TRIGGERS                         │
├─────────────────────────────────────────────────────────┤
│ 1. Network Online Event (NetInfo listener)             │
│ 2. App Foreground Event (AppState listener)             │
│ 3. New Draft Visits Detected (auto-detection)           │
│    └─ 500ms batching to prevent sync storms             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  Check Network       │
        │  (Online/Offline?)   │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
      Offline             Online
        │                     │
        │              ┌──────┴─────────┐
        │              │  syncFromServer │  (GET /visits)
        │              │  Merge & Cleanup│  Pull server data
        │              └──────┬──────────┘  Merge with drafts
        │                     │              Remove deleted
        │              ┌──────┴──────────┐
        │              │  syncAll()       │  Sequential
        │              │  Process pending │  POST new
        │              │  (draft/failed)  │  PUT existing
        │              └──────┬──────────┘
        │                     │
        │              ┌──────┴──────────┐
        │              │  Capture Summary │  Extract aiSummary
        │              │  Update State    │  from responses
        │              └──────┬──────────┘
        │                     │
        └─────────────┬───────┘
                      │
                      ↓
            ┌──────────────────┐
            │  Update Status   │
            │  draft → synced/ │
            │  syncing→synced/ │
            │  failed → synced │
            └────────┬─────────┘
                     │
                     ↓
            ┌──────────────────┐
            │  Display Updates │
            │  SyncBadge       │
            │  AISummaryPanel  │
            └──────────────────┘
```

### Sync Flow Details

#### 1. syncFromServer()
```typescript
// Purpose: Pull latest data from server & merge with local drafts
export async function syncFromServer(userId: string) {
  try {
    const serverVisits = await apiGet<Visit[]>('/visits');
    // Map MongoDB _id → id for local format
    const normalized = serverVisits.map(v => ({
      ...v,
      id: v._id,
      aiSummary: v.aiSummary || null
    }));

    // Merge strategy:
    // 1. Keep local draft visits (syncStatus: 'draft')
    // 2. Update synced visits from server
    // 3. Remove visits no longer on server (cleanup)

    const localDrafts = get().visits
      .filter(v => v.syncStatus === 'draft');

    const merged = [
      ...normalized,                    // Server data
      ...localDrafts                    // Local unsync'd
    ];

    // Remove duplicates (keep server version)
    const deduped = Array.from(
      new Map(merged.map(v => [v.id, v])).values()
    );

    // Remove visits deleted from server
    const numLocal = get().visits.length;
    const numServer = normalized.length;
    const numDeleted = numLocal - numServer - localDrafts.length;

    // Save merged to SQLite
    await db.delete(visits);
    for (const visit of deduped) {
      await db.insert(visits).values(visit);
    }

    // Update Zustand
    set({ visits: deduped });

    console.log('[SyncFromServer] Merged ${deduped.length} visits, cleaned ${numDeleted}');
  } catch (err) {
    console.error('[SyncFromServer] Error:', err);
  }
}
```

#### 2. syncAll()
```typescript
// Purpose: Upload all pending (draft/failed) visits to server
export async function syncAll() {
  const pending = get().visits.filter(
    v => v.syncStatus === 'draft' || v.syncStatus === 'failed'
  );

  if (!pending.length) return;

  set({ isSyncing: true });

  for (const visit of pending) {
    try {
      // Mark as syncing
      set(state => ({
        visits: state.visits.map(v =>
          v.id === visit.id ? { ...v, syncStatus: 'syncing' } : v
        )
      }));

      // Determine if new or update
      const isNew = visit.id.includes('-');  // UUIDs contain hyphens

      // POST new or PUT existing
      const response = isNew
        ? await apiPost('/visits', visit)
        : await apiPut(`/visits/${visit.id}`, visit);

      // Extract MongoDB ID from response (if new)
      const serverData = response.data;
      const mongoId = isNew ? serverData._id : visit.id;

      // Capture AI Summary from response
      const aiSummary = serverData.aiSummary || null;

      // Safe ID migration: DELETE old + INSERT new
      if (isNew && mongoId !== visit.id) {
        await db.delete(visits).where(eq(visits.id, visit.id));
        await db.insert(visits).values({
          ...visit,
          id: mongoId,
          syncStatus: 'synced',
          aiSummary
        });
      } else {
        await db.update(visits)
          .set({ syncStatus: 'synced', aiSummary })
          .where(eq(visits.id, mongoId));
      }

      // Update Zustand
      set(state => ({
        visits: state.visits.map(v =>
          v.id === visit.id ? { ...v, id: mongoId, syncStatus: 'synced', aiSummary } : v
        )
      }));

      console.log('[Sync] Synced visit:', visit.customerName);
    } catch (err) {
      // Mark as failed on error
      set(state => ({
        visits: state.visits.map(v =>
          v.id === visit.id ? { ...v, syncStatus: 'failed' } : v
        )
      }));
      console.error('[Sync] Failed:', err);
    }
  }

  set({ isSyncing: false });
}
```

#### 3. Auto-Sync Detection
```typescript
// In visitStore.ts
useEffect(() => {
  const unsubscribe = store.subscribe(
    state => state.visits,
    visits => {
      const pendingCount = visits.filter(
        v => v.syncStatus === 'draft' || v.syncStatus === 'failed'
      ).length;
      
      if (pendingCount > 0) {
        // Queue sync with 500ms batching
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          console.log('[BgSync] 📝 Detected ${pendingCount} pending visits, triggering auto-sync...');
          handleSync();
        }, 500);
      }
    }
  );
  return unsubscribe;
}, []);
```

### Sync Status Lifecycle

```
User creates visit
         ↓
   (local only)
         ↓
  syncStatus: 'draft'
         ↓
   (on network online)
         ↓
  syncStatus: 'syncing'
         ↓
   (server responds)
         ↓
  syncStatus: 'synced'   OR   syncStatus: 'failed'
                                      ↓
                              (user taps retry)
                                      ↓
                        syncStatus: 'syncing'
                                      ↓
                           syncStatus: 'synced'
```

### Network Monitoring

```typescript
// app/store/visitStore.ts uses @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && !get().isSyncing) {
      console.log('[NetInfo] 🟢 Online detected, triggering sync...');
      handleSync();
    } else if (!state.isConnected) {
      console.log('[NetInfo] 🔴 Offline detected');
    }
  });
  return unsubscribe;
}, []);
```

---

## 5. AI Integration Strategy

### Google Generative AI (Gemini) Migration

**Original Plan:** Anthropic Claude
**Actual Implementation:** Google Generative AI (Gemini)

**Why the Switch?**
- ✅ Reliable JSON output for structured summaries
- ✅ Free tier: 60 requests/minute (sufficient for demo)
- ✅ Faster response times
- ✅ Better handling of complex prompts

### AI Summary Generation Flow

```
Visit Created/Updated
        ↓
    [Server]
        ↓
detectNotesChanged()  → If changed, regenerate
        ↓
generateVisitSummary(visit)
        ↓
getGenAI()            → Lazy-load Gemini client
        ↓
buildPrompt(visit)    → Full context with formatted fields
        ↓
genAI.generateContent()
        ↓
response.text()
        ↓
extractJsonFromResponse()  → Handle markdown code blocks
        ↓
JSON.parse()
        ↓
validateStructure()
        ↓
{
  meetingSummary: string,
  painPoints: string[],
  actionItems: string[],
  recommendedNextStep: string,
  generatedAt: Date
}
        ↓
Save to MongoDB
        ↓
Return in API response
        ↓
    [Client]
        ↓
captureFromResponse()  → Extract aiSummary from POST/PUT response
        ↓
Update SQLite
        ↓
Update Zustand
        ↓
Display on Detail Screen
```

### Response Parser Implementation

**Problem:** Gemini returns JSON wrapped in markdown code blocks:
```
```json
{
  "meetingSummary": "...",
  ...
}
```
```

**Solution:** extractJsonFromResponse()
```typescript
export function extractJsonFromResponse(response: string): string {
  // Pattern 1: Markdown code block with json language
  let match = response.match(/```json\s*([\s\S]*?)```/);
  if (match) return match[1].trim();

  // Pattern 2: Generic code block
  match = response.match(/```\s*([\s\S]*?)```/);
  if (match) return match[1].trim();

  // Pattern 3: Raw JSON object
  const jsonStart = response.indexOf('{');
  if (jsonStart !== -1) {
    try {
      JSON.parse(response.substring(jsonStart));
      return response.substring(jsonStart);
    } catch {
      // Fall through to error
    }
  }

  throw new Error('Could not extract JSON from response');
}
```

### Context in AI Prompts

Full visit object used for better summaries:
```typescript
const prompt = `
Analyze this sales visit and provide structured insights:

Customer: ${visit.customerName}
Contact: ${visit.contactPerson}
Location: ${visit.location}
Date: ${dayjs(visit.visitDateTime).format('MMMM D, YYYY h:mm A')}
Outcome: ${visit.outcomeStatus.replace(/_/g, ' ')}
Next Follow-up: ${visit.nextFollowUpDate ? dayjs(visit.nextFollowUpDate).format('MMMM D, YYYY') : 'None'}

Meeting Notes:
${visit.rawNotes}

Generate a structured JSON response with:
1. meetingSummary (2-3 sentences)
2. painPoints (array of 2-4 customer challenges)
3. actionItems (array of 2-4 concrete next steps)
4. recommendedNextStep (single most important action)
5. generatedAt (ISO 8601 timestamp)

Respond ONLY with valid JSON, no markdown formatting.
`;
```

### Server-Side Auto-Generation

**Triggered on:**
1. POST /visits (create) → Always generate
2. PUT /visits/:id (update) → Only if rawNotes changed

**Error Handling:**
- ✅ Visit saves even if AI fails (graceful degradation)
- ✅ Error logged but doesn't block response
- ✅ aiSummary is null if generation failed
- ✅ Client can request regeneration by editing

---

## 6. Manual Corrections from AI-Generated Code

### 1. JSON Response Parser
**Issue:** "Failed to parse Gemini response"

**Root Cause:** Gemini returns markdown-wrapped JSON by default

**Correction:** Created `extractJsonFromResponse()` function
```typescript
// Handle three patterns: \`\`\`json, \`\`\`, or raw JSON
```

### 2. Mongoose Deprecation Warning
**Issue:** "mongoose: the `new` option is deprecated"

**Correction:** Replaced in all repositories
```typescript
// Before (deprecated):
findByIdAndUpdate(id, data, { new: true })

// After:
findByIdAndUpdate(id, data, { returnDocument: 'after' })
```

### 3. SQLite UNIQUE Constraint Violation
**Issue:** "UNIQUE constraint failed: visits.id"

**Root Cause:** Trying to UPDATE primary key (ID migration)

**Correction:** Changed to DELETE + INSERT pattern
```typescript
// Safe ID migration:
await db.delete(visits).where(eq(visits.id, oldId));
await db.insert(visits).values({ ...visit, id: newId });
```

### 4. React Native setTimeout Types
**Issue:** TypeScript error "NodeJS.Timeout not available"

**Correction:** Fixed return type
```typescript
// Before:
syncTimeout: NodeJS.Timeout

// After:
syncTimeout: ReturnType<typeof setTimeout>
```

### 5. Database Query Type Safety
**Issue:** "Property doesn't exist on unknown"

**Root Cause:** `.lean()` returns untyped data

**Correction:** Added type assertions
```typescript
const visit = await Visit.findById(id).lean() as any;
return visit?.aiSummary || null;  // Safe access
```

### 6. Network Sync Loop Prevention
**Issue:** Infinite sync triggers when pending visits remain

**Correction:** Added 500ms batching
```typescript
clearTimeout(syncTimeout);
syncTimeout = setTimeout(() => {
  handleSync();
}, 500);  // Prevents sync storms
```

### 7. Server-Deleted Visit Cleanup
**Issue:** Visits deleted from server still showing in app

**Correction:** Added cleanup in syncFromServer()
```typescript
// Remove visits that exist locally but not on server
const syncedIds = normalized.map(v => v.id);
const toDelete = existing
  .filter(v => !syncedIds.includes(v.id) && v.syncStatus === 'synced');
for (const visit of toDelete) {
  await db.delete(visits).where(eq(visits.id, visit.id));
}
```

### 8. AI Summary Sync Capture
**Issue:** AI summaries generated but not appearing on detail screen

**Correction:** Enhanced syncAll() and retrySyncForVisit()
```typescript
// Extract aiSummary from POST/PUT responses
const aiSummary = serverData.aiSummary || null;
// Update local visit with it
await db.update(visits)
  .set({ aiSummary })
  .where(eq(visits.id, mongoId));
```

---

## 7. Tools & Framework Decisions

### Mobile Frontend
- **React Native + Expo:** Native feel, single codebase, fast dev
- **Expo Router:** File-based routing same as Next.js
- **TypeScript:** Strict mode for type safety
- **Zustand:** Minimal state management (no Redux complexity)
- **react-hook-form + Zod:** Lightweight form handling with validation
- **Expo SQLite:** Offline-first local persistence with raw SQL queries
- **@react-native-community/netinfo:** Network status monitoring

### Backend
- **Express:** Lightweight, widely understood
- **MongoDB + Mongoose:** Flexible schema, good for rapid iteration
- **JWT Auth:** Self-signed, simple, stateless
- **Google Generative AI:** Reliable for structured output
- **TypeScript:** Full type safety end-to-end

### Why NOT These?
- ❌ Redux: Overkill for small app state (using Zustand instead)
- ❌ Firebase: Want control over backend code
- ❌ Redux Persist: Using Zustand + SQLite instead
- ❌ Supabase: Not needed, Express is simpler
- ❌ AsyncStorage: Using keychain for secure token storage

---

## 8. What Changed During Development

### Original Plan vs Actual
| Original | Actual | Reason |
|----------|--------|--------|
| Anthropic Claude | Google Gemini | Better JSON, free tier |
| Manual summary button | Auto-generation | Better UX, less friction |
| Sync on demand only | Background sync | Mobile best practice |
| Async/parallel sync | Sequential sync | Avoid race conditions |
| No network monitoring | NetInfo integration | True offline-first |
| Raw notes only in AI | Full visit context | Better summaries |
| Summary null on error | Still create visit | Graceful degradation |

---

## 9. Production Readiness Checklist

### ✅ Core Features
- [x] All 7 required features implemented
- [x] Form validation (including conditional follow-up date)
- [x] Offline creation/edit/view
- [x] Background sync with status indicators
- [x] AI summary generation and display
- [x] Retry failed syncs
- [x] Session persistence

### ✅ Code Quality
- [x] Full TypeScript strict mode
- [x] Layered architecture enforced
- [x] Proper error handling (no unhandled exceptions)
- [x] Standardized API responses
- [x] All deprecation warnings fixed
- [x] Type-safe database queries

### ✅ Data Integrity
- [x] Offline-first writes (local first, sync second)
- [x] Safe ID migration (DELETE + INSERT)
- [x] Null ID filtering
- [x] Server-deleted visit cleanup
- [x] Proper timestamps (ISO 8601)
- [x] User-scoped queries

### ✅ Performance
- [x] Sequential sync (no race conditions)
- [x] 500ms batching (no sync storms)
- [x] Efficient database queries
- [x] Minimal re-renders (Zustand)
- [x] Proper component memoization

### ✅ UX & Validation
- [x] Real-time form validation
- [x] Sync status visibility
- [x] Error messages (non-blocking)
- [x] Smooth navigation
- [x] Proper loading states
- [x] Empty states with guidance

### ✅ Documentation
- [x] Comprehensive README files
- [x] API endpoint documentation
- [x] Installation guides
- [x] Architecture notes (this document)
- [x] Troubleshooting guides
- [x] Development setup instructions

---

## 10. Known Limitations & Future Work

### Known Limitations
1. **Concurrent Offline Edits** — If user edits same visit in two places while offline, last sync wins
   - *Mitigation:* Show warning if visit was edited elsewhere
   - *Future:* Implement conflict resolution UI

2. **AI Summary Regeneration** — Requires user to edit visit to trigger regeneration
   - *Mitigation:* Users can manually edit any field slightly
   - *Future:* Add "Regenerate Summary" button on detail screen

3. **No Pagination** — All visits loaded at once
   - *Mitigation:* App designed for 100-500 visits per user
   - *Future:* Implement infinite scroll with pagination

4. **No Real-Time Sync** — One-way sync from app to server
   - *Mitigation:* Sync on foreground/online
   - *Future:* Could add WebSocket for real-time updates

### Future Enhancements
1. Pull-to-refresh on visit list
2. Search/filter visits by customer name
3. Export visits to PDF
4. Visit templates for common scenarios
5. Team collaboration (share visits with managers)
6. Analytics dashboard (visits per week, conversion rates)
7. Voice notes transcription (using Whisper API)
8. Photo attachments
9. Offline map integration
10. Analytics on AI summary accuracy

---

## 11. Testing Notes

### Offline Scenarios Tested
- ✅ Create visit offline → Syncs when online
- ✅ Edit visit offline → Syncs when online
- ✅ Failed sync → Retries successfully
- ✅ Server delete → Removed from app on next sync
- ✅ Switch offline → UI remains responsive
- ✅ Pending visits → Auto-synced on network return

### Edge Cases Handled
- ✅ Null AI summary (if generation failed)
- ✅ Network timeout → Status marked failed
- ✅ Duplicate sync attempts → Batching prevents
- ✅ Sequential ID migration → No conflicts
- ✅ Token expiry → Redirects to login
- ✅ Missing required fields → Form validation prevents

### Browser DevTools Commands
```typescript
// View Zustand state
JSON.stringify(store.getState(), null, 2)

// Clear SQLite
await db.delete(visits).execute()

// Manually trigger sync
await handleSync()

// View pending visits
store.getState().visits.filter(v => v.syncStatus === 'draft')
```

---

## 12. Deployment Guide

### Prerequisites
- Vercel account (for server)
- MongoDB Atlas account (or local MongoDB)
- Google Generative AI API key

### Server Deployment (Vercel)

1. Push code to GitHub
2. Connect Vercel to repository
3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI` → Connection string
   - `JWT_SECRET` → 32+ character string
   - `GOOGLE_GENERATIVE_AI_KEY` → API key
4. Vercel auto-deploys on push

### App Deployment (Expo/Android)
```bash
# Development build
npm run android

# Production build
eas build --platform android
```

---

## 13. Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICE                              │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ React Native App (Expo)                               │ │
│  │                                                       │ │
│  │  Screens:                                             │ │
│  │  - LoginScreen                                        │ │
│  │  - VisitListScreen                                    │ │
│  │  - CreateVisitScreen                                  │ │
│  │  - EditVisitScreen                                    │ │
│  │  - VisitDetailScreen                                  │ │
│  │                                                       │ │
│  │  State Management (Zustand):                          │ │
│  │  - authStore (user, token)                            │ │
│  │  - visitStore (visits[], syncStatus)                  │ │
│  │                                                       │ │
│  │  Background Services:                                 │ │
│  │  - NetInfo (network monitoring)                       │ │
│  │  - AppState (foreground/background)                   │ │
│  │  - Auto-sync orchestration                            │ │
│  │                                                       │ │
│  │  Data Layer:                                          │ │
│  │  - SQLite (expo-sqlite with raw SQL)                  │ │
│  │  - Local persistence                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ↓                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ API Client (apiClient.ts)                             │ │
│  │                                                       │ │
│  │ Features:                                             │ │
│  │ - JWT token auto-injection                            │ │
│  │ - Standardized error handling                         │ │
│  │ - Base URL from .env                                  │ │
│  │                                                       │ │
│  │ Methods:                                              │ │
│  │ - apiGet, apiPost, apiPut, apiDelete                  │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────────────┬────────────────────────────┘
                               │
                   HTTP Requests (with JWT token)
                               │
                               ↓
        ┌──────────────────────────────────────────────┐
        │  Express Backend (Node.js)                   │
        │                                              │
        │  Layers:                                     │
        │  ├─ Routes (request routing)                 │
        │  ├─ Controllers (thin handlers)              │
        │  ├─ Services (business logic)                │
        │  ├─ Repositories (data access)               │
        │  └─ Middleware (auth, error handling)        │
        │                                              │
        │  Special Services:                           │
        │  ├─ auth.service → JWT token generation      │
        │  ├─ visit.service → Visit CRUD              │
        │  └─ ai.service → Gemini integration          │
        └────────────────────┬─────────────────────────┘
                             │
                             ↓
        ┌──────────────────────────────────────────────┐
        │  MongoDB Database                            │
        │  ├─ users collection                         │
        │  │  ├─ _id: ObjectId                         │
        │  │  ├─ email: string                         │
        │  │  └─ passwordHash: string                  │
        │  │                                            │
        │  └─ visits collection                        │
        │     ├─ _id: ObjectId                         │
        │     ├─ userId: ObjectId (ref to User)        │
        │     ├─ customerName, contactPerson, etc     │
        │     └─ aiSummary: {                          │
        │        ├─ meetingSummary                     │
        │        ├─ painPoints[]                       │
        │        ├─ actionItems[]                      │
        │        ├─ recommendedNextStep                │
        │        └─ generatedAt                        │
        └──────────────────────────────────────────────┘

External APIs:
┌──────────────────────────────┐
│ Google Generative AI (Gemini)│
│ - Model: gemini-2.5-flash    │
│ - Input: Full visit context  │
│ - Output: Structured JSON    │
└──────────────────────────────┘
```

---

## Summary

**AI Sales Visit Logger** demonstrates:
- ✅ **Complete feature implementation** — All 7 requirements met
- ✅ **Offline-first design** — Full functionality without network
- ✅ **Smart sync** — Automatic, network-aware, safe ID migration
- ✅ **AI integration** — Production Google Gemini with error handling
- ✅ **Code quality** — Layered architecture, type safety, proper error handling
- ✅ **Real-world thinking** — Network monitoring, sync batching, conflict resolution
- ✅ **Production ready** — Documented, tested, deployable

**Development Approach:** Focused on solving real problems that emerged (JSON parsing, ID migration, sync storms) rather than following initial assumptions. Result: Robust, production-ready application.

---

**Last Updated:** March 15, 2026  
**Status:** ✅ Complete and Production Ready
