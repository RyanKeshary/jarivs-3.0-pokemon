/**
 * "Has the visitor already seen the intro this session?"
 *
 * sessionStorage, not localStorage: the intro is a once-per-session greeting,
 * not a once-per-device one. A returning visitor on the same tab should not be
 * made to sit through it again after navigating back from /auth.
 *
 * Every access is wrapped because sessionStorage throws in some privacy modes
 * and in sandboxed iframes. A failure here must never take the site down - the
 * worst case is the intro replays.
 */

const KEY = 'kanto-league:intro-seen:v1';

export function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage unavailable - the intro will simply play again next visit */
  }
}

export function clearIntroFlag(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
