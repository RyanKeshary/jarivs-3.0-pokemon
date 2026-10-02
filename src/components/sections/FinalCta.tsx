import { motion, useReducedMotion } from 'framer-motion';

import { Art } from '../ui/Art';
import { ButtonLink } from '../ui/Button';
import { EditMe } from '../ui/EditMe';
import { Reveal } from '../ui/Reveal';
import { BALL_RED, pokeballBottom, pokeballTop } from '../../lib/assets';
import type { EventConfigRow } from '../../lib/database.types';
import type { FinalCtaContent } from '../../lib/content';
import { formatRemaining, isRegistrationOpen, parseDate } from '../../lib/time';

/**
 * Closing call to action: "Your journey begins" plus the register button.
 *
 * Shows the same disabled state as the hero when registration is closed, so the
 * two never disagree about whether you can still sign up.
 */
export function FinalCta({
  content,
  event,
  now,
}: {
  content: FinalCtaContent;
  event: EventConfigRow;
  now: number;
}) {
  const reduceMotion = useReducedMotion();
  const open = isRegistrationOpen(event.registration_deadline, event.registration_open, now);
  const deadlineMs = parseDate(event.registration_deadline)?.getTime() ?? 0;

  return (
    <section className="relative isolate overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10 opacity-40" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(169,29,38,0.32),transparent_70%)]"
      />

      <Reveal className="mx-auto max-w-3xl text-center">
        {/* A whole ball, opening. */}
        <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40" aria-hidden="true">
          <motion.div
            className="absolute inset-x-0 top-0 origin-bottom"
            animate={reduceMotion ? undefined : { y: -26, rotate: -14 }}
            transition={{ duration: 3.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <Art asset={pokeballTop} alt="" className="w-full select-none" />
          </motion.div>
          <motion.div
            className="absolute inset-x-0 bottom-0 origin-top"
            animate={reduceMotion ? undefined : { y: 22, rotate: 10 }}
            transition={{ duration: 3.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <Art asset={pokeballBottom} alt="" className="w-full select-none" />
          </motion.div>
        </div>

        <h2 className="mt-10 text-4xl font-bold tracking-tight text-balance text-shell-50 sm:text-5xl md:text-6xl">
          {content.heading}
        </h2>

        <div className="mx-auto mt-6 max-w-xl">
          {content.body ? (
            content.body.startsWith('[EDIT ME]') ? (
              <EditMe>{content.body}</EditMe>
            ) : (
              <p className="text-base leading-relaxed text-pretty text-shell-200/80 sm:text-lg">
                {content.body}
              </p>
            )
          ) : null}
        </div>

        <div className="mt-10 flex justify-center">
          {open ? (
            <ButtonLink to="/auth" className="text-sm">
              {content.primary_cta_label}
            </ButtonLink>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center justify-center rounded-full border-2 border-ink-600 bg-ink-800 px-7 py-3.5 font-pixel text-xs tracking-wider text-shell-600 uppercase"
            >
              Registration closed
            </span>
          )}
        </div>

        {open ? (
          <p className="mt-6 text-sm text-shell-400">
            Closes in{' '}
            <span className="font-semibold text-ball-200">{formatRemaining(deadlineMs - now)}</span>
          </p>
        ) : null}

        {/* Thin red rule, echoing the ball seam. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-14 h-1 w-40 rounded-full"
          style={{ backgroundColor: BALL_RED }}
        />
      </Reveal>
    </section>
  );
}
