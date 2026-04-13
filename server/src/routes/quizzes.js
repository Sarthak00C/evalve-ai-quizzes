import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Quiz } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { Attempt } from '../models/Attempt.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { useInMemoryDB, createQuiz, getQuizzesByUser, findQuizByCode, findQuizById, getQuestionsByQuizId, deleteQuestionsByQuizId, deleteAttemptsByQuizId, deleteQuiz, updateQuiz, getEntityId, } from '../store.js';
const router = Router();
// Create quiz
router.post('/', authenticateToken, authorizeRole(['teacher']), [
    body('title').trim().notEmpty(),
    body('topic').trim().notEmpty(),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('timeLimit').isInt({ min: 1 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { title, topic, difficulty, timeLimit } = req.body;
        const quiz = useInMemoryDB
            ? await createQuiz(title, topic, difficulty, timeLimit, req.user.id)
            : new Quiz({
                title,
                topic,
                difficulty,
                timeLimit,
                createdBy: req.user.id,
            });
        if (!useInMemoryDB) {
            await quiz.save();
        }
        res.status(201).json({
            quiz: {
                id: getEntityId(quiz),
                quizCode: quiz.quizCode,
                title: quiz.title,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                timeLimit: quiz.timeLimit,
                isActive: quiz.isActive,
                createdAt: quiz.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});
// Get all quizzes created by user
router.get('/my-quizzes', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const quizzes = useInMemoryDB
            ? await getQuizzesByUser(req.user.id)
            : await Quiz.find({ createdBy: req.user.id }).sort({
                createdAt: -1,
            });
        res.json({
            quizzes: quizzes.map((quiz) => ({
                id: getEntityId(quiz),
                quizCode: quiz.quizCode,
                title: quiz.title,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                timeLimit: quiz.timeLimit,
                isActive: quiz.isActive,
                createdAt: quiz.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Get my quizzes error:', error);
        res.status(500).json({ error: 'Failed to get quizzes' });
    }
});
// Get quiz by code
router.get('/code/:code', authenticateToken, async (req, res) => {
    try {
        const quiz = useInMemoryDB
            ? await findQuizByCode(req.params.code.toUpperCase())
            : await Quiz.findOne({
                quizCode: req.params.code.toUpperCase(),
            }).populate('createdBy', 'name email');
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        const quizId = getEntityId(quiz);
        const questions = useInMemoryDB
            ? await getQuestionsByQuizId(quizId)
            : await Question.find({ quizId }).sort({
                orderIndex: 1,
            });
        res.json({
            quiz: {
                id: quizId,
                quizCode: quiz.quizCode,
                title: quiz.title,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                timeLimit: quiz.timeLimit,
                isActive: quiz.isActive,
                createdAt: quiz.createdAt,
            },
            questions: questions.map((q) => ({
                id: getEntityId(q),
                questionText: q.questionText,
                options: q.options,
                orderIndex: q.orderIndex,
            })),
        });
    }
    catch (error) {
        console.error('Get quiz by code error:', error);
        res.status(500).json({ error: 'Failed to get quiz' });
    }
});
// Get quiz by ID (for results/details)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const quiz = useInMemoryDB
            ? await findQuizById(req.params.id)
            : await Quiz.findById(req.params.id).populate('createdBy', 'name email');
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        const quizId = getEntityId(quiz);
        const questions = useInMemoryDB
            ? await getQuestionsByQuizId(quizId)
            : await Question.find({ quizId }).sort({
                orderIndex: 1,
            });
        res.json({
            quiz: {
                id: quizId,
                quizCode: quiz.quizCode,
                title: quiz.title,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                timeLimit: quiz.timeLimit,
                isActive: quiz.isActive,
                createdAt: quiz.createdAt,
            },
            questions: questions.map((q) => ({
                id: getEntityId(q),
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                orderIndex: q.orderIndex,
            })),
        });
    }
    catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Failed to get quiz' });
    }
});
// Update quiz
router.put('/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const quiz = useInMemoryDB
            ? await findQuizById(req.params.id)
            : await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Only creator can update
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Cannot update other user quizzes' });
        }
        const { title, topic, difficulty, timeLimit, isActive } = req.body;
        const updated = useInMemoryDB
            ? await updateQuiz(req.params.id, {
                title,
                topic,
                difficulty,
                timeLimit,
                isActive,
            })
            : (async () => {
                if (title)
                    quiz.title = title;
                if (topic)
                    quiz.topic = topic;
                if (difficulty)
                    quiz.difficulty = difficulty;
                if (timeLimit)
                    quiz.timeLimit = timeLimit;
                if (isActive !== undefined)
                    quiz.isActive = isActive;
                await quiz.save();
                return quiz;
            })();
        if (!updated) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json({
            quiz: {
                id: getEntityId(quiz),
                quizCode: quiz.quizCode,
                title: quiz.title,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                timeLimit: quiz.timeLimit,
                isActive: quiz.isActive,
                createdAt: quiz.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ error: 'Failed to update quiz' });
    }
});
// Delete quiz
router.delete('/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const quiz = useInMemoryDB
            ? await findQuizById(req.params.id)
            : await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Only creator can delete
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Cannot delete other user quizzes' });
        }
        const quizId = getEntityId(quiz);
        if (useInMemoryDB) {
            await deleteQuestionsByQuizId(quizId);
            await deleteAttemptsByQuizId(quizId);
            await deleteQuiz(req.params.id);
        }
        else {
            await Question.deleteMany({ quizId });
            await Attempt.deleteMany({ quizId });
            await Quiz.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Quiz deleted successfully' });
    }
    catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});
export default router;
//# sourceMappingURL=quizzes.js.map