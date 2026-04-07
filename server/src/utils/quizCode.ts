import crypto from 'crypto';

export const generateQuizCode = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};
