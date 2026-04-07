import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Generate quiz with AI
router.post(
  '/generate-quiz',
  authenticateToken,
  [
    body('prompt').trim().notEmpty(),
    body('topic').trim().notEmpty(),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('count').isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { prompt, topic, difficulty, count } = req.body;
      const lovableApiKey = process.env.LOVABLE_API_KEY;

      if (!lovableApiKey) {
        return res
          .status(500)
          .json({ error: 'AI service not configured' });
      }

      const systemPrompt = `You are a quiz question generator. Generate exactly ${count || 5} multiple choice questions.
Topic: ${topic || 'general knowledge'}
Difficulty: ${difficulty || 'medium'}

Respond with a JSON object containing:
{
  "title": "Quiz title",
  "topic": "Topic name",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0
    }
  ]
}`;

      const response = await axios.post(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content:
                prompt ||
                `Generate ${count || 5} quiz questions about ${topic || 'general knowledge'}`,
            },
          ],
          model: 'gpt-4',
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const quizData = JSON.parse(jsonMatch[0]);

      res.json({
        title: quizData.title,
        topic: quizData.topic,
        questions: quizData.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      res.status(500).json({ error: error.message || 'AI generation failed' });
    }
  }
);

export default router;
