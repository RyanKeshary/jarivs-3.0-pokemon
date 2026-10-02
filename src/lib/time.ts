/**
 * Every date the event cares about is IST (Asia/Kolkata, UTC+05:30).
 *
 * Two rules this module exists to enforce:
 *  1. Never format a date in the visitor's local timezone. A trainer in the US
 *     must see "18 Oct 2026, 12:00 IST", not their own evening.
 *  2. Never assume a stored timestamp is valid. Everything is admin-editable,
 *     so a blank or malformed value has to degrade to a visible "[EDIT ME]"
 *     rather than rendering "NaN:NaN" or, worse, a plausible wrong date.
 */

export const EVENT_TIME_ZONE = 'Asia/Kolkata';
export const EVENT_TIME_ZONE_LABEL = 'IST';

/**
 * Intl.DateTimeFormat construction is comparatively expensive and these are
 * called from a 1Hz countdown tick, so the formatters are built once.
 */
const fmt = {
  dateTime: new Intl.DateTimeFormat('en-IN', {
    timeZone: EVENT_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
  time: new Intl.DateTimeFormat('en-IN', {
    timeZone: EVENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
  dayMonth: new Intl.DateTimeFormat('en-IN', {
    timeZone: EVENT_TIME_ZONE,
    day: '2-digit',
    month: 'short',
  }),
};

/** Parses an ISO string, returning null for anything unusable. */
export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : new Date(ms);
}

/** "18 Oct 2026, 12:00 IST" - or null when the value is missing/invalid. */
export function formatIstDateTime(iso: string | null | undefined): string | null {
  const d = parseDate(iso);
  if (!d) return null;
  return `${fmt.dateTime.format(d)} ${EVENT_TIME_ZONE_LABEL}`;
}

/** "12:00 IST" */
export function formatIstTime(iso: string | null | undefined): string | null {
  const d = parseDate(iso);
  return d ? `${fmt.time.format(d)} ${EVENT_TIME_ZONE_LABEL}` : null;
}

/** "18 Oct" - for the route map, where the year adds nothing. */
export function formatIstDayMonth(iso: string | null | undefined): string | null {
  const d = parseDate(iso);
  return d ? fmt.dayMonth.format(d) : null;
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                    */
/* -------------------------------------------------------------------------- */

export type CountdownPhase =
  /** Target is in the future: the digits are ticking down. */
  | 'counting'
  /** The target has been reached but the event has not finished. */
  | 'live'
  /** event_ends_at has passed. */
  | 'ended';

export interface Countdown {
  phase: CountdownPhase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Signed milliseconds until the target. Negative once it has passed. */
  remainingMs: number;
  /** False when the target is missing or unparseable. */
  valid: boolean;
}

const ZERO: Countdown = {
  phase: 'counting',
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  remainingMs: 0,
  valid: false,
};

/**
 * Splits the remaining time into the four units a game-style countdown shows.
 *
 * @param targetIso  what we are counting down to (event_config.countdown_target)
 * @param endsAtIso  when it is over (event_config.event_ends_at). While this is
 *                   NULL the countdown can never reach the "ended" phase, which
 *                   is deliberate: we do not invent an end time.
 */
export function computeCountdown(
  targetIso: string | null | undefined,
  endsAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): Countdown {
  const target = parseDate(targetIso);
  if (!target) return ZERO;

  const endsAt = parseDate(endsAtIso);
  const remainingMs = target.getTime() - nowMs;

  if (remainingMs <= 0) {
    return {
      phase: endsAt && nowMs >= endsAt.getTime() ? 'ended' : 'live',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      remainingMs,
      valid: true,
    };
  }

  // floor, not round: a countdown that shows "0 days" one second early looks
  // broken. 3.9 days should read "3", not "4".
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { phase: 'counting', days, hours, minutes, seconds, remainingMs, valid: true };
}

/** "3d 04h 12m" style summary, for places with no room for four boxes. */
export function formatRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return '0m';
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

/** The exact difference in whole days between two instants, e.g. 4 or -1. */
export function daysBetween(fromIso: string | null, toMs: number = Date.now()): number | null {
  const from = parseDate(fromIso);
  if (!from) return null;
  return Math.ceil((from.getTime() - toMs) / 86_400_000);
}

/**
 * Registration is open only when the admin has left the flag on *and* the
 * deadline has not passed. The deadline alone is not enough: an organiser
 * sometimes needs to close signups early.
 */
export function isRegistrationOpen(
  deadlineIso: string | null | undefined,
  adminOpen: boolean,
  nowMs: number = Date.now(),
): boolean {
  const deadline = parseDate(deadlineIso);
  if (!deadline) return false;
  return adminOpen && nowMs < deadline.getTime();
}

export { useNow } from '../hooks/useNow';
