# Quick Setup Checklist

## ✅ Backend Code Complete
- [x] Express server with all routes
- [x] MongoDB models (User, Quiz, Question, Attempt)
- [x] JWT authentication
- [x] AI quiz generation endpoint
- [x] Error handling middleware
- [x] CORS configuration

## ✅ Frontend Updated
- [x] API client created (`src/integrations/api/client.ts`)
- [x] AuthContext updated (JWT-based auth)
- [x] CreateQuizPage updated
- [x] ProfilePage updated
- [x] LeaderboardPage updated
- [x] QuizAttemptPage updated
- [x] JoinQuizPage updated
- [x] Environment configuration

## ⏭️ Next Steps to Run the App

### Step 1: Set Up MongoDB Atlas (Free)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier)
3. Create a cluster (AWS, free M0 cluster)
4. Create database user (remember password!)
5. Add IP address to whitelist (0.0.0.0/0 for dev)
6. Click "Connect" and copy the connection string
```

### Step 2: Create Backend .env File
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
NODE_ENV=development

# Paste your MongoDB connection string here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evalve-ai-quizzes?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_key_here_make_it_long
JWT_EXPIRES_IN=7d

# Get this from your Lovable account (optional for AI generation)
LOVABLE_API_KEY=your_api_key_here

FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 4: Start Backend Server
```bash
npm run dev
```

You'll see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📝 API documentation available at http://localhost:5000/api
```

### Step 5: Ensure Frontend .env
```bash
# In root directory, create/update .env
VITE_API_URL=http://localhost:5000/api
```

### Step 6: Start Frontend
```bash
npm run dev
```

The app should now work at `http://localhost:5173`

## Testing the Setup

### 1. Test Registration
- Go to Signup page
- Create account with email/password
- Choose role (teacher or student)

### 2. Test as Teacher
- Create a quiz
- Add questions
- Share the quiz code

### 3. Test as Student
- Go to Join Quiz
- Enter the quiz code from teacher
- Take the quiz
- See results

### 4. Test Leaderboard
- Go to Leaderboard
- Enter quiz code
- See rankings of all participants

## Troubleshooting

### "Cannot POST /api/auth/signup"
- Backend not running on http://localhost:5000
- Check `npm run dev` is executed in server folder

### "Connection refused"
- MongoDB Atlas cluster not running
- MongoDB URI in .env is incorrect
- IP whitelist doesn't include your IP

### "JWT token error"
- JWT_SECRET not set in backend .env
- Token format wrong (should have "Bearer " prefix)

### "CORS error"
- FRONTEND_URL in backend .env doesn't match where frontend is running
- Restart backend after changing .env

## Environment Variables Checklist

### Backend (`server/.env`)
- [ ] MONGODB_URI (from MongoDB Atlas)
- [ ] JWT_SECRET (any long string)
- [ ] LOVABLE_API_KEY (optional)
- [ ] FRONTEND_URL (http://localhost:5173)
- [ ] PORT (5000)

### Frontend (`root/.env`)
- [ ] VITE_API_URL (http://localhost:5000/api)

## File Structure After Setup
```
evalve-ai-quizzes/
├── server/
│   ├── .env                    # ← Contains MongoDB URI, JWT Secret
│   ├── node_modules/
│   ├── src/
│   └── package.json
├── src/
│   ├── integrations/
│   │   ├── api/
│   │   │   └── client.ts      # ← API client (no more Supabase!)
│   │   └── supabase/          # ← Deprecated, no longer used
│   ├── contexts/
│   │   └── AuthContext.tsx    # ← Updated to use JWT
│   └── pages/                 # ← All updated to use API client
├── .env                        # ← Contains VITE_API_URL
├── node_modules/
└── package.json
```

## What Was Removed
- ❌ Supabase client imports
- ❌ Supabase SDK initialization
- ❌ Row-level security policies (handled in backend)
- ❌ Supabase functions (replaced with backend routes)

## What Was Added
- 🆕 Node.js Express backend
- 🆕 MongoDB database models
- 🆕 JWT authentication
- 🆕 API client for frontend
- 🆕 Backend error handling
- 🆕 Full control over data and logic

## Documentation Files
- `README_BACKEND.md` - Detailed backend API documentation
- `MIGRATION_GUIDE.md` - Complete architecture migration guide
- `server/SETUP.md` - Backend setup quick start
- `src/integrations/api/client.ts` - Frontend API client with all methods

## Common Commands

### Backend
```bash
cd server
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Run production build
npm test                 # Run tests
npm run lint             # Check code style
```

### Frontend
```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
npm preview              # Preview production build
npm run test             # Run tests
npm run lint             # Check code style
```

## Success Criteria

✅ All checks passed when:
1. Backend starts without errors
2. MongoDB connection succeeds
3. Frontend can signup/login
4. Can create and join quizzes
5. Quiz submissions are recorded
6. Leaderboard shows results

## MongoDB Hosting Options

### Free Options
- **MongoDB Atlas Free Tier** (0.5-1GB, no credit card needed)
- **MongoDB Community Edition** (self-hosted on VM)

### Paid Options
- **MongoDB Atlas Paid Tiers** (1GB → unlimited)
- **AWS DocumentDB** (AWS-managed MongoDB)
- **Azure Cosmos DB** (Microsoft-managed)

## Backend Deployment

Once working locally, deploy to:
1. **Railway** - Easiest (connect GitHub, auto-deploy)
2. **Heroku** - Classic PaaS
3. **Render** - Free tier available
4. **DigitalOcean App Platform**
5. **Any VPS with Node.js**

For deployment, update `FRONTEND_URL` and `MONGODB_URI` to production values.

---

**You're ready to run the app!** 🚀

Start with "Step 1: Set Up MongoDB Atlas" above.
