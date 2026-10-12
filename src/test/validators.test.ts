import { describe, it, expect } from 'vitest';

export function validateTrainerEmail(email: string): { valid: boolean; error?: string } {
  const clean = email.trim().toLowerCase();
  if (!clean) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: 'Please enter a valid email address.',
    };
  }
  return { valid: true };
}

describe('Trainer Email Validation Rules (No Domain Restriction)', () => {
  it('accepts valid institutional and external emails', () => {
    expect(validateTrainerEmail('ash.ketchum@slrtce.in').valid).toBe(true);
    expect(validateTrainerEmail('TRAINER.123@GMAIL.COM').valid).toBe(true);
    expect(validateTrainerEmail('pikachu@outlook.com').valid).toBe(true);
    expect(validateTrainerEmail('student@somaiya.edu').valid).toBe(true);
  });

  it('rejects invalid email formats', () => {
    const res = validateTrainerEmail('invalid-email');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Please enter a valid email address.');
  });

  it('rejects empty strings', () => {
    expect(validateTrainerEmail('').valid).toBe(false);
    expect(validateTrainerEmail('   ').valid).toBe(false);
  });
});
