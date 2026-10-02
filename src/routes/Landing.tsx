import { Suspense, lazy, useEffect } from 'react';

import { EditMe } from '../components/ui/EditMe';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { useContentBlocks } from '../hooks/useContentBlocks';
import { useEventConfig } from '../hooks/useEventConfig';
import { useLandingRealtime } from '../hooks/useLandingRealtime';
import { useNow } from '../hooks/useNow';
import { useTimeline } from '../hooks/useTimeline';

/**
 * Below-the-fold sections.
 *
 * Each is a separate chunk, mounted immediately but resolved through Suspense.
 * That combination is deliberate:
 *  - the browser starts downloading these chunks as soon as the hero paints, so
 *    scrolling never waits on the network;
 *  - they stay out of the initial bundle, which is what keeps it small.
 *
 * The min-height on each fallback reserves the space the section will occupy,
 * so resolving a chunk does not shift the page.
 */
const About = lazy(() => import('../components/sections/About').then((m) => ({ default: m.About })));
const EventDetails = lazy(() =>
  import('../components/sections/EventDetails').then((m) => ({ default: m.EventDetails })),
);
const Timeline = lazy(() =>
  import('../components/sections/Timeline').then((m) => ({ default: m.Timeline })),
);
const FinalCta = lazy(() =>
  import('../components/sections/FinalCta').then((m) => ({ default: m.FinalCta })),
);
const Footer = lazy(() => import('../components/layout/Footer').then((m) => ({ default: m.Footer })));

function SectionFallback({ minHeight }: { minHeight: string }) {
  return <div className="mx-auto w-full max-w-6xl px-5 sm:px-8" style={{ minHeight }} aria-hidden="true" />;
}

/** Shown only if the event_config row cannot be read at all. */
function ConfigError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5">
      <div className="w-full max-w-lg rounded-card border border-ball-500/40 bg-ink-800 p-8 text-center">
        <p className="font-pixel text-[0.55rem] tracking-[0.25em] text-ball-400 uppercase">
          Event data unavailable
        </p>
        <h1 className="mt-4 text-2xl font-bold text-shell-50">
          We could not load the event details
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-shell-200/75">
          The page needs a row in <code className="text-shell-400">event_config</code> and the{' '}
          <code className="text-shell-400">anon</code> role to be allowed to read it. If the
          migrations have not been applied yet, run{' '}
          <code className="text-shell-400">npm run db:push</code>.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-ink-950 p-4 text-left text-xs whitespace-pre-wrap text-shell-400">
          {message}
        </pre>
      </div>
    </div>
  );
}

export default function Landing() {
  const eventQuery = useEventConfig();
  const blocksQuery = useContentBlocks();
  const timelineQuery = useTimeline();
  const now = useNow(1000);

  // One websocket for the whole page: any edit to these tables updates every
  // open tab without a refresh.
  useLandingRealtime();

  // Keep the tab title and share text in step with the database, so retitling
  // the event does not need a rebuild. index.html still holds the pre-JS values
  // for crawlers.
  useEffect(() => {
    if (!eventQuery.data) return;
    const { event_name, tagline } = eventQuery.data;
    document.title = event_name;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        'content',
        `${event_name}. ${tagline} A Pokémon-themed hackathon at SLRTCE: form a team, combine your forces, and defeat the gym leaders.`,
      );
    }
  }, [eventQuery.data]);

  if (eventQuery.isError) {
    return <ConfigError message={eventQuery.error.message} />;
  }

  // Until event_config resolves we render the navbar-free shell only. A hero
  // with no date or countdown would be worse than a brief spinner, and the
  // intro/transition overlay is covering this frame on a first visit anyway.
  if (!eventQuery.data || !blocksQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-shell-100/15 border-t-ball-500" />
        <span className="sr-only">Loading event</span>
      </div>
    );
  }

  const blocks = blocksQuery.data;

  return (
    <>
      <a href="#about" className="skip-link rounded-full bg-ball-500 px-4 py-2 font-pixel text-[0.55rem] text-shell-50">
        Skip to content
      </a>

      <Navbar content={blocks['landing.navbar']} />

      <main>
        <Hero event={eventQuery.data} content={blocks['landing.hero']} />

        <Suspense fallback={<SectionFallback minHeight="40rem" />}>
          <About content={blocks['landing.about']} />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="32rem" />}>
          <EventDetails content={blocks['landing.event_details']} event={eventQuery.data} now={now} />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="48rem" />}>
          <Timeline
            stops={timelineQuery.data ?? []}
            eyebrow={blocks['landing.timeline'].eyebrow}
            heading={blocks['landing.timeline'].heading}
          />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="28rem" />}>
          <FinalCta content={blocks['landing.final_cta']} event={eventQuery.data} now={now} />
        </Suspense>
      </main>

      <Suspense fallback={<SectionFallback minHeight="18rem" />}>
        <Footer content={blocks['landing.footer']} />
      </Suspense>

      {/*
        A single place for unconfirmed values that did not fit inside a section's
        own layout. Kept deliberately small and out of the way.
      */}
      <UnconfirmedSummary />
    </>
  );
}

/**
 * Not a section - a development aid. It lists the [EDIT ME] placeholders that
 * are still live on the page so whoever is filling them in can see the full list
 * in one place. Delete this component (and the import above) once the copy is
 * finished.
 */
function UnconfirmedSummary() {
  const blocksQuery = useContentBlocks();
  if (!blocksQuery.data) return null;

  return (
    <details className="border-t border-white/10 bg-ink-950 px-5 py-6 sm:px-8">
      <summary className="cursor-pointer font-pixel text-[0.5rem] tracking-[0.25em] text-shell-600 uppercase">
        Content still to supply
      </summary>
      <div className="mx-auto mt-4 max-w-4xl">
        <EditMe inline>Delete this block once the copy below is filled in.</EditMe>
        <ul className="mt-4 grid gap-2 text-xs text-shell-400 sm:grid-cols-2">
          {Object.entries(blocksQuery.data).map(([key, value]) => {
            const text = JSON.stringify(value);
            const count = (text.match(/\[EDIT ME\]/g) ?? []).length;
            if (count === 0) return null;
            return (
              <li key={key} className="flex items-center justify-between gap-3 rounded border border-white/5 px-3 py-2">
                <code className="truncate">{key}</code>
                <span className="shrink-0 text-ball-400">
                  {count} placeholder{count === 1 ? '' : 's'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
