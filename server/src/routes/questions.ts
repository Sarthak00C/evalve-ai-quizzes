import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Question } from '../models/Question.js';
import { Quiz } from '../models/Quiz.js';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth.js';
import {
  useInMemoryDB,
  findQuizById,
  getQuestionsByQuizId,
  addQuestions,
  findQuestionById,
  deleteQuestionById,
  getEntityId,
} from '../store.js';

const router = Router();

// Add questions to quiz
router.post(
  '/',
  authenticateToken,
  authorizeRole(['teacher']),
  [
    body('quizId').notEmpty(),
    body('questions').isArray(),
    body('questions.*.questionText').trim().notEmpty(),
    body('questions.*.options').isArray({ min: 2 }),
    body('questions.*.correctAnswer').isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { quizId, questions: questionsData } = req.body;

      // Verify user owns the quiz
      const quiz = useInMemoryDB
        ? await findQuizById(quizId)
        : await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      if ((quiz.createdBy as any).toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'Cannot add questions to other user quizzes' });
      }

      const insertedQuestions = useInMemoryDB
        ? await addQuestions(quizId, questionsData)
        : await Question.insertMany(
            questionsData.map((q: any, idx: number) => ({
              quizId,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              orderIndex: idx,
            }))
          );

      res.status(201).json({
        questions: insertedQuestions.map((q) => ({
          id: getEntityId(q),
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          orderIndex: q.orderIndex,
        })),
      });
    } catch (error) {
      console.error('Add questions error:', error);
      res.status(500).json({ error: 'Failed to add questions' });
    }
  }
);

// Get questions for quiz
router.get('/quiz/:quizId', authenticateToken, async (req: AuthRequest, res) => {
  try {
const questions = useInMemoryDB
        ? await getQuestionsByQuizId(req.params.quizId)
        : await Question.find({
            quizId: req.params.quizId,
          }).sort({ orderIndex: 1 });

    res.json({
      questions: questions.map((q) => ({
        id: getEntityId(q),
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        orderIndex: q.orderIndex,
      })),
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Delete question
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['teacher']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const question = useInMemoryDB
        ? await findQuestionById(req.params.id)
        : await Question.findById(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const quiz = useInMemoryDB
        ? await findQuizById(question.quizId as string)
        : await Quiz.findById(question.quizId);
      if ((quiz?.createdBy as any).toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'Cannot delete questions from other user quizzes' });
      }

      if (useInMemoryDB) {
        await deleteQuestionById(req.params.id);
      } else {
        await Question.findByIdAndDelete(req.params.id);
      }

      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
);

export default router;
