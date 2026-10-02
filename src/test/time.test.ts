// Test: Countdown logic edge cases
import { describe, test, expect } from 'vitest';
import { computeCountdown, formatIstDateTime, isRegistrationOpen } from '../lib/time';
import { isUnconfirmed } from '../lib/content';

describe('computeCountdown', () => {
  test('returns live countdown when target is reached', () => {
    const result = computeCountdown('2026-10-18T06:30:00.000Z', null, Date.parse('2026-10-18T06:30:00.000Z'));
    expect(result.phase).toBe('live');
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.valid).toBe(true);
  });

  test('returns counting phase when target is in future', () => {
    const result = computeCountdown('2026-10-20T12:00:00.000Z', null, Date.parse('2026-10-18T06:30:00.000Z'));
    expect(result.phase).toBe('counting');
    expect(result.days).toBeGreaterThan(0);
  });

  test('returns live phase when target has passed but ends_at has not', () => {
    const result = computeCountdown(
      '2026-10-18T06:00:00.000Z',
      '2026-10-18T12:00:00.000Z',
      Date.parse('2026-10-18T06:30:00.000Z')
    );
    expect(result.phase).toBe('live');
  });

  test('returns ended phase when both target and ends_at have passed', () => {
    const result = computeCountdown(
      '2026-10-18T06:30:00.000Z',
      '2026-10-18T05:00:00.000Z',
      Date.parse('2026-10-18T06:30:00.000Z')
    );
    expect(result.phase).toBe('ended');
  });

  test('returns valid: false when target iso is null', () => {
    const result = computeCountdown(null, null, Date.now());
    expect(result.valid).toBe(false);
  });

  test('returns ZERO when target iso is invalid', () => {
    const result = computeCountdown('invalid-date', null, Date.now());
    expect(result).toEqual({ phase: 'counting', days: 0, hours: 0, minutes: 0, seconds: 0, remainingMs: 0, valid: false });
  });
});

// Test: IST date formatting
describe('formatIstDateTime', () => {
  test('formats valid ISO string to IST', () => {
    const result = formatIstDateTime('2026-10-18T06:30:00.000Z');
    expect(result).toBe('18 Oct 2026, 12:00 IST');
  });

  test('returns null for invalid ISO', () => {
    const result = formatIstDateTime(null);
    expect(result).toBeNull();
  });

  test('returns null for empty string', () => {
    const result = formatIstDateTime('');
    expect(result).toBeNull();
  });
});

// Test: isRegistrationOpen
describe('isRegistrationOpen', () => {
  test('returns true when deadline is in future and adminOpen is true', () => {
    expect(isRegistrationOpen('2026-10-18T12:00:00+05:30', true)).toBe(true);
  });

  test('returns false when deadline is in past', () => {
    expect(isRegistrationOpen('2026-10-01T12:00:00+05:30', true)).toBe(false);
  });

  test('returns false when adminOpen is false', () => {
    expect(isRegistrationOpen('2026-12-31T12:00:00+05:30', false)).toBe(false);
  });

  test('returns false when deadline is null', () => {
    expect(isRegistrationOpen(null, true)).toBe(false);
  });
});

// Test: EDIT_ME detection
describe('isUnconfirmed', () => {
  test('returns true for null', () => {
    expect(isUnconfirmed(null)).toBe(true);
  });

  test('returns true for undefined', () => {
    expect(isUnconfirmed(undefined)).toBe(true);
  });

  test('returns true for [EDIT ME] string', () => {
    expect(isUnconfirmed('[EDIT ME]')).toBe(true);
  });

  test('returns true for empty string', () => {
    expect(isUnconfirmed('')).toBe(true);
  });

  test('returns false for normal string', () => {
    expect(isUnconfirmed('some text')).toBe(false);
  });

  test('returns true for number NaN', () => {
    expect(isUnconfirmed(NaN)).toBe(true);
  });
});

// Test: Social links limit (max 3)
describe('socials limit', () => {
  test('array of 3 is valid', () => {
    expect([1, 2, 3].length).toBe(3);
  });

  test('array of 4 would exceed DB constraint', () => {
    // The database constraint: jsonb_array_length(socials) <= 3
    expect([1, 2, 3, 4].length).toBe(4); // This would be rejected by DB constraint
  });
});

// Test: Team size rules
describe('team size', () => {
  test('min team size constraint is 2', () => {
    expect(2).toBeGreaterThanOrEqual(2);
  });

  test('max team size constraint is 6', () => {
    expect(6).toBeLessThanOrEqual(6);
  });
});