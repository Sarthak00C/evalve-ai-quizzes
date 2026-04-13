import mongoose, { Schema } from 'mongoose';
const QuestionSchema = new Schema({
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
            validator: function (value) {
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
}, { timestamps: true });
export const Question = mongoose.model('Question', QuestionSchema);
//# sourceMappingURL=Question.js.map