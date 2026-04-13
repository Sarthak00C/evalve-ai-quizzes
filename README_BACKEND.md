# Evalve AI Quizzes - Backend Setup Guide

## Overview

The backend has been migrated from Supabase (PostgreSQL) to a complete Node.js + MongoDB architecture. This guide will help you set up and run the MongoDB backend.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Installation

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `server` directory (copy from `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evalve-ai-quizzes?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AI Generation (Lovable API)
LOVABLE_API_KEY=your_lovable_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and replace in `.env`:
   - Replace `<username>` and `<password>` with your database user credentials
   - The database name `evalve-ai-quizzes` will be created automatically

### 4. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Database Schema

### Collections

#### Users
```
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (hashed with bcryptjs),
  name: String,
  role: Enum('teacher', 'student'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Quizzes
```
{
  _id: ObjectId,
  quizCode: String (unique, 6-char uppercase),
  title: String,
  topic: String,
  difficulty: Enum('easy', 'medium', 'hard'),
  timeLimit: Number (minutes),
  createdBy: ObjectId (User),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Questions
```
{
  _id: ObjectId,
  quizId: ObjectId (Quiz),
  questionText: String,
  options: [String, String, String, String],
  correctAnswer: Number (0-3),
  orderIndex: Number,
  createdAt: Date
}
```

#### Attempts
```
{
  _id: ObjectId,
  userId: ObjectId (User),
  quizId: ObjectId (Quiz),
  score: Number,
  totalQuestions: Number,
  answers: [{
    questionId: ObjectId,
    selectedAnswer: Number
  }],
  completedAt: Date,
  createdAt: Date
}
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user (requires auth token)

### Profiles

- `GET /api/profiles/:id` - Get user profile
- `PUT /api/profiles/:id` - Update profile (requires auth)
- `POST /api/profiles/batch` - Get multiple profiles

### Quizzes

- `POST /api/quizzes` - Create quiz (teacher only)
- `GET /api/quizzes/my-quizzes` - Get user's quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `GET /api/quizzes/code/:code` - Get quiz by code
- `PUT /api/quizzes/:id` - Update quiz (creator only)
- `DELETE /api/quizzes/:id` - Delete quiz (creator only)

### Questions

- `POST /api/questions` - Add questions to quiz
- `GET /api/questions/quiz/:quizId` - Get quiz questions
- `DELETE /api/questions/:id` - Delete question

### Attempts

- `POST /api/attempts` - Submit quiz attempt
- `GET /api/attempts` - Get user's attempts
- `GET /api/attempts/:id` - Get attempt details
- `GET /api/attempts/quiz/:quizCode/leaderboard` - Get quiz leaderboard

### AI

- `POST /api/ai/generate-quiz` - Generate quiz with AI

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are returned from login/signup and stored in localStorage by the frontend.

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Troubleshooting

### MongoDB Connection Error

- Check MONGODB_URI is correct in .env
- Ensure MongoDB Atlas cluster is running
- Verify IP whitelist includes your IP address

### CORS Error

- Update FRONTEND_URL in .env to match your frontend URL
- Restart the server after changing .env

### Authentication Issues

- Verify JWT_SECRET is set
- Check token expiration (JWT_EXPIRES_IN)
- Ensure Authorization header format is correct

## Migration Notes

The frontend has been updated to use the new API client instead of Supabase:

- `src/integrations/api/client.ts` - API client for Node.js backend
- All pages now use `apiClient` instead of `supabase`
- AuthContext updated for token-based authentication
- Frontend .env uses `VITE_API_URL` to configure backend URL

## Next Steps

1. ✅ Set up MongoDB Atlas database
2. ✅ Configure .env file
3. ✅ Start backend server (`npm run dev`)
4. ✅ Frontend will automatically connect to backend
5. Test all features (signup, create quiz, join quiz, etc.)
6. Deploy to production (Heroku, Railway, Vercel, etc.)
