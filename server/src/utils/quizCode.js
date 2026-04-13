import crypto from 'crypto';
export const generateQuizCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};
//# sourceMappingURL=quizCode.js.map