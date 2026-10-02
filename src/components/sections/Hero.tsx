import { motion, useReducedMotion } from 'framer-motion';

import { Art } from '../ui/Art';
import { ButtonAnchor, ButtonLink } from '../ui/Button';
import { Countdown, CountdownCaption } from '../ui/Countdown';
import { EditMe } from '../ui/EditMe';
import type { EventConfigRow } from '../../lib/database.types';
import { pokedexOpen, pokeballBottom, pokeballTop } from '../../lib/assets';
import type { HeroContent } from '../../lib/content';
import { formatIstDateTime, formatRemaining, isRegistrationOpen, parseDate } from '../../lib/time';
import { useNow } from '../../hooks/useNow';

interface HeroProps {
  event: EventConfigRow;
  content: HeroContent;
}

/**
 * The opening screen: event name, tagline, live countdown, deadline, CTA.
 *
 * Everything time-related is read from `event_config` and kept current by the
 * realtime subscription in useLandingRealtime, so an admin editing the date sees
 * the change land here without a refresh.
 */
export function Hero({ event, content }: HeroProps) {
  const now = useNow(1000);
  const reduceMotion = useReducedMotion();

  // parseDate returns null for a missing or malformed deadline; isRegistrationOpen
  // already returned false in that case, so the fallback here is only cosmetic.
  const startsAt = formatIstDateTime(event.event_starts_at);
  const deadlineMs = parseDate(event.registration_deadline)?.getTime() ?? 0;
  const registrationOpen = isRegistrationOpen(
    event.registration_deadline,
    event.registration_open,
    now,
  );

  return (
    <section
      id="top"
      className="bg-hero-wash relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16 sm:pt-28"
    >
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10 opacity-60" />

      {/* Rotating red halo behind the title. */}
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(169,29,38,0.32),transparent_62%)] animate-glow"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />

      {/* Pokedex, tilted, sitting behind the monitor. */}
      <motion.div
        aria-hidden="true"
        className="absolute -right-6 bottom-16 -z-10 hidden w-40 opacity-25 lg:block"
        animate={reduceMotion ? undefined : { y: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Art asset={pokedexOpen} alt="" className="w-full select-none" />
      </motion.div>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ---------------- copy column ---------------- */}
          <div className="text-center lg:text-left">
            <motion.p
              className="font-pixel text-[0.55rem] tracking-[0.3em] text-ball-400 uppercase sm:text-[0.6rem]"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {content.kicker.startsWith('[EDIT ME]') ? <EditMe inline>{content.kicker}</EditMe> : content.kicker}
            </motion.p>

            <motion.h1
              className="mt-6 text-[clamp(2.5rem,9vw,5.25rem)] leading-[0.95] font-bold tracking-tight text-balance"
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <span className="text-chrome block">{event.event_name}</span>
            </motion.h1>

            <motion.p
              className="mt-6 font-pixel text-sm text-ball-200 text-balance sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
            >
              {event.tagline}
            </motion.p>

            {/* Two Pokeball halves flanking the tagline rule. */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-4 lg:justify-start"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              aria-hidden="true"
            >
              <Art asset={pokeballTop} alt="" className="h-5 w-10 -scale-x-100 select-none" />
              <span className="h-px w-16 bg-linear-to-r from-transparent to-shell-400/50" />
              <Art asset={pokeballBottom} alt="" className="h-5 w-10 select-none" />
            </motion.div>

            <motion.p
              className="mt-8 text-base text-shell-200/80 sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
            >
              {startsAt ? (
                <>
                  <span className="font-pixel text-[0.55rem] tracking-[0.25em] text-shell-400">
                    STARTS
                  </span>
                  <span className="mt-1.5 block text-xl font-semibold text-shell-50">{startsAt}</span>
                </>
              ) : (
                <EditMe>Event start time not set</EditMe>
              )}
            </motion.p>

            {/* ---------------- CTAs ---------------- */}
            <motion.div
              className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
            >
              {registrationOpen ? (
                <ButtonLink to="/auth" className="text-sm">
                  {content.primary_cta_label}
                </ButtonLink>
              ) : (
                // Same size, but clearly not a link anywhere: registration is
                // closed, and pretending otherwise would be a lie.
                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-full border-2 border-ink-600 bg-ink-800 px-7 py-3.5 font-pixel text-xs tracking-wider text-shell-600 uppercase"
                >
                  Registration closed
                </span>
              )}
              <ButtonAnchor href="#route" variant="secondary" className="text-sm">
                {content.secondary_cta_label}
              </ButtonAnchor>
            </motion.div>

            {/* ---------------- deadline ---------------- */}
            <motion.p
              className="mt-6 text-sm text-shell-400"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {registrationOpen ? (
                <>
                  Registrations close in{' '}
                  <span className="font-semibold text-ball-200">
                    {formatRemaining(deadlineMs - now)}
                  </span>
                </>
              ) : (
                'Registrations are closed for now.'
              )}
            </motion.p>
          </div>

          {/* ---------------- countdown column ---------------- */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="order-first lg:order-none"
          >
            <Countdown
              targetIso={event.countdown_target}
              endsAtIso={event.event_ends_at}
            />
            <CountdownCaption label={formatIstDateTime(event.event_starts_at)} />
          </motion.div>
        </div>
      </div>

      {/* ---------------- scroll hint ---------------- */}
      <a
        href="#about"
        className="absolute inset-x-0 bottom-6 mx-auto hidden w-fit flex-col items-center gap-2 text-shell-400 transition hover:text-shell-100 sm:flex"
        aria-label={content.scroll_hint}
      >
        <span className="font-pixel text-[0.5rem] tracking-[0.3em] uppercase">
          {content.scroll_hint}
        </span>
        <motion.svg
          width="16"
          height="22"
          viewBox="0 0 16 22"
          fill="none"
          aria-hidden="true"
          animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M8 2v16m0 0l-5-5m5 5l5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </a>
    </section>
  );
}
