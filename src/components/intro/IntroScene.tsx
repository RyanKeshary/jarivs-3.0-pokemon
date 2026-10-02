import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Full-screen opening scene, shown once per browser session.
 *
 * Performance notes, because this is by far the heaviest thing on the site:
 *  - This whole file is a separate lazy chunk. A visitor who has already seen the
 *    intro never downloads the JS.
 *  - The 4MB video is referenced by a plain string in /public, and the <video>
 *    element is not even mounted until this chunk loads. A returning visitor
 *    fetches neither the code nor the video.
 *  - `preload="none"` stops the browser speculatively downloading it before the
 *    component is ready; we call play() explicitly instead.
 *  - The video is muted by default. Browsers block autoplay with sound, and
 *    muting on load is what makes autoplay work at all. The visitor can turn
 *    sound on with one tap.
 */
export default function IntroScene({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();

  // Autoplay can still be refused (low power mode, data saver). If play()
  // rejects, show the poster-ish state and let Skip be the only way out rather
  // than trapping the visitor behind a video that will not start.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => setFailed(true));
    }
  }, []);

  // Autoplay muted is allowed, but if a user has a system-level "block media"
  // setting we still need a keyboard-reachable way out.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onFinish]);

  const toggleMuted = useCallback(() => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
      // Unmuting while paused should not start playback unexpectedly.
      if (!next && videoRef.current.paused) void videoRef.current.play().catch(() => setFailed(true));
    }
  }, [muted]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      role="dialog"
      aria-label="Kanto League opening"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        // No <source> list: a single mp4 the browser either plays or ignores.
        // This file lives in /public so the URL is stable and cacheable.
        src="/media/intro-theme.mp4"
        preload="none"
        playsInline
        autoPlay
        muted
        loop={false}
        onCanPlay={() => setReady(true)}
        onEnded={onFinish}
        onError={() => setFailed(true)}
      />

      {/* Legibility scrim. Cheap, and without it the pixel UI over bright
          frames becomes unreadable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-ink-950/70 via-ink-950/20 to-ink-950/85"
      />

      {/* Vignette, so the controls at the corners stay legible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_40px_rgba(6,5,10,0.9)]"
      />

      {!ready && !failed ? (
        <div className="relative flex flex-col items-center gap-4">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-shell-100/20 border-t-ball-500" />
          <p className="font-pixel text-[0.55rem] tracking-[0.3em] text-shell-400">LOADING</p>
        </div>
      ) : null}

      {failed ? (
        <div className="relative px-6 text-center">
          <p className="font-pixel text-[0.6rem] tracking-[0.25em] text-shell-400">
            INTRO UNAVAILABLE
          </p>
          <p className="mt-3 max-w-sm text-sm text-shell-200/70">
            The opening video could not be played on this device. Continue to the event.
          </p>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Controls                                                         */}
      {/* ---------------------------------------------------------------- */}

      {/* Mute toggle: top left, as specified. */}
      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute intro' : 'Mute intro'}
        className="absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-shell-100/25 bg-ink-950/60 text-shell-100 backdrop-blur-sm transition hover:border-shell-100/60 hover:bg-ink-950/80 active:scale-95"
      >
        <SpeakerIcon muted={muted} />
      </button>

      {/* Skip: bottom right, as specified. Also reachable with Escape. */}
      <button
        type="button"
        onClick={onFinish}
        className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full border-2 border-shell-100/25 bg-ink-950/60 px-5 py-3 font-pixel text-[0.55rem] tracking-[0.2em] text-shell-100 uppercase backdrop-blur-sm transition hover:border-shell-100/60 hover:bg-ink-950/80 active:scale-95"
      >
        Skip
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M2 2 L12 7 L2 12 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 7h2.5L9 4v10L5.5 11H3V7Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {muted ? (
        <>
          <path d="M12 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 7l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path
            d="M12 6.2c1.3 1.3 1.3 4.3 0 5.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14.2 4.4c2.4 2.4 2.4 6.8 0 9.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
