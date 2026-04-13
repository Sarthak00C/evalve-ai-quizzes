import bcrypt from 'bcryptjs';
import crypto from 'crypto';
export const useInMemoryDB = !process.env.MONGODB_URI;
// Debug log
if (typeof process !== 'undefined') {
    console.log(`[Store] MONGODB_URI: ${process.env.MONGODB_URI || 'NOT SET'}`);
    console.log(`[Store] useInMemoryDB: ${useInMemoryDB}`);
}
const users = [];
const quizzes = [];
const questions = [];
const attempts = [];
const generateId = () => crypto.randomUUID();
const generateQuizCode = () => Array.from({ length: 6 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
export async function findUserByEmail(email) {
    return users.find((user) => user.email === email.toLowerCase()) ?? null;
}
export async function findUserById(id) {
    return users.find((user) => user.id === id) ?? null;
}
export async function createUser(email, password, name, role) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
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
export async function updateUserName(id, name) {
    const user = await findUserById(id);
    if (!user)
        return null;
    user.name = name.trim();
    user.updatedAt = new Date();
    return user;
}
export async function findUsersByIds(ids) {
    return users.filter((user) => ids.includes(user.id));
}
export async function findQuizByCode(code) {
    return quizzes.find((quiz) => quiz.quizCode === code.toUpperCase()) ?? null;
}
export async function findQuizById(id) {
    return quizzes.find((quiz) => quiz.id === id) ?? null;
}
export function getEntityId(entity) {
    if (entity == null)
        return null;
    return entity.id ?? entity._id?.toString() ?? null;
}
export async function getQuizzesByUser(userId) {
    return quizzes
        .filter((quiz) => quiz.createdBy === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function createQuiz(title, topic, difficulty, timeLimit, createdBy) {
    const quiz = {
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
export async function updateQuiz(id, updates) {
    const quiz = await findQuizById(id);
    if (!quiz)
        return null;
    if (updates.title)
        quiz.title = updates.title.trim();
    if (updates.topic)
        quiz.topic = updates.topic.trim();
    if (updates.difficulty)
        quiz.difficulty = updates.difficulty;
    if (updates.timeLimit !== undefined)
        quiz.timeLimit = updates.timeLimit;
    if (updates.isActive !== undefined)
        quiz.isActive = updates.isActive;
    quiz.updatedAt = new Date();
    return quiz;
}
export async function deleteQuiz(id) {
    const index = quizzes.findIndex((quiz) => quiz.id === id);
    if (index === -1)
        return false;
    quizzes.splice(index, 1);
    await deleteQuestionsByQuizId(id);
    await deleteAttemptsByQuizId(id);
    return true;
}
export async function addQuestions(quizId, questionsData) {
    const currentCount = questions.filter((q) => q.quizId === quizId).length;
    const inserted = questionsData.map((question, idx) => {
        const stored = {
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
export async function getQuestionsByQuizId(quizId) {
    return questions
        .filter((q) => q.quizId === quizId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
}
export async function findQuestionById(id) {
    return questions.find((question) => question.id === id) ?? null;
}
export async function deleteQuestionById(id) {
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1)
        return false;
    questions.splice(index, 1);
    return true;
}
export async function deleteQuestionsByQuizId(quizId) {
    for (let i = questions.length - 1; i >= 0; i -= 1) {
        if (questions[i].quizId === quizId) {
            questions.splice(i, 1);
        }
    }
}
export async function createAttempt(userId, quizId, score, totalQuestions, answers) {
    const attempt = {
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
export async function getAttemptsByUser(userId) {
    return attempts
        .filter((attempt) => attempt.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function getAttemptsByQuizId(quizId) {
    return attempts.filter((attempt) => attempt.quizId === quizId);
}
export async function findAttemptById(id) {
    return attempts.find((attempt) => attempt.id === id) ?? null;
}
export async function deleteAttemptsByQuizId(quizId) {
    for (let i = attempts.length - 1; i >= 0; i -= 1) {
        if (attempts[i].quizId === quizId) {
            attempts.splice(i, 1);
        }
    }
}
//# sourceMappingURL=store.js.map