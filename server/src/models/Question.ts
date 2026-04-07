import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  quizId: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: number;
  orderIndex: number;
  createdAt: Date;
}

const QuestionSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        type: String,
        required: true,
      },
    ],
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: function (this: IQuestion, value: number) {
          return value < this.options.length;
        },
        message: 'correctAnswer must be a valid option index',
      },
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
