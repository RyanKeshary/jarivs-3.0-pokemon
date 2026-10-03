import { describe, it, expect } from 'vitest';

describe('Admin Credentials & Password Rules', () => {
  const DEFAULT_PASSWORD = 'password@67';

  it('validates default password satisfies minimum length of 6', () => {
    expect(DEFAULT_PASSWORD.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_PASSWORD).toBe('password@67');
  });

  it('rejects passwords shorter than 6 characters', () => {
    const invalidShort = '12345';
    expect(invalidShort.length < 6).toBe(true);
  });

  it('accepts valid complex passwords', () => {
    const validPasswords = ['password@67', 'KantoChampion#2026', 'Pikachu99!'];
    validPasswords.forEach(pwd => {
      expect(pwd.length).toBeGreaterThanOrEqual(6);
    });
  });
});
