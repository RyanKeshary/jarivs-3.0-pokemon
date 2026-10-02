import { useNow } from '../../hooks/useNow';
import { computeCountdown, formatIstDateTime, type CountdownPhase } from '../../lib/time';
import { EditMe } from './EditMe';
import { MONITOR_SCREEN, monitor } from '../../lib/assets';
import { Art } from './Art';

interface CountdownProps {
  targetIso: string | null;
  endsAtIso: string | null;
}

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Mins' },
  { key: 'seconds', label: 'Secs' },
] as const;

/** Shown wherever a date we do not have yet would otherwise render as zeros. */
const EDIT_ME_TEXT = '[EDIT ME] countdown target';

/**
 * Live countdown to the event.
 *
 * Three states, all driven by the database:
 *   counting - the target is in the future
 *   live     - the target has been reached but event_ends_at has not passed
 *   ended    - event_ends_at has passed
 *
 * When the target is missing or unparseable the component shows the [EDIT ME]
 * marker rather than zeros, so "not configured" never looks like "the event
 * starts right now".
 *
 * Renders inside the stadium monitor art, using the measured screen box
 * (MONITOR_SCREEN) so the digits sit behind the glass.
 */
export function Countdown({ targetIso, endsAtIso }: CountdownProps) {
  const now = useNow(1000);
  const countdown = computeCountdown(targetIso, endsAtIso, now);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <Art
        asset={monitor}
        alt=""
        priority
        className="w-full select-none drop-shadow-[0_28px_60px_rgba(0,0,0,0.75)]"
      />

      {/* The screen: glass, scanlines, and the digits behind it. */}
      <div
        className="absolute overflow-hidden rounded-lg bg-linear-to-b from-[#2a93bd] to-[#16618a] shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]"
        style={MONITOR_SCREEN}
      >
        <div aria-hidden="true" className="bg-scanlines absolute inset-0 opacity-70" />
        {/* Diagonal glare across the glass. */}
        <div
          aria-hidden="true"
          className="absolute -inset-x-1/4 -top-1/2 h-[200%] rotate-12 bg-linear-to-r from-transparent via-white/12 to-transparent"
        />

        <div className="relative flex h-full w-full flex-col items-center justify-center px-2 py-1">
          {!countdown.valid ? (
            <div className="px-2 text-center">
              <p className="font-pixel text-[0.5rem] tracking-[0.2em] text-white/70 sm:text-[0.6rem]">
                Countdown
              </p>
              <EditMe className="mt-2 border-white/60 bg-black/40 text-white">{EDIT_ME_TEXT}</EditMe>
            </div>
          ) : countdown.phase === 'counting' ? (
            <div className="flex w-full items-stretch justify-center gap-1 sm:gap-3">
              {UNITS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center px-1"
                >
                  <span className="font-pixel text-[clamp(1rem,7.5vw,2.6rem)] leading-none tabular-nums text-white [text-shadow:0_3px_0_rgba(0,0,0,0.55)]">
                    {String(countdown[key]).padStart(2, '0')}
                  </span>
                  <span className="mt-1.5 font-pixel text-[0.42rem] tracking-[0.18em] text-white/65 sm:text-[0.55rem]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <PhaseBanner phase={countdown.phase} endsAtIso={endsAtIso} />
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseBanner({ phase, endsAtIso }: { phase: CountdownPhase; endsAtIso: string | null }) {
  if (phase === 'live') {
    return (
      <div className="flex flex-col items-center gap-2 px-2 text-center">
        <span className="font-pixel text-[clamp(0.7rem,3.4vw,1.15rem)] tracking-[0.2em] text-white [text-shadow:0_3px_0_rgba(0,0,0,0.5)]">
          IT&apos;S LIVE
        </span>
        <span className="inline-flex items-center gap-2 text-[0.6rem] font-semibold tracking-widest text-white/70 uppercase">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-ball-400" />
          doors open
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 px-2 text-center">
      <span className="font-pixel text-[clamp(0.6rem,3vw,1rem)] tracking-[0.2em] text-white/90 [text-shadow:0_3px_0_rgba(0,0,0,0.5)]">
        THE EVENT HAS ENDED
      </span>
      <span className="text-[0.6rem] text-white/60">
        {formatIstDateTime(endsAtIso) ?? EDIT_ME_TEXT}
      </span>
    </div>
  );
}

/**
 * Under the monitor: the exact instant being counted to.
 *
 * `label` must come from formatIstDateTime, which already appends the timezone
 * - adding it again here would print "12:00 IST IST".
 */
export function CountdownCaption({ label }: { label: string | null }) {
  return (
    <p className="mt-5 text-center text-sm text-shell-200/70">
      {label ? (
        <>
          <span className="font-pixel text-[0.55rem] tracking-[0.25em] text-shell-400">
            DOORS OPEN
          </span>
          <span className="mt-1.5 block text-base font-semibold text-shell-50">{label}</span>
        </>
      ) : (
        <EditMe>{EDIT_ME_TEXT}</EditMe>
      )}
    </p>
  );
}
