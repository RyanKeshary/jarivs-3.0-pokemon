import { describe, it, expect } from 'vitest';

export function calculateTimeRemaining(targetIso: string, currentIso: string) {
  const diff = +new Date(targetIso) - +new Date(currentIso);
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPassed: false,
  };
}

describe('Countdown Calculation Engine', () => {
  it('accurately computes days, hours, minutes, seconds remaining', () => {
    const target = '2026-10-18T09:00:00Z';
    const now = '2026-10-17T09:00:00Z'; // exactly 1 day prior
    const res = calculateTimeRemaining(target, now);
    expect(res.days).toBe(1);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.isPassed).toBe(false);
  });

  it('handles partial hours and minutes accurately', () => {
    const target = '2026-10-18T10:30:45Z';
    const now = '2026-10-18T08:00:00Z'; // 2h 30m 45s prior
    const res = calculateTimeRemaining(target, now);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(2);
    expect(res.minutes).toBe(30);
    expect(res.seconds).toBe(45);
  });

  it('clamps to zero when target has elapsed', () => {
    const target = '2026-10-18T09:00:00Z';
    const now = '2026-10-18T12:00:00Z';
    const res = calculateTimeRemaining(target, now);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.isPassed).toBe(true);
  });
});
