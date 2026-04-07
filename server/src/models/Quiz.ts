import mongoose, { Schema, Document, Types } from 'mongoose';
import { generateQuizCode } from '../utils/quizCode.js';

export interface IQuiz extends Document {
  quizCode: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema(
  {
    quizCode: {
      type: String,
      required: true,
      unique: true,
      default: () => generateQuizCode(),
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    timeLimit: {
      type: Number,
      default: 30,
      min: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Cascade delete questions and attempts when quiz is deleted
QuizSchema.pre('deleteOne', { document: true }, async function (next) {
  const Quiz = mongoose.model('Quiz');
  const Question = mongoose.model('Question');
  const Attempt = mongoose.model('Attempt');

  await Question.deleteMany({ quizId: this._id });
  await Attempt.deleteMany({ quizId: this._id });
  next();
});

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
