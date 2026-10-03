import { describe, it, expect } from 'vitest';

export function validateTrainerEmail(email: string, isMaster = false): { valid: boolean; error?: string } {
  const clean = email.trim().toLowerCase();
  if (!clean) return { valid: false, error: 'Email is required' };
  if (isMaster) return { valid: true };
  if (!clean.endsWith('@slrtce.in')) {
    return {
      valid: false,
      error: 'Only @slrtce.in trainers may enter! Please use your institutional college email.',
    };
  }
  return { valid: true };
}

describe('Trainer Domain Validation Rules', () => {
  it('accepts valid @slrtce.in institutional emails', () => {
    expect(validateTrainerEmail('ash.ketchum@slrtce.in').valid).toBe(true);
    expect(validateTrainerEmail('TRAINER.123@SLRTCE.IN').valid).toBe(true);
  });

  it('rejects non-slrtce emails with in-theme warning', () => {
    const res = validateTrainerEmail('ash@gmail.com');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Only @slrtce.in trainers may enter! Please use your institutional college email.');
  });

  it('rejects lookalike or subdomain spoofing', () => {
    expect(validateTrainerEmail('ash@fake-slrtce.in').valid).toBe(false);
    expect(validateTrainerEmail('ash@slrtce.in.evil.com').valid).toBe(false);
  });

  it('allows master allowlist emails when isMaster is true', () => {
    expect(validateTrainerEmail('ryankeshary@gmail.com', true).valid).toBe(true);
    expect(validateTrainerEmail('shrey.sleeps@gmail.com', true).valid).toBe(true);
  });
});
