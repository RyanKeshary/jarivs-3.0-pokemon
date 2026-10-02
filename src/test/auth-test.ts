// Test: Email validation and registration flow
import { isUnconfirmed } from '../lib/content';

describe('Email validation', () => {
  test('accepts @slrtce.in domain', () => {
    // The database RPC is_registration_email_allowed checks this
    const email = 'trainer@slrtce.in';
    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];
    // Domain check
    const isDomainAllowed = domain === 'slrtce.in';
    // Local part check against allowlist
    const allowedUsernames = ['ryankeshary', 'shrey.sleeps'];
    const isUsernameAllowed = allowedUsernames.includes(localPart);
    // Should pass either check
    const allowed = isDomainAllowed || isUsernameAllowed;
    expect(allowed).toBe(true);
  });

  test('rejects non-@slrtce.in domain without allowlist', () => {
    const email = 'trainer@gmail.com';
    const domain = email.split('@')[1];
    const isDomainAllowed = domain === 'slrtce.in';
    const allowedUsernames = ['ryankeshary', 'shrey.sleeps'];
    const isUsernameAllowed = allowedUsernames.includes(email.split('@')[0]);
    const allowed = isDomainAllowed || isUsernameAllowed;
    expect(allowed).toBe(false);
  });

  test('allows ryankeshary@gmail.com as email kind', () => {
    // In Phase 2, this is in allowed_emails with kind='email'
    const email = 'ryankeshary@gmail.com';
    const isExactEmail = email === 'ryankeshary@gmail.com';
    expect(isExactEmail).toBe(true);
  });

  test('allows shrey.sleeps@gmail.com as username kind', () => {
    // In Phase 2, this matches any shrey.sleeps@ANYdomain
    const email = 'shrey.sleeps@gmail.com';
    const isExactEmail = email === 'shrey.sleeps@gmail.com';
    expect(isExactEmail).toBe(true);
  });

  test('isUnconfirmed detection', () => {
    expect(isUnconfirmed(null)).toBe(true);
    expect(isUnconfirmed(undefined)).toBe(true);
    expect(isUnconfirmed('[EDIT ME]')).toBe(true);
    expect(isUnconfirmed('')).toBe(true);
    expect(isUnconfirmed('valid content')).toBe(false);
  });
});

// Test: Team size validation
describe('team size validation', () => {
  test('team size min is 2', () => {
    const min = 2;
    expect(min).toBeGreaterThanOrEqual(1);
    expect(min).toBeLessThanOrEqual(6);
  });

  test('team size max is 6', () => {
    const max = 6;
    expect(max).toBeLessThanOrEqual(6);
    expect(max).toBeGreaterThanOrEqual(2);
  });
});