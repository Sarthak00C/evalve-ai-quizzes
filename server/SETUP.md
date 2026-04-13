# Backend Setup Summary

## Quick Start

### 1. Set Up Backend Folder

```bash
cd server
npm install
```

### 2. Configure MongoDB Atlas

Get your connection string from MongoDB Atlas:
- Create cluster
- Create database user
- Copy connection string

### 3. Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evalve-ai-quizzes?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
LOVABLE_API_KEY=your-api-key
FRONTEND_URL=http://localhost:5173
```

### 4. Start Backend

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

## Frontend Configuration

Update `.env` in root directory:
```
VITE_API_URL=http://localhost:5000/api
```

## Architecture

**Frontend** (Vite React)
- Uses `src/integrations/api/client.ts` for API calls
- Stores JWT token in localStorage
- Communicates with backend via HTTP

**Backend** (Express + MongoDB)
- Express server on port 5000
- MongoDB for data storage
- JWT for authentication
- Mongoose for data models

## Database Models

- **User** - Authentication & profiles
- **Quiz** - Quiz metadata
- **Question** - Quiz questions
- **Attempt** - User quiz attempts

## Key API Routes

```
POST   /api/auth/signup
POST   /api/auth/signin
GET    /api/auth/me

POST   /api/quizzes
GET    /api/quizzes/my-quizzes
GET    /api/quizzes/code/:code

POST   /api/questions
GET    /api/questions/quiz/:quizId

POST   /api/attempts
GET    /api/attempts

POST   /api/ai/generate-quiz
```

See `README_BACKEND.md` for complete API documentation.
