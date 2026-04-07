import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRole } from './models/User.js';

export const useInMemoryDB = !process.env.MONGODB_URI;

// Debug log
if (typeof process !== 'undefined') {
  console.log(`[Store] MONGODB_URI: ${process.env.MONGODB_URI || 'NOT SET'}`);
  console.log(`[Store] useInMemoryDB: ${useInMemoryDB}`);
}

interface InMemoryUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryQuiz {
  id: string;
  quizCode: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: Array<{ questionId: string; selectedAnswer: number }>;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const users: InMemoryUser[] = [];
const quizzes: InMemoryQuiz[] = [];
const questions: InMemoryQuestion[] = [];
const attempts: InMemoryAttempt[] = [];

const generateId = () => crypto.randomUUID();
const generateQuizCode = () =>
  Array.from({ length: 6 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

export async function findUserByEmail(email: string) {
  return users.find((user) => user.email === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  return users.find((user) => user.id === id) ?? null;
}

export async function createUser(email: string, password: string, name: string, role: UserRole) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user: InMemoryUser = {
    id: generateId(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    name: name.trim(),
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.push(user);
  return user;
}

export async function updateUserName(id: string, name: string) {
  const user = await findUserById(id);
  if (!user) return null;
  user.name = name.trim();
  user.updatedAt = new Date();
  return user;
}

export async function findUsersByIds(ids: string[]) {
  return users.filter((user) => ids.includes(user.id));
}

export async function findQuizByCode(code: string) {
  return quizzes.find((quiz) => quiz.quizCode === code.toUpperCase()) ?? null;
}

export async function findQuizById(id: string) {
  return quizzes.find((quiz) => quiz.id === id) ?? null;
}

export function getEntityId(entity: any) {
  if (entity == null) return null;
  return entity.id ?? entity._id?.toString() ?? null;
}

export async function getQuizzesByUser(userId: string) {
  return quizzes
    .filter((quiz) => quiz.createdBy === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createQuiz(title: string, topic: string, difficulty: string, timeLimit: number, createdBy: string) {
  const quiz: InMemoryQuiz = {
    id: generateId(),
    quizCode: generateQuizCode(),
    title: title.trim(),
    topic: topic.trim(),
    difficulty,
    timeLimit,
    isActive: true,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  quizzes.push(quiz);
  return quiz;
}

export async function updateQuiz(id: string, updates: Partial<Pick<InMemoryQuiz, 'title' | 'topic' | 'difficulty' | 'timeLimit' | 'isActive'>>) {
  const quiz = await findQuizById(id);
  if (!quiz) return null;
  if (updates.title) quiz.title = updates.title.trim();
  if (updates.topic) quiz.topic = updates.topic.trim();
  if (updates.difficulty) quiz.difficulty = updates.difficulty;
  if (updates.timeLimit !== undefined) quiz.timeLimit = updates.timeLimit;
  if (updates.isActive !== undefined) quiz.isActive = updates.isActive;
  quiz.updatedAt = new Date();
  return quiz;
}

export async function deleteQuiz(id: string) {
  const index = quizzes.findIndex((quiz) => quiz.id === id);
  if (index === -1) return false;
  quizzes.splice(index, 1);
  await deleteQuestionsByQuizId(id);
  await deleteAttemptsByQuizId(id);
  return true;
}

export async function addQuestions(quizId: string, questionsData: Array<{ questionText: string; options: string[]; correctAnswer: number }>) {
  const currentCount = questions.filter((q) => q.quizId === quizId).length;
  const inserted = questionsData.map((question, idx) => {
    const stored: InMemoryQuestion = {
      id: generateId(),
      quizId,
      questionText: question.questionText.trim(),
      options: question.options,
      correctAnswer: question.correctAnswer,
      orderIndex: currentCount + idx,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    questions.push(stored);
    return stored;
  });
  return inserted;
}

export async function getQuestionsByQuizId(quizId: string) {
  return questions
    .filter((q) => q.quizId === quizId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function findQuestionById(id: string) {
  return questions.find((question) => question.id === id) ?? null;
}

export async function deleteQuestionById(id: string) {
  const index = questions.findIndex((q) => q.id === id);
  if (index === -1) return false;
  questions.splice(index, 1);
  return true;
}

export async function deleteQuestionsByQuizId(quizId: string) {
  for (let i = questions.length - 1; i >= 0; i -= 1) {
    if (questions[i].quizId === quizId) {
      questions.splice(i, 1);
    }
  }
}

export async function createAttempt(userId: string, quizId: string, score: number, totalQuestions: number, answers: Array<{ questionId: string; selectedAnswer: number }>) {
  const attempt: InMemoryAttempt = {
    id: generateId(),
    userId,
    quizId,
    score,
    totalQuestions,
    answers,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  attempts.push(attempt);
  return attempt;
}

export async function getAttemptsByUser(userId: string) {
  return attempts
    .filter((attempt) => attempt.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAttemptsByQuizId(quizId: string) {
  return attempts.filter((attempt) => attempt.quizId === quizId);
}

export async function findAttemptById(id: string) {
  return attempts.find((attempt) => attempt.id === id) ?? null;
}

export async function deleteAttemptsByQuizId(quizId: string) {
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    if (attempts[i].quizId === quizId) {
      attempts.splice(i, 1);
    }
  }
}
