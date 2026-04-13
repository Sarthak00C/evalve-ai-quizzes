# Architecture Migration: Supabase → Node.js + MongoDB

## What Changed

The application has been successfully migrated from Supabase (BaaS with PostgreSQL) to a complete Node.js backend with MongoDB.

### Old Architecture (Supabase)
```
Frontend (React) → Supabase SDK → PostgreSQL
                 ↓
           Supabase Functions (Deno)
           for AI Quiz Generation
```

### New Architecture (Node.js + MongoDB)
```
Frontend (React) → API Client → Node.js Express Server → MongoDB
                                 ↓
                          Lovable AI API
                   (for AI Quiz Generation)
```

## Project Structure

```
evalve-ai-quizzes/
├── src/                          # Frontend (React + TypeScript)
│   ├── integrations/
│   │   ├── api/
│   │   │   └── client.ts        # ✨ NEW: API client for backend
│   │   └── supabase/            # ⚠️  DEPRECATED: No longer used
│   ├── contexts/
│   │   └── AuthContext.tsx      # ✏️  Updated: Uses API client
│   ├── pages/                   # ✏️  Updated: All pages use API client
│   └── ...
├── server/                       # ✨ NEW: Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts      # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Quiz.ts
│   │   │   ├── Question.ts
│   │   │   └── Attempt.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── questions.ts
│   │   │   ├── attempts.ts
│   │   │   ├── profiles.ts
│   │   │   └── ai.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   └── errorHandler.ts
│   │   └── server.ts            # Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── .env                          # Frontend config (VITE_API_URL)
├── README_BACKEND.md            # Backend setup guide
└── ...
```

## Key Changes

### Frontend Updates (src/)

1. **New API Client** (`src/integrations/api/client.ts`)
   - Single source of truth for backend communication
   - Handles JWT token management
   - Request/response parsing

2. **Updated AuthContext** (`src/contexts/AuthContext.tsx`)
   - Removed Supabase dependencies
   - Uses JWT tokens stored in localStorage
   - Simplified to fewer imports

3. **Updated Pages**
   - `CreateQuizPage.tsx` - Uses `apiClient.createQuiz()`, `apiClient.generateQuiz()`
   - `ProfilePage.tsx` - Uses `apiClient.updateProfile()`
   - `LeaderboardPage.tsx` - Uses `apiClient.getLeaderboard()`
   - `QuizAttemptPage.tsx` - Uses `apiClient.submitAttempt()`
   - `JoinQuizPage.tsx` - Uses `apiClient.getQuizByCode()`

### Backend Implementation (server/)

1. **Express Server** - HTTP API with CORS support
2. **MongoDB** - Data persistence with Mongoose ODM
3. **JWT Authentication** - Token-based auth instead of Supabase Auth
4. **Models** - Clean data schema with validation
5. **Routes** - RESTful API endpoints
6. **Error Handling** - Centralized error middleware

## Comparison: Supabase vs Node.js + MongoDB

| Feature | Supabase | Node.js + MongoDB |
|---------|----------|------------------|
| Database | PostgreSQL | MongoDB |
| Auth | Supabase Auth | JWT Tokens |
| API | Auto-generated | Custom Express |
| Functions | Deno-based | Node.js |
| Hosting | Supabase Cloud | Any Node.js host (Heroku, Railway, etc.) |
| Cost | Generous free tier | Free tier + hosting |
| Scalability | Great | Great |
| Control | Limited | Full control |

## Data Migration

The new MongoDB collections have the same structure as the old Supabase tables:

| Supabase Table | MongoDB Collection |
|---|---|
| auth.users | User (id, email, password hash, name, role) |
| profiles | *(merged into User)* |
| user_roles | *(role field in User)* |
| quizzes | Quiz |
| questions | Question |
| attempts | Attempt |

## Setup Instructions

### Backend Setup

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure MongoDB**
   - Create MongoDB Atlas account
   - Create a cluster
   - Create database user credentials
   - Get connection string

3. **Create `.env` file** in `server/` directory:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/evalve-ai-quizzes
   JWT_SECRET=your-secret-key
   LOVABLE_API_KEY=your-api-key
   FRONTEND_URL=http://localhost:5173
   PORT=5000
   ```

4. **Start Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Update `.env`** (root directory):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication Flow

1. User signs up/logs in
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include token in Authorization header
5. Backend validates token before processing requests

### Example Request

```javascript
// Frontend API call
const response = await apiClient.createQuiz(title, topic, difficulty, timeLimit);

// What happens:
// 1. apiClient adds Authorization header with JWT token
// 2. Sends POST to http://localhost:5000/api/quizzes
// 3. Backend validates token
// 4. Backend validates quiz data
// 5. Backend saves to MongoDB
// 6. Returns quiz object with ID and code
```

## Authentication Endpoints

- `POST /api/auth/signup` - Register (returns token)
- `POST /api/auth/signin` - Login (returns token)
- `GET /api/auth/me` - Get current user info

## Quiz Management Endpoints

- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/my-quizzes` - Get user's quizzes
- `GET /api/quizzes/code/:code` - Get quiz by code
- `GET /api/quizzes/:id` - Get quiz details
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz

## Quiz Participation Endpoints

- `POST /api/questions` - Add questions
- `GET /api/questions/quiz/:quizId` - Get quiz questions
- `POST /api/attempts` - Submit quiz attempt
- `GET /api/attempts` - Get user's attempts
- `GET /api/attempts/quiz/:quizCode/leaderboard` - Get leaderboard

## AI Quiz Generation

- `POST /api/ai/generate-quiz` - Generate questions with AI (uses Lovable API)

## Deployment

### Backend Deployment Options

1. **Railway.app** (Recommended - simplest)
   - Connect GitHub repo
   - Set environment variables
   - Auto-deploy on push

2. **Heroku**
   - Install Heroku CLI
   - `heroku create`
   - Set config vars
   - `git push heroku main`

3. **Render**
   - Connect GitHub
   - Set env vars
   - Deploy

4. **Self-hosted**
   - VPS (DigitalOcean, Linode, AWS)
   - Docker container
   - PM2 for process management

### Frontend Deployment Options

1. **Vercel** (Recommended)
   - Connect GitHub repo
   - Set VITE_API_URL to backend URL
   - Auto-deploy

2. **Netlify**
   - Deploy with environment variables

3. **Traditional hosting**
   - Build: `npm run build`
   - Serve `dist/` folder

## Advantages of New Architecture

✅ **Full Control** - Own your backend completely
✅ **Flexible** - Deploy anywhere, use any MongoDB host
✅ **Cost Efficient** - Free MongoDB Atlas tier + cheap Node.js hosting
✅ **Scalable** - Can handle any load with proper setup
✅ **Standard** - Industry-standard Node.js + MongoDB stack
✅ **Familiarity** - Easier for other developers to understand
✅ **Customizable** - Can add features without limitations
✅ **Type Safe** - Full TypeScript throughout

## Support & Documentation

- Backend setup guide: [README_BACKEND.md](./README_BACKEND.md)
- Server setup quick start: [server/SETUP.md](./server/SETUP.md)
- API client: [src/integrations/api/client.ts](./src/integrations/api/client.ts)
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Express.js: https://expressjs.com/
- Mongoose: https://mongoosejs.com/

## Troubleshooting

### Frontend can't connect to backend

- Check `VITE_API_URL` in frontend `.env`
- Ensure backend is running on correct port
- Check browser console for CORS errors
- Verify backend FRONTEND_URL matches frontend URL

### Backend won't start

- Check MongoDB connection string
- Ensure MongoDB cluster is running
- Check all environment variables are set
- Look for port 5000 already in use

### Database connection errors

- Verify MongoDB Atlas IP whitelist includes your IP
- Check username and password are correct
- Ensure database user has read/write permissions
- Try importing database via MongoDB Compass

## Next Steps

1. ✅ Backend created with Node.js + Express
2. ✅ MongoDB models defined
3. ✅ Frontend updated to use new API
4. ⏭️  Set up MongoDB Atlas
5. ⏭️  Test all features
6. ⏭️  Deploy to production

---

**Last Updated:** 2026-04-07
**Migrated from:** Supabase BaaS with PostgreSQL
**Migrated to:** Node.js Express + MongoDB
