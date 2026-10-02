import { motion, useReducedMotion } from 'framer-motion';

import { Art } from '../ui/Art';
import { EditMe } from '../ui/EditMe';
import { Reveal } from '../ui/Reveal';
import { SectionShell } from '../ui/SectionShell';
import { pokeballSeam } from '../../lib/assets';
import type { TimelineEventRow } from '../../lib/database.types';
import { formatIstDayMonth, formatIstTime, parseDate } from '../../lib/time';

/**
 * The route map.
 *
 * A vertical timeline that reads like a path across a game world, with a
 * Pokeball sitting on every stop. Vertical rather than horizontal on purpose: a
 * horizontal scroller hides content behind an interaction, and a route you have
 * to scroll sideways is a worse story on a phone.
 *
 * The connecting line is a single CSS gradient rather than a border per item, so
 * the layout does not reflow as stops are added or reordered in the database.
 */
export function Timeline({ stops, eyebrow, heading }: TimelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <SectionShell id="route" eyebrow={eyebrow} heading={heading} align="left">
      {stops.length === 0 ? (
        <Reveal className="max-w-xl">
          <div className="rounded-card border border-dashed border-white/15 bg-ink-800/40 p-8">
            <p className="text-sm text-shell-400">The route has not been mapped yet.</p>
            <p className="mt-3 text-xs text-shell-600">
              Insert rows into <code className="text-shell-400">timeline_events</code> and they
              will appear here in <code className="text-shell-400">sort_order</code>.
            </p>
          </div>
        </Reveal>
      ) : (
        <ol className="relative max-w-3xl pl-10 sm:pl-14">
          {/* The route itself. Fades out below the last stop so it reads as a
              path continuing into the distance rather than a cut-off line. */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-3.5 w-1 rounded-full bg-linear-to-b from-ball-500 via-ball-600 to-transparent sm:left-5"
          />

          {stops.map((stop) => (
            <TimelineStop
              key={stop.id}
              stop={stop}
              reduceMotion={reduceMotion}
            />
          ))}
        </ol>
      )}
    </SectionShell>
  );
}

interface TimelineProps {
  stops: TimelineEventRow[];
  eyebrow: string;
  heading: string;
}

function TimelineStop({ stop, reduceMotion }: { stop: TimelineEventRow; reduceMotion: boolean | null }) {
  // A stop with no confirmed time still belongs in the sequence - it just shows
  // the marker instead of a date.
  const hasDate = parseDate(stop.starts_at) !== null;
  const day = hasDate ? formatIstDayMonth(stop.starts_at) : null;
  const time = hasDate ? formatIstTime(stop.starts_at) : null;

  return (
    <Reveal as="li" className="relative pb-11 last:pb-0">
      {/* Node: the ball's seam, sitting on the route line. Same badge the cards
          use, so the two read as one visual language. */}
      <Art
        asset={pokeballSeam}
        alt=""
        className="absolute top-0 -left-9 h-8 w-auto select-none sm:-left-12"
      />

      <motion.div
        className={`rounded-card border p-5 transition-colors duration-300 sm:p-6 ${
          stop.is_highlight
            ? 'border-ball-500/40 bg-ball-900/20'
            : 'border-white/10 bg-ink-800/60'
        }`}
        // Gentle emphasis for the stops the organiser marked as key moments.
        initial={reduceMotion ? false : { scale: 1 }}
        whileHover={reduceMotion ? undefined : { scale: 1.012 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold text-balance text-shell-50 sm:text-xl">{stop.title}</h3>
          {stop.is_highlight ? (
            <span className="font-pixel text-[0.5rem] tracking-[0.2em] text-ball-200 uppercase">
              Key stop
            </span>
          ) : null}
        </div>

        <p className="mt-2 font-pixel text-[0.55rem] tracking-[0.2em] text-ball-400 uppercase">
          {hasDate ? (
            <>
              {day} · {time}
            </>
          ) : (
            <EditMe inline>Time not set</EditMe>
          )}
        </p>

        {stop.description ? (
          <p className="mt-3 text-sm leading-relaxed text-shell-200/80">{stop.description}</p>
        ) : null}

        {stop.location ? (
          <p className="mt-3 text-xs text-shell-400">
            {stop.location.startsWith('[EDIT ME]') ? (
              <EditMe inline>{stop.location}</EditMe>
            ) : (
              <>
                <span className="font-pixel text-[0.5rem] tracking-[0.2em] text-shell-600">
                  AT
                </span>{' '}
                {stop.location}
              </>
            )}
          </p>
        ) : null}
      </motion.div>
    </Reveal>
  );
}
