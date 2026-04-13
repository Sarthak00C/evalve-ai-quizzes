import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Attempt } from '../models/Attempt.js';
import { Question } from '../models/Question.js';
import { Quiz } from '../models/Quiz.js';
import { authenticateToken } from '../middleware/auth.js';
import { useInMemoryDB, findQuizById, findQuizByCode, getQuestionsByQuizId, createAttempt, getAttemptsByUser, getAttemptsByQuizId, findAttemptById, findUserById, getEntityId, } from '../store.js';
const router = Router();
// Submit quiz attempt
router.post('/', authenticateToken, [
    body('quizId').notEmpty(),
    body('answers').isArray(),
    body('answers.*.questionId').notEmpty(),
    body('answers.*.selectedAnswer').isInt({ min: 0 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { quizId, answers } = req.body;
        const quiz = useInMemoryDB
            ? await findQuizById(quizId)
            : await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Get all questions and calculate score
        const questions = useInMemoryDB
            ? await getQuestionsByQuizId(getEntityId(quiz))
            : await Question.find({ quizId });
        let score = 0;
        const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a.selectedAnswer]));
        const processedAnswers = [];
        for (const question of questions) {
            const questionId = getEntityId(question);
            const selectedAnswer = answerMap.get(questionId);
            if (selectedAnswer === question.correctAnswer) {
                score++;
            }
            processedAnswers.push({
                questionId,
                selectedAnswer: selectedAnswer ?? -1,
            });
        }
        const attempt = useInMemoryDB
            ? await createAttempt(req.user.id, quizId, score, questions.length, processedAnswers)
            : new Attempt({
                userId: req.user.id,
                quizId,
                score,
                totalQuestions: questions.length,
                answers: processedAnswers,
                completedAt: new Date(),
            });
        if (!useInMemoryDB) {
            await attempt.save();
        }
        res.status(201).json({
            attempt: {
                id: getEntityId(attempt),
                userId: attempt.userId,
                quizId: attempt.quizId,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                completedAt: attempt.completedAt,
            },
        });
    }
    catch (error) {
        console.error('Submit attempt error:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});
// Get user's attempts
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const attempts = useInMemoryDB
            ? await getAttemptsByUser(req.user.id)
            : await Attempt.find({ userId: req.user.id })
                .populate('quizId', 'title quizCode')
                .sort({ createdAt: -1 });
        res.json({
            attempts: await Promise.all(attempts.map(async (attempt) => {
                const quizId = getEntityId(attempt.quizId) ?? '';
                const quiz = useInMemoryDB
                    ? await findQuizById(attempt.quizId)
                    : await findQuizById(quizId);
                return {
                    id: getEntityId(attempt),
                    quiz: {
                        id: getEntityId(quiz),
                        title: quiz?.title,
                        quizCode: quiz?.quizCode,
                    },
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                    completedAt: attempt.completedAt,
                };
            })),
        });
    }
    catch (error) {
        console.error('Get attempts error:', error);
        res.status(500).json({ error: 'Failed to get attempts' });
    }
});
// Get leaderboard for quiz
router.get('/quiz/:quizCode/leaderboard', authenticateToken, async (req, res) => {
    try {
        const quiz = useInMemoryDB
            ? await findQuizByCode(req.params.quizCode.toUpperCase())
            : await Quiz.findOne({
                quizCode: req.params.quizCode.toUpperCase(),
            });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Get top attempts for this quiz
        const quizId = getEntityId(quiz);
        const attempts = useInMemoryDB
            ? await getAttemptsByQuizId(quizId)
            : await Attempt.find({ quizId: quizId })
                .populate('userId', 'name email')
                .sort({ score: -1, completedAt: -1 });
        // Get unique users and their best score
        const leaderboard = new Map();
        for (const attempt of attempts) {
            const userId = getEntityId(attempt.userId);
            const user = await findUserById(userId);
            if (!leaderboard.has(userId)) {
                leaderboard.set(userId, {
                    userId,
                    name: user?.name,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                    completedAt: attempt.completedAt,
                });
            }
        }
        const sortedLeaderboard = Array.from(leaderboard.values())
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 100);
        res.json({ leaderboard: sortedLeaderboard });
    }
    catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});
// Get specific attempt details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const attempt = useInMemoryDB
            ? await findAttemptById(req.params.id)
            : await Attempt.findById(req.params.id)
                .populate('quizId')
                .populate('userId', 'name email');
        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }
        const attemptUserId = getEntityId(attempt.userId);
        if (attemptUserId !== req.user.id) {
            return res.status(403).json({ error: 'Cannot view other user attempts' });
        }
        res.json({
            attempt: {
                id: getEntityId(attempt),
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                answers: attempt.answers,
                completedAt: attempt.completedAt,
            },
        });
    }
    catch (error) {
        console.error('Get attempt error:', error);
        res.status(500).json({ error: 'Failed to get attempt' });
    }
});
export default router;
//# sourceMappingURL=attempts.js.map