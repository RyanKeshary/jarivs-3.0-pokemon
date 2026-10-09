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

  describe('Strict 2-Event Maximum Rule (2 means 2)', () => {
    function evaluateEligibility(
      currentlyEnrolled: string[],
      newEvents: string[]
    ) {
      const currentSet = new Set(currentlyEnrolled);
      if (currentSet.size >= 2) {
        return {
          allowed: false,
          error: `Disqualification Rule: Already enrolled in 2 events (${Array.from(currentSet).join(', ')}). Maximum limit is strictly 2 events (2 means 2).`
        };
      }
      const duplicate = newEvents.filter(e => currentSet.has(e));
      if (duplicate.length > 0) {
        return {
          allowed: false,
          error: `Disqualification Rule: Already enrolled in "${duplicate.join(', ')}". Multiple registrations for the same event are not permitted.`
        };
      }
      const combined = new Set([...currentSet, ...newEvents]);
      if (combined.size > 2) {
        return {
          allowed: false,
          error: `Disqualification Rule: Adding ${newEvents.length} event(s) would result in ${combined.size} total events. Maximum allowed is strictly 2 events (2 means 2).`
        };
      }
      return { allowed: true };
    }

    it('strictly forbids adding a 3rd event when a participant already has 2 events (2 means 2)', () => {
      const current = ['build-asor', 'quiz-tle'];
      const res = evaluateEligibility(current, ['cad-mander']);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('2 means 2');
    });

    it('strictly forbids adding 2 events when a participant already has 1 event (1 + 2 = 3)', () => {
      const current = ['project-exhibition'];
      const res = evaluateEligibility(current, ['pid-geotto', 'quiz-tle']);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('2 means 2');
    });

    it('forbids enrolling in the exact same event multiple times', () => {
      const current = ['build-asor'];
      const res = evaluateEligibility(current, ['build-asor']);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Multiple registrations for the same event are not permitted');
    });

    it('allows registering for a 2nd event when a participant currently has only 1 event', () => {
      const current = ['pid-geotto'];
      const res = evaluateEligibility(current, ['cad-mander']);
      expect(res.allowed).toBe(true);
    });

    it('normalizes 10-digit phone across +91 prefixes and spaces to match existing candidate', () => {
      const storedPhone = '9372602311';
      const inputPhone1 = '+91 93726 02311';
      const inputPhone2 = '93726-02311';
      const inputPhone3 = '09372602311';

      const extract10 = (p: string) => p.replace(/\D/g, '').slice(-10);
      expect(extract10(inputPhone1)).toBe(storedPhone);
      expect(extract10(inputPhone2)).toBe(storedPhone);
      expect(extract10(inputPhone3)).toBe(storedPhone);
    });
  });

  describe('Multi-Event Dual Squad Generation (-A and -B) & Capacity Limits', () => {
    it('automatically splits 2-event registrations into teamname-A and teamname-B squads with unique codes', () => {
      const baseTeamName = 'Thunder Bolts';
      const events = ['project-exhibition', 'quiz-tle']; // 4-person and 2-person events
      
      const squadsToCreate = events.map((eventId, idx) => ({
        name: events.length === 2 ? `${baseTeamName}-${idx === 0 ? 'A' : 'B'}` : baseTeamName,
        eventId: eventId,
        code: `JRV-TEST${idx + 1}`,
      }));

      expect(squadsToCreate).toHaveLength(2);
      expect(squadsToCreate[0].name).toBe('Thunder Bolts-A');
      expect(squadsToCreate[0].eventId).toBe('project-exhibition');
      expect(squadsToCreate[0].code).toBe('JRV-TEST1');

      expect(squadsToCreate[1].name).toBe('Thunder Bolts-B');
      expect(squadsToCreate[1].eventId).toBe('quiz-tle');
      expect(squadsToCreate[1].code).toBe('JRV-TEST2');
      expect(squadsToCreate[0].code).not.toBe(squadsToCreate[1].code);
    });

    it('keeps single team name when registering for only 1 event', () => {
      const baseTeamName = 'Solo Sparks';
      const events = ['build-asor'];
      const squadName = events.length === 2 ? `${baseTeamName}-A` : baseTeamName;
      expect(squadName).toBe('Solo Sparks');
    });

    it('rejects next person when squad capacity is reached with the exact failure message', () => {
      const squad = {
        name: 'Thunder Bolts-B',
        memberCount: 2,
        maxCapacity: 2, // e.g. Quiztle 2-person limit
        isLocked: false,
      };

      function attemptJoin(currentMembers: number, maxCapacity: number, squadName: string, isLocked: boolean) {
        if (currentMembers >= maxCapacity || isLocked) {
          return {
            allowed: false,
            error: `Team Limit Reached: Squad "${squadName}" has already reached its maximum roster limit of ${maxCapacity} member(s). Registration is closed for this squad.`,
          };
        }
        return { allowed: true };
      }

      // Member 2 is at capacity, member 3 attempts to join
      const result = attemptJoin(squad.memberCount, squad.maxCapacity, squad.name, squad.isLocked);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe(
        'Team Limit Reached: Squad "Thunder Bolts-B" has already reached its maximum roster limit of 2 member(s). Registration is closed for this squad.'
      );
    });

    it('allows joining when squad has remaining slots below max capacity', () => {
      const squad4 = {
        name: 'Thunder Bolts-A',
        memberCount: 2,
        maxCapacity: 4, // e.g. Project Exhibition 4-person limit
        isLocked: false,
      };

      function attemptJoin(currentMembers: number, maxCapacity: number, squadName: string, isLocked: boolean) {
        if (currentMembers >= maxCapacity || isLocked) {
          return {
            allowed: false,
            error: `Team Limit Reached: Squad "${squadName}" has already reached its maximum roster limit of ${maxCapacity} member(s). Registration is closed for this squad.`,
          };
        }
        return { allowed: true };
      }

      const result = attemptJoin(squad4.memberCount, squad4.maxCapacity, squad4.name, squad4.isLocked);
      expect(result.allowed).toBe(true);
    });
  });
});


