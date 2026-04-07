import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttempt extends Document {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  score: number;
  totalQuestions: number;
  answers: Array<{
    questionId: Types.ObjectId;
    selectedAnswer: number;
  }>;
  completedAt: Date;
  createdAt: Date;
}

const AttemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedAnswer: {
          type: Number,
          required: true,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

export const Attempt = mongoose.model<IAttempt>('Attempt', AttemptSchema);
