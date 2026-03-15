# AI Sales Visit Logger - Mobile App

React Native (Expo) mobile app for field sales reps to log customer visits with AI-assisted summaries. Features offline-first design with local SQLite storage, background sync, and Google Generative AI integration.

## ✨ Features

- **Authentication** — Secure login/registration with JWT tokens, persistent sessions
- **Visit Management** — Create, edit, and view customer visits offline
- **Local Storage** — SQLite database with Expo SQLite for offline-first design
- **Background Sync** — Automatic sync to backend with network monitoring
- **AI Summaries** — Google Gemini-powered structured summaries (meeting synopsis, pain points, action items, recommendations)
- **Sync Status** — Real-time status indicators (draft/syncing/synced/failed) with retry capability
- **Form Validation** — Real-time validation with conditional field rules
- **Full Offline Support** — All features work without internet connection

## 🛠️ Prerequisites

- **Node.js** (v16+) and npm
- **Android Studio** with Android emulator (or physical Android device)
- **Expo CLI**: `npm install -g expo-cli`
- **Java Development Kit (JDK)** (for Android development)
- **Android SDK** (downloaded via Android Studio)

### For iOS (optional)
- **Xcode** (macOS only)
- **CocoaPods**

## 📦 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd healeasy/app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the `app/` directory:
```env
API_BASE_URL=http://10.0.2.2:3000
```

> **Note for Android Emulator:** Use `10.0.2.2` to reach localhost from the Android emulator. For a physical device, use your machine's local IP address (e.g., `http://192.168.x.x:3000`).

Copy from `.env.example`:
```bash
cp .env.example .env
```

### 4. Android Setup (Required)

Ensure `android/local.properties` exists with correct SDK path:
```properties
sdk.dir=/Users/username/Library/Android/sdk
```

Or on Windows:
```properties
sdk.dir=C:\\Users\\username\\AppData\\Local\\Android\\sdk
```

Android Studio can generate this automatically when opening the `android/` folder.

## 🚀 Running the App

### Start Development Server
```bash
npm start
```

Or with Expo:
```bash
npx expo start
```

### Run on Android Emulator
```bash
npm run android
```

Or in the Expo CLI, press `a` when the dev server is running.

### Run on Physical Device
1. Install **Expo Go** app on your Android/iOS device
2. In the running dev server output, scan the QR code with your device

### Clear Cache & Start Fresh
```bash
npm run reset-dev
```

## 📝 Project Structure

```
app/
├── app/                        # Expo Router pages
│   ├── _layout.tsx            # Root layout with navigation
│   ├── modal.tsx              # Modal route
│   ├── auth/                  # Auth screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (visits)/              # Visit screens
│       ├── index.tsx          # Visit list
│       ├── create.tsx         # Create visit
│       ├── [id].tsx           # Visit details
│       └── [id]/edit.tsx      # Edit visit
├── components/                # Reusable components
│   ├── VisitCard.tsx
│   ├── SyncBadge.tsx
│   ├── AISummaryPanel.tsx
│   ├── FormField.tsx
│   └── ui/                    # UI primitives
├── store/                     # Zustand state management
│   ├── authStore.ts
│   └── visitStore.ts
├── db/                        # Local SQLite database
│   └── client.ts              # Expo SQLite client with raw SQL
├── services/                  # API and business logic
│   ├── apiClient.ts           # Base fetch wrapper
│   ├── authService.ts
│   └── syncService.ts
├── types/                     # TypeScript types
│   └── index.ts
├── utils/                     # Utility functions
├── constants/                 # App constants
├── hooks/                     # Custom React hooks
└── assets/                    # Images, fonts, etc.
```

## 🔐 Authentication Flow

1. **Sign Up/Login** — Enter email and password on login screen
2. **Verify Credentials** — App calls `POST /auth/login` (or `POST /auth/register`)
3. **Store JWT Token** — Token stored securely in device keychain via `react-native-default-preference`
4. **Restore Session** — On app launch, app automatically restores session from stored token
5. **Auto-Logout** — If token is expired or missing, redirects to login

### Account for Testing
```
Email: test@example.com
Password: password123
```

Or create your own account via the signup screen.

## 📱 Key Screens

### 1. Login / Sign Up
- Email validation
- Password strength requirements
- Session persistence

### 2. Visit List
- Shows all visits sorted by date (newest first)
- Displays customer name, visit date/time, notes preview
- Shows sync status (draft/syncing/synced/failed)
- FAB (floating action button) to create new visit
- Pull-to-refresh to manually trigger sync

### 3. Create / Edit Visit
- Fields:
  - Customer Name
  - Contact Person
  - Location
  - Visit Date/Time
  - Raw Meeting Notes
  - Outcome Status (deal_closed, follow_up_needed, no_interest, pending)
  - Next Follow-up Date (required only when outcome is "follow_up_needed")
- Real-time validation feedback
- Save locally (works offline)

### 4. Visit Details
- Full visit information
- AI summary panel with:
  - Meeting Summary
  - Pain Points
  - Action Items
  - Recommended Next Step
- Sync status with retry button
- Edit button

## 🔄 Offline & Sync

### How It Works
1. **Create/Edit Offline** — Visit is saved to local SQLite immediately
2. **Set as Draft** — Sync status shows "Draft" (grey badge)
3. **Auto-Sync** — When online, app automatically syncs to server
4. **Status Updates** — Watch badge change: Draft → Syncing → Synced
5. **Visible Offline** — Edit/view visits anytime, even without internet

### Sync Triggers
- App comes back online
- App returns to foreground (from background)
- New draft visits detected

### Manual Sync
- Pull-to-refresh on visit list
- Tap "Retry Sync" on detail screen (if failed)

### Sync Failure
- If sync fails (network error), status shows "failed" (red badge)
- Tap "Retry Sync" to try again
- Original visit remains intact locally

## 🤖 AI Summaries

### Auto-Generation
- Summaries **automatically generate** when you create a visit
- Summaries **automatically regenerate** when you edit a visit's notes
- No manual action needed — happens in background during sync

### What You Get
For each meeting, the AI generates:
1. **Meeting Summary** — 2-3 sentence overview of the meeting
2. **Pain Points** — Identified customer challenges or objections
3. **Action Items** — Specific next steps to take
4. **Recommended Next Step** — Most important action to prioritize

### Example
```
Meeting Summary:
Discussed cost optimization opportunities for their operations.
Client is interested but has concerns about implementation timeline.

Pain Points:
- Limited IT resources for implementation
- Budget constraints for Q2
- Previous failed automation project

Action Items:
- Send detailed implementation roadmap
- Schedule follow-up call with IT director
- Prepare ROI analysis for automation

Recommended Next Step:
Send implementation roadmap by Friday and schedule follow-up call for next week.
```

## 🐛 Troubleshooting

### "API connection failed"
- **Check:** Server is running on http://localhost:3000
- **Check:** `API_BASE_URL` in `.env` is correct (use `10.0.2.2:3000` for emulator)
- **Check:** Mobile device can reach server (same network or accessible IP)

### "Cannot connect to MongoDB"
- This is a server error, not app issue
- Check server logs: `npm run dev` in server folder

### "Sync keeps failing"
- Check network connectivity (turn WiFi on/off)
- Check server logs for errors
- Tap "Retry Sync" manually
- If persists, restart app

### "Form validation error"
- Ensure follow-up date is set when outcome is "follow_up_needed"
- Ensure all required fields are filled
- Check for minimum character requirements

### "AI summary not showing"
- Ensure server is running (server must have `GOOGLE_GENERATIVE_AI_KEY` in .env)
- Summary generates automatically after visit is synced
- Check server logs for AI generation errors

### Emulator Connection Issues
```bash
# If connection fails, reset the emulator
adb -s <emulator-id> emu kill

# Or clear cache
npm run reset-dev
```

## 📚 Tech Stack

- **React Native** — Cross-platform mobile framework
- **Expo** — React Native development platform
- **TypeScript** — Static type safety
- **Expo Router** — File-based routing (like Next.js)
- **Expo SQLite** — Local persistent storage with raw SQL queries
- **Zustand** — State management
- **react-hook-form + Zod** — Form handling and validation
- **dayjs** — Date/time formatting
- **@react-native-community/netinfo** — Network status monitoring

## 🔗 Related Projects

- **Backend Server** — Check `../server/` directory
- **Full Architecture** — See `../ARCHITECTURE.md`
- **Demo Video** — See `../DEMO.md`

## 📖 Development Guide

### Adding a New Screen

1. Create `.tsx` file in `app/` directory
2. Export default component
3. Expo Router automatically routes based on filename
4. Use `useRouter()` hook for navigation

### Adding a New Component

1. Create `.tsx` file in `components/`
2. Export named component
3. Use in screens via `import { Component } from '@/components'`

### Writing to Database

Always follow this pattern:
```typescript
// 1. Write to SQLite first
await db.insert(visits).values(newVisit);

// 2. Update Zustand
store.addVisit(newVisit);

// 3. Sync in background (happens automatically)
```

### Calling Server API

Always use the API client:
```typescript
import { apiPost, apiGet } from '@/services/apiClient';

// Never use fetch directly
const response = await apiPost('/visits', visitData);
```

## 💡 Tips & Best Practices

- ✅ Always test offline (toggle WiFi/airplane mode)
- ✅ Watch console logs to see sync flow: `[Sync]`, `[BgSync]`, `[SyncFromServer]`
- ✅ Use `React DevTools` for state debugging
- ✅ Clear app cache if behavior seems stale: `npm run reset-dev`
- ✅ Use physical device for most realistic testing
- ❌ Don't hardcode API URLs — use `.env` file
- ❌ Don't call Google Gemini API directly — server handles all AI calls
- ❌ Don't store auth token in AsyncStorage — use keychain

## 🚀 Production Build

```bash
# Build for Android
eas build --platform android

# Or use development APK on emulator
npm run android
```

## 📞 Support

For issues, check:
1. App console logs (`npm start` terminal)
2. Server logs (`npm run dev` in server folder)
3. Architecture notes in `../ARCHITECTURE.md`
4. Assignment requirements in `../ROADMAP.md`

---

**Last Updated:** March 15, 2026  
**Status:** Production Ready
