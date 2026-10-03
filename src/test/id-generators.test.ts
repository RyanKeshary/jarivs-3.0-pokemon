import { describe, it, expect } from 'vitest';

export function formatTrainerId(rawHash: string): string {
  const code = rawHash.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
  return `TRN-KL3-${code}`;
}

export function formatTeamId(rawHash: string): string {
  const code = rawHash.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  return `TEAM-KL3-${code}`;
}

describe('Trainer and Team ID Formatting', () => {
  it('formats Trainer IDs adhering to TRN-KL3-XXXXXX specification', () => {
    const id = formatTrainerId('abcdef123456');
    expect(id).toMatch(/^TRN-KL3-[A-Z0-9]{6}$/);
    expect(id).toBe('TRN-KL3-ABCDEF');
  });

  it('formats Team IDs adhering to TEAM-KL3-XXXX specification', () => {
    const id = formatTeamId('7890abcd');
    expect(id).toMatch(/^TEAM-KL3-[A-Z0-9]{4}$/);
    expect(id).toBe('TEAM-KL3-7890');
  });

  it('guarantees case insensitivity and alphanumeric sanitization', () => {
    const id = formatTrainerId('!@#abc999xyz');
    expect(id).toBe('TRN-KL3-ABC999');
  });
});
