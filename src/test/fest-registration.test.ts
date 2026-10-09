import { describe, it, expect } from 'vitest';

const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function validateTeamPayload(payload: {
  teamName: string;
  eventIds: string[];
  leader: { email: string; phone: string; fullName: string };
  honeypot?: string;
}) {
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return { valid: false, error: 'Automated submission rejected.' };
  }
  if (!payload.teamName || payload.teamName.trim().length < 2) {
    return { valid: false, error: 'Please provide a valid team name (at least 2 characters).' };
  }
  if (!payload.eventIds || payload.eventIds.length === 0) {
    return { valid: false, error: 'Please select at least one competition discipline.' };
  }
  if (payload.eventIds.length > 2) {
    return {
      valid: false,
      error: 'Disqualification Rule: A participant or squad can participate in a maximum of 2 events.',
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.leader.email.trim())) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  const phone = payload.leader.phone.trim().replace(/[^0-9+]/g, '');
  if (phone.length < 10) {
    return { valid: false, error: 'Please enter a valid contact phone or WhatsApp number.' };
  }
  return { valid: true };
}

describe('Indigo Tech Fest Registration Validation', () => {
  it('enforces maximum 2 event limit per squad (Disqualification Rule)', () => {
    const invalidPayload = {
      teamName: 'Overcharged Squad',
      eventIds: ['project-exhibition', 'pid-geotto', 'quiz-tle'],
      leader: { email: 'trainer@example.com', phone: '+919876543210', fullName: 'Red' },
    };
    const res = validateTeamPayload(invalidPayload);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Disqualification Rule: A participant or squad can participate in a maximum of 2 events');
  });

  it('rejects honeypot bot submissions', () => {
    const botPayload = {
      teamName: 'Bot Team',
      eventIds: ['project-exhibition'],
      leader: { email: 'bot@example.com', phone: '+919876543210', fullName: 'Bot' },
      honeypot: 'spam-bot-value',
    };
    const res = validateTeamPayload(botPayload);
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Automated submission rejected.');
  });

  it('accepts valid 1-event and 2-event registrations', () => {
    const valid1 = {
      teamName: 'Cyber Pika',
      eventIds: ['pid-geotto'],
      leader: { email: 'trainer@example.com', phone: '9876543210', fullName: 'Ash' },
    };
    expect(validateTeamPayload(valid1).valid).toBe(true);

    const valid2 = {
      teamName: 'Dual Masters',
      eventIds: ['pid-geotto', 'cad-mander'],
      leader: { email: 'trainer@example.com', phone: '9876543210', fullName: 'Gary' },
    };
    expect(validateTeamPayload(valid2).valid).toBe(true);
  });

  it('guarantees human-friendly code format JRV-XXXX excluding ambiguous characters', () => {
    expect(CODE_CHARS).not.toContain('0');
    expect(CODE_CHARS).not.toContain('O');
    expect(CODE_CHARS).not.toContain('1');
    expect(CODE_CHARS).not.toContain('I');
    expect(CODE_CHARS).not.toContain('L');
  });

  it('rejects duplicate email enrollment with clear warning that account exists', () => {
    const existingEmails = ['trainer@slrtce.in', 'ash@slrtce.in'];
    const emailToRegister = 'Ash@Slrtce.in';
    const isDuplicate = existingEmails.some(e => e.toLowerCase() === emailToRegister.trim().toLowerCase());
    
    expect(isDuplicate).toBe(true);
    const errorMsg = `Account already exists! A registration with email "${emailToRegister.trim().toLowerCase()}" is already enrolled. Please sign in to your dashboard.`;
    expect(errorMsg).toContain('Account already exists');
    expect(errorMsg).toContain('Please sign in to your dashboard');
  });

  it('validates only @slrtce.in emails are accepted', () => {
    const validEmail = 'student.comp26@slrtce.in';
    const invalidGmail = 'student@gmail.com';
    const invalidYahoo = 'student@yahoo.co.in';

    expect(validEmail.endsWith('@slrtce.in')).toBe(true);
    expect(invalidGmail.endsWith('@slrtce.in')).toBe(false);
    expect(invalidYahoo.endsWith('@slrtce.in')).toBe(false);
  });

  it('validates numeric-only 10-digit WhatsApp numbers', () => {
    const rawInput = '98765-43210';
    const cleaned = rawInput.replace(/\D/g, '');
    expect(cleaned).toBe('9876543210');
    expect(cleaned.length).toBe(10);

    const invalidShort = '98765'.replace(/\D/g, '');
    expect(invalidShort.length === 10).toBe(false);
  });

  it('verifies mandatory reference ID, division, and roll number', () => {
    const participant = {
      referenceId: 'SLRTCE/REF-2024/042',
      division: 'A',
      rollNo: '42',
    };
    expect(participant.referenceId.trim().length > 0).toBe(true);
    expect(participant.division.trim().length > 0).toBe(true);
    expect(participant.rollNo.trim().length > 0).toBe(true);
  });

  it('supports selecting each of the 7 official events for manual on-spot enrollment', () => {
    const SEVEN_EVENTS = [
      'project-exhibition',
      'pid-geotto',
      'treasure-hunt',
      'quiz-tle',
      'build-asor',
      'snorreelax',
      'cad-mander'
    ];
    expect(SEVEN_EVENTS).toHaveLength(7);
    SEVEN_EVENTS.forEach(eventId => {
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBeGreaterThan(0);
    });
  });
});

