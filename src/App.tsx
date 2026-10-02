import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { PokeballTransition } from './components/transition/PokeballTransition';
import { hasSeenIntro, markIntroSeen } from './lib/session-flag';

/**
 * Route-level code splitting.
 *
 * The landing page is the entry route so it is in the main bundle. /auth is
 * only reached by clicking a button, so it is a separate chunk that a first-time
 * visitor never downloads.
 *
 * IntroScene is split again, and separately from Landing: a visitor who has
 * already seen the intro this session skips both the import *and* the video.
 */
const Landing = lazy(() => import('./routes/Landing'));
const Auth = lazy(() => import('./routes/Auth'));
const Center = lazy(() => import('./routes/center'));
const AdminRoutes = lazy(() => import('./routes/admin-routes'));
const IntroScene = lazy(() => import('./components/intro/IntroScene'));

/** Black screen while the intro chunk and the 4MB video arrive. */
function IntroFallback() {
  return <div className="fixed inset-0 z-50 bg-ink-950" aria-hidden="true" />;
}

/** Neutral placeholder for a route chunk that is still downloading. */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-shell-100/15 border-t-ball-500" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

type Phase = 'intro' | 'transition' | 'done';

export default function App() {
  const location = useLocation();

  // The intro is the landing page's greeting. Running it on /auth would mean
  // making someone sit through a 60-second opening before they can type a
  // password, so deep links to auth go straight to the form.
  const isLanding = location.pathname === '/';

  // sessionStorage is read once, during the initial render, via the lazy
  // initialiser. Doing it in an effect would mean rendering the landing page
  // for a frame before covering it with the intro - a visible flash.
  const [phase, setPhase] = useState<Phase>(() => (hasSeenIntro() ? 'done' : 'intro'));

  // True until the first effect run. Used to tell the initial mount apart from
  // a real navigation: without it, the effect below fires on mount and skips
  // the intro before it has had a chance to play.
  const isFirstRender = useRef(true);

  // Flag it as soon as the intro is shown, not when it finishes. If a visitor
  // reloads mid-intro they should not be made to watch it from the start again.
  // Gated on isLanding so that deep-linking straight to /auth does not consume
  // the one viewing they are still owed on the landing page.
  useEffect(() => {
    if (isLanding && phase === 'intro') markIntroSeen();
  }, [isLanding, phase]);

  // Any real navigation ends the sequence outright - no video left playing
  // under the next route, and no Pokeball wipe on a page that is not the
  // landing page. Coming back will not replay it: the flag is already set.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPhase('done');
  }, [location.pathname]);

  const handleIntroFinish = useCallback(() => setPhase('transition'), []);
  const handleTransitionComplete = useCallback(() => setPhase('done'), []);

  return (
    <>
      {/*
        The landing page is always mounted underneath, so the Pokeball wipe
        reveals content that is already painted and scrolled to the top. If it
        were mounted after the wipe there would be a blank frame.
      */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="auth" element={<Auth />} />
          <Route path="center" element={<Center />} />
          <Route path="admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>

      {isLanding && phase === 'intro' ? (
        <Suspense fallback={<IntroFallback />}>
          <IntroScene onFinish={handleIntroFinish} />
        </Suspense>
      ) : null}

      {isLanding && phase === 'transition' ? (
        <PokeballTransition onComplete={handleTransitionComplete} />
      ) : null}
    </>
  );
}
