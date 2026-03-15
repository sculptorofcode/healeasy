# AI Sales Visit Logger - Backend Server

Node.js + Express REST API server for the AI Sales Visit Logger mobile app. Handles user authentication, visit management, sync operations, and Google Generative AI (Gemini) integration for summary generation.

## ✨ Features

- **User Authentication** — Secure registration/login with JWT tokens (self-signed)
- **Visit Management API** — Create, read, update, delete visits with user scoping
- **MongoDB Persistence** — Scalable document storage with Mongoose ORM
- **AI Integration** — Google Generative AI (Gemini) for auto-generating structured summaries
- **Automatic Summary Generation** — Summaries auto-generate on visit create/update
- **Layered Architecture** — Route → Controller → Service → Repository pattern
- **Type Safety** — Full TypeScript with strict mode
- **Error Handling** — Standardized error responses and middleware

## 🛠️ Prerequisites

- **Node.js** (v16+) and npm
- **MongoDB** (local or cloud instance via MongoDB Atlas)
- **Google Generative AI API Key** (free tier available at [ai.google.dev](https://ai.google.dev))

## 📦 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd healeasy/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the `server/` directory with all required variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-sales-visit-logger
JWT_SECRET=your_very_strong_random_secret_key_here_min_32_chars
GOOGLE_GENERATIVE_AI_KEY=your_google_generative_ai_api_key_here
```

Copy from `.env.example`:
```bash
cp .env.example .env
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/healeasy` |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | `supersecretkey123456789012345678` |
| `GOOGLE_GENERATIVE_AI_KEY` | Google Generative AI API key | `AIzaSyD...` |

### Getting a Google Generative AI API Key

1. Visit [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new API key for the default project
4. Copy the key to your `.env` file

> Free tier available: 60 requests per minute

### Setting Up MongoDB

#### Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# MongoDB runs on mongodb://localhost:27017 by default
```

#### Option 2: MongoDB Atlas (Cloud)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Update MONGODB_URI in .env
```

Example MongoDB Atlas URI:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-sales-visit-logger
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

Starts server with hot-reload using `ts-node-dev`. Server runs on http://localhost:3000

### Production Build
```bash
# Compile TypeScript to JavaScript
npm run build

# Run compiled JavaScript
npm start
```

### Verify Server is Running
```bash
curl http://localhost:3000/health
# Should return: { "status": "ok" }
```

## 📝 Project Structure

```
server/
├── src/
│   ├── app.ts                     # Express app setup & middleware
│   ├── config/
│   │   └── db.ts                  # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification middleware
│   │   └── errorHandler.ts        # Global error handling
│   ├── models/
│   │   ├── User.ts                # User Mongoose schema
│   │   └── Visit.ts               # Visit Mongoose schema
│   ├── repositories/              # Data access layer (only Mongoose calls here)
│   │   ├── base.repository.ts     # Base CRUD interface
│   │   ├── user.repository.ts     # User database operations
│   │   └── visit.repository.ts    # Visit database operations
│   ├── services/                  # Business logic layer
│   │   ├── auth.service.ts        # Authentication logic
│   │   ├── visit.service.ts       # Visit CRUD orchestration
│   │   └── ai.service.ts          # AI summary generation (Gemini)
│   ├── controllers/               # Thin request/response handlers
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   └── visits.controller.ts   # Visit endpoints
│   ├── routes/
│   │   ├── auth.routes.ts         # Auth route definitions
│   │   └── visits.routes.ts       # Visit route definitions
│   ├── utils/
│   │   └── response.ts            # Standardized response helpers
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── server.ts or index.ts      # Entry point
├── api/
│   └── index.ts                   # Vercel serverless entry point
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## 🔐 Authentication

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com"
    }
  }
}
```

### Login User
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com"
    }
  }
}
```

### JWT Token

- **Header:** `Authorization: Bearer <token>`
- **Payload:** `{ sub: userId, email: userEmail }`
- **Expiry:** 7 days
- **Signing:** HS256 with JWT_SECRET

## 📡 API Endpoints

### Authentication Endpoints

#### POST /auth/register
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "email": "user@example.com" }
  }
}
```

#### POST /auth/login
Authenticate user with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "email": "user@example.com" }
  }
}
```

### Visit Endpoints (All require `Authorization: Bearer <token>`)

#### GET /visits
Fetch all visits for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Visits fetched successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "customerName": "Acme Corp",
      "contactPerson": "John Doe",
      "location": "New York, NY",
      "visitDateTime": "2024-03-14T10:30:00Z",
      "rawNotes": "Met with CEO about expansion plans...",
      "outcomeStatus": "follow_up_needed",
      "nextFollowUpDate": "2024-03-21T10:00:00Z",
      "aiSummary": {
        "meetingSummary": "Discussed...",
        "painPoints": ["Budget constraints", "..."],
        "actionItems": ["Send proposal", "..."],
        "recommendedNextStep": "Send proposal by Friday",
        "generatedAt": "2024-03-14T10:35:00Z"
      },
      "createdAt": "2024-03-14T10:30:00Z",
      "updatedAt": "2024-03-14T10:35:00Z"
    }
  ]
}
```

#### POST /visits
Create new visit (auto-generates AI summary).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "customerName": "Acme Corp",
  "contactPerson": "John Doe",
  "location": "New York, NY",
  "visitDateTime": "2024-03-14T10:30:00Z",
  "rawNotes": "Discussed expansion plans, budget constraints...",
  "outcomeStatus": "follow_up_needed",
  "nextFollowUpDate": "2024-03-21"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Visit created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "customerName": "Acme Corp",
    "aiSummary": {
      "meetingSummary": "Met with Acme Corp CEO...",
      "painPoints": ["Budget constraints", "..."],
      "actionItems": ["Send proposal", "..."],
      "recommendedNextStep": "Send proposal by Friday",
      "generatedAt": "2024-03-14T10:35:00Z"
    },
    ...
  }
}
```

#### PUT /visits/:id
Update existing visit (regenerates AI summary if notes changed).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "customerName": "Acme Corp",
  "contactPerson": "Jane Smith",
  "location": "New York, NY",
  "visitDateTime": "2024-03-14T10:30:00Z",
  "rawNotes": "Updated notes with new information...",
  "outcomeStatus": "deal_closed",
  "nextFollowUpDate": null
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Visit updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "customerName": "Acme Corp",
    "aiSummary": {
      "meetingSummary": "Updated summary...",
      ...
    },
    ...
  }
}
```

#### DELETE /visits/:id
Delete a visit.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Visit deleted successfully",
  "data": null
}
```

## 🤖 AI Summary Generation

### How It Works

1. **Trigger:** Summary auto-generates when:
   - NEW visit created (POST /visits)
   - Existing visit updated with changed notes (PUT /visits/:id)

2. **Context:** Sends full visit object to Gemini:
   - Customer name, contact person, location
   - Visit date/time, meeting notes
   - Outcome status, next follow-up date

3. **Processing:** Gemini generates structured JSON:
   ```json
   {
     "meetingSummary": "2-3 sentence overview",
     "painPoints": ["Issue 1", "Issue 2"],
     "actionItems": ["Action 1", "Action 2"],
     "recommendedNextStep": "Most important action",
     "generatedAt": "ISO 8601 timestamp"
   }
   ```

4. **Response:** Server returns visit with `aiSummary` included

5. **Error Handling:** If AI generation fails:
   - Visit is still saved successfully
   - Summary is null
   - Error is logged but doesn't block response

### Models Used

- **`gemini-2.5-flash`** (default) — Fast, good quality, free tier friendly
- **`gemini-pro`** — More accurate, slightly slower

Switch models in `ai.service.ts`:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

## 📚 Data Models

### User Schema
```typescript
{
  email: string,           // unique
  passwordHash: string,    // bcrypt hashed
  createdAt: Date,
  updatedAt: Date
}
```

### Visit Schema
```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  customerName: string,
  contactPerson: string,
  location: string,
  visitDateTime: Date,
  rawNotes: string,
  outcomeStatus: enum,     // 'deal_closed' | 'follow_up_needed' | 'no_interest' | 'pending'
  nextFollowUpDate: Date | null,
  aiSummary: {
    meetingSummary: string,
    painPoints: string[],
    actionItems: string[],
    recommendedNextStep: string,
    generatedAt: Date
  } | null,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Ensure MongoDB is running
mongod

# Or check MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://...
```

### "API key not valid"
- Check `GOOGLE_GENERATIVE_AI_KEY` in `.env`
- Ensure it's a valid Gemini API key from [ai.google.dev](https://ai.google.dev)
- API keys have daily quota limits (free tier: 60 requests/minute)

### "JWT validation failed"
- Token may be expired (7-day expiry)
- Client needs to refresh by logging in again
- Check `JWT_SECRET` matches between server and client expectations

### "Visit not found" (404)
- Check visit ID is correct MongoDB ObjectId format
- Visit may be deleted
- Ensure you're using correct user's JWT token

### Sync timestamp mismatch
- Ensure server and client clocks are synchronized
- MongoDB stores dates in UTC
- Client should convert to UTC before syncing

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_GENERATIVE_AI_KEY`

4. Update app's `API_BASE_URL` to Vercel deployment URL

### Environment Variables in Vercel
```
Settings → Environment Variables

MONGODB_URI = mongodb+srv://...
JWT_SECRET = your_secret_key
GOOGLE_GENERATIVE_AI_KEY = your_api_key
```

## 💡 Development Tips

### Testing Endpoints with cURL
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get token from response, then use it:
TOKEN="eyJhbGciOiJIUzI1NiI..."

# Get all visits
curl http://localhost:3000/visits \
  -H "Authorization: Bearer $TOKEN"

# Create visit
curl -X POST http://localhost:3000/visits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"...","..."}'
```

### View MongoDB Data
```bash
mongosh
use ai-sales-visit-logger
db.users.find()
db.visits.find()
```

### Check Server Logs
- Development: Watch terminal where `npm run dev` runs
- Look for: `[Sync]`, `[AI]`, `[Error]` prefixes
- MongoDB connection logs at startup

## 📊 Architecture

### Layered Architecture
```
Request
   ↓
Route Handler (auth.routes.ts, visits.routes.ts)
   ↓
Controller (auth.controller.ts, visits.controller.ts)
   ↓
Service (auth.service.ts, visit.service.ts, ai.service.ts)
   ↓
Repository (user.repository.ts, visit.repository.ts)
   ↓
Mongoose Model (User.ts, Visit.ts)
   ↓
MongoDB
   ↓
Response (via sendSuccess/sendError helpers)
```

### Response Format Contract
Every endpoint responds with standardized shape:

**Success:**
```json
{
  "success": true,
  "message": "Description",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": null
}
```

## 📖 Development Guide

### Adding a New Endpoint

1. Define route in `routes/visits.routes.ts`:
   ```typescript
   router.get('/path', requireAuth, visitController.handler);
   ```

2. Create controller in `controllers/visits.controller.ts`:
   ```typescript
   export async function handler(req, res, next) {
     try {
       const result = await visitService.operation(...);
       sendSuccess(res, result);
     } catch (err) {
       next(err);
     }
   }
   ```

3. Add service logic in `services/visit.service.ts`

4. Use repository for data access in `repositories/visit.repository.ts`

### Test New Endpoint
```bash
# Start server
npm run dev

# In another terminal, test endpoint
curl http://localhost:3000/path ...
```

## 📞 Support

For issues:
1. Check server logs: `npm run dev` output
2. Verify all environment variables are set
3. Check MongoDB connection
4. Verify Google API key is valid
5. Check app logs for sync errors

---

**Last Updated:** March 15, 2026  
**Status:** Production Ready  
**AI Provider:** Google Generative AI (Gemini)
