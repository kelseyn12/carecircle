// Simple CAPTCHA challenge for authentication screens
// Generates a simple math problem that users must solve

export interface CaptchaChallenge {
  question: string;
  answer: number;
}

/**
 * Generate a simple math CAPTCHA challenge
 * Returns a question like "What is 3 + 5?" and the answer
 */
export function generateCaptcha(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
  const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
  const operation = Math.random() > 0.5 ? '+' : '-';
  
  let answer: number;
  let question: string;
  
  if (operation === '+') {
    answer = num1 + num2;
    question = `What is ${num1} + ${num2}?`;
  } else {
    // Ensure positive result for subtraction
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    answer = larger - smaller;
    question = `What is ${larger} - ${smaller}?`;
  }
  
  return { question, answer };
}

/**
 * Validate CAPTCHA answer
 */
export function validateCaptcha(userAnswer: string, correctAnswer: number): boolean {
  const parsed = parseInt(userAnswer.trim(), 10);
  return !isNaN(parsed) && parsed === correctAnswer;
}

