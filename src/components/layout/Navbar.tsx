'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Play } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface NavbarProps {
  onRegisterClick?: () => void;
  onReplayIntro?: () => void;
}

type NavAnimationPhase = 'closed' | 'rotating' | 'splitting' | 'open' | 'closing';

export function Navbar({ onRegisterClick, onReplayIntro }: NavbarProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<'home' | 'events' | 'announcements' | 'schedule' | 'join' | 'contact'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasMaxEvents, setHasMaxEvents] = useState(false);

  // Animation phase state machine
  const [phase, setPhase] = useState<NavAnimationPhase>('closed');
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Timers
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceTimersRef = useRef<NodeJS.Timeout[]>([]);

  const isExpanded = phase === 'splitting' || phase === 'open' || mobileMenuOpen;

  // Clear all pending transition timers
  const clearSequenceTimers = () => {
    sequenceTimersRef.current.forEach((t) => clearTimeout(t));
    sequenceTimersRef.current = [];
  };

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      const isLoggedOut =
        typeof window !== 'undefined' &&
        localStorage.getItem('indigo_logged_out') === 'true';

      const isReg =
        typeof window !== 'undefined' &&
        localStorage.getItem('indigo_user_registered') === 'true';
      const eventsCount =
        typeof window !== 'undefined'
          ? parseInt(localStorage.getItem('indigo_user_events_count') || '0', 10)
          : 0;

      const isMaxReached = !isLoggedOut && (isReg || eventsCount >= 2);

      if (isMounted) {
        setHasMaxEvents(isMaxReached);
      }
    };

    checkStatus();

    const handleCustomEvent = () => checkStatus();
    window.addEventListener('storage', handleCustomEvent);
    window.addEventListener('auth_state_change', handleCustomEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleCustomEvent);
      window.removeEventListener('auth_state_change', handleCustomEvent);
      clearSequenceTimers();
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 280;
      const sections = ['join', 'schedule', 'announcements', 'events', 'home'] as const;

      for (const section of sections) {
        const el =
          document.getElementById(section) ||
          (section === 'join' ? document.getElementById('how-to-join') : null) ||
          (section === 'schedule' ? document.getElementById('timeline') : null);

        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard accessibility: Escape to collapse, Space/Enter to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  /* ========================================================
     ANIMATION TRIGGER LOGIC
     ======================================================== */
  const handleOpenSequence = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (phase === 'open' || phase === 'splitting' || phase === 'rotating') return;

    clearSequenceTimers();

    // STEP 1: ROTATE ONCE (360° spin while Pokéball stays completely closed)
    setPhase('rotating');

    try {
      playRetroBeep(780, 'square', 0.04);
    } catch {}

    // STEP 2: SPLIT SEAM & EMERGE NAVBAR AFTER ROTATION FINISHES (230ms)
    const tSplit = setTimeout(() => {
      setPhase('splitting');
    }, 230);

    // STEP 3: REACH FULLY EXPANDED STABLE STATE (480ms)
    const tOpen = setTimeout(() => {
      setPhase('open');
    }, 480);

    sequenceTimersRef.current.push(tSplit, tOpen);
  };

  const handleCollapse = () => {
    clearSequenceTimers();
    setIsPinned(false);
    setMobileMenuOpen(false);

    if (phase === 'closed') return;

    setPhase('closing');

    // Reverse animation takes ~360ms:
    // Navbar collapses to center, halves rejoin, reverse rotation settle
    const tClose = setTimeout(() => {
      setPhase('closed');
    }, 360);

    sequenceTimersRef.current.push(tClose);
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    handleOpenSequence();
  };

  const handleMouseLeave = () => {
    if (isPinned || mobileMenuOpen) return;

    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);

    // 160ms grace window so cursor movement between items never flickers or drops
    leaveTimerRef.current = setTimeout(() => {
      handleCollapse();
    }, 160);
  };

  const handlePokeballFocus = () => {
    setIsFocused(true);
    handleOpenSequence();
  };

  const handlePokeballBlur = () => {
    setIsFocused(false);
    if (!isPinned && !mobileMenuOpen) {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = setTimeout(() => {
        handleCollapse();
      }, 200);
    }
  };

  const handlePokeballClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase === 'closed') {
      setIsPinned(true);
      handleOpenSequence();
    } else {
      setIsPinned((prev) => !prev);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    handleCollapse();

    // Support canonical targets and aliases
    const targetId =
      id === 'join'
        ? (document.getElementById('join') ? 'join' : 'how-to-join')
        : id === 'schedule'
        ? (document.getElementById('schedule') ? 'schedule' : 'timeline')
        : id;

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = `/#${id}`;
      }
    }
  };

  const navLinks: { id: string; label: string; shortLabel: string; href?: string; icon: string; desc: string }[] = [
    { id: 'events', label: 'THE 7 DISCIPLINES', shortLabel: '7 DISCIPLINES', icon: '⚔️', desc: 'Hackathons & Contests' },
    { id: 'announcements', label: 'NOTICES', shortLabel: 'NOTICES', icon: '📢', desc: 'Live Bulletins' },
    { id: 'schedule', label: 'SCHEDULE', shortLabel: 'SCHEDULE', icon: '📅', desc: 'Timeline & Rounds' },
    { id: 'join', label: 'HOW TO JOIN', shortLabel: 'HOW TO JOIN', icon: '⚡', desc: 'Rules & Protocols' },
    { id: 'contact', label: 'HELPLINE', shortLabel: 'HELPLINE', href: '/contact', icon: '📞', desc: 'Help & Queries' },
  ];

  return (
    <header className="fixed top-2 sm:top-3.5 left-0 right-0 z-40 select-none px-2 sm:px-6 pointer-events-none flex justify-center">
      {/* 
        PARENT INTERACTION CONTAINER:
        - When closed: Compact hit area around the single Pokéball.
        - When expanded: Spans the full width of the navbar so moving cursor to any
          link keeps the navigation open seamlessly without jitter.
      */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto relative flex items-center justify-center transition-all duration-200 z-20 ${
          isExpanded ? 'w-full max-w-7xl' : 'w-[56px] h-[56px]'
        }`}
      >

        {/* ========================================================
            1. THE POKÉBALL INTERACTION ELEMENT
            Visible when closed, rotating, splitting, or closing.
            Disappears completely once the navbar reaches its final position.
           ======================================================== */}
        <div
          className={`absolute z-30 transition-all ${
            phase === 'open' ? 'pointer-events-none opacity-0 invisible' : 'opacity-100 visible'
          }`}
        >
          {/* Pokéball Container with keyboard accessibility */}
          <button
            type="button"
            tabIndex={0}
            onClick={handlePokeballClick}
            onFocus={handlePokeballFocus}
            onBlur={handlePokeballBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (phase === 'closed') handleOpenSequence();
                else handleCollapse();
              }
            }}
            aria-label="Toggle Navigation Menu"
            aria-expanded={isExpanded}
            className="group relative w-[48px] h-[48px] flex flex-col items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D21319] focus-visible:ring-offset-2 rounded-full p-0 bg-transparent border-0"
            style={{
              perspective: '600px',
            }}
            title="Hover or tap Pokéball to open navigation"
          >
            {/* The Rotating Pokéball Core Wrapper */}
            <motion.div
              animate={
                phase === 'rotating'
                  ? {
                      rotate: [0, 360],
                      scale: [1, 1.15, 1],
                      transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
                    }
                  : phase === 'splitting'
                  ? {
                      rotate: 360,
                      scale: 1,
                    }
                  : phase === 'closing'
                  ? {
                      rotate: [360, 0],
                      scale: [1, 1],
                      transition: { duration: 0.16, ease: 'easeOut', delay: 0.14 },
                    }
                  : { rotate: 0, scale: 1 }
              }
              className="relative w-[48px] h-[48px] flex flex-col items-center justify-center origin-center"
            >
              {/* TOP HALF */}
              <motion.img
                src="/assets/pokeball-top.png"
                alt="Pokéball Top Half"
                animate={
                  phase === 'rotating'
                    ? { y: 0, opacity: 1 }
                    : phase === 'splitting'
                    ? {
                        y: [-2, -38, -48],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                      }
                    : phase === 'closing'
                    ? {
                        y: [-38, 0],
                        opacity: [1, 1],
                        transition: { duration: 0.16, ease: 'easeInOut' },
                      }
                    : { y: 0, opacity: 1 }
                }
                className="w-[48px] h-[24px] object-contain block select-none pointer-events-none group-hover:-translate-y-0.5 transition-transform duration-150"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* BOTTOM HALF */}
              <motion.img
                src="/assets/pokeball-bottom.png"
                alt="Pokéball Bottom Half"
                animate={
                  phase === 'rotating'
                    ? { y: 0, opacity: 1 }
                    : phase === 'splitting'
                    ? {
                        y: [2, 38, 48],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                      }
                    : phase === 'closing'
                    ? {
                        y: [38, 0],
                        opacity: [1, 1],
                        transition: { duration: 0.16, ease: 'easeInOut' },
                      }
                    : { y: 0, opacity: 1 }
                }
                className="w-[48px] h-[24px] object-contain block select-none pointer-events-none group-hover:translate-y-0.5 transition-transform duration-150 -mt-[1px]"
                style={{ imageRendering: 'pixelated' }}
              />
            </motion.div>
          </button>
        </div>


        {/* ========================================================
            2. THE EXPANDED NAVBAR
            Emerges from the center of the Pokéball as it opens.
            Full responsive design: fits all mobile proportions without clipping.
           ======================================================== */}
        {/* ========================================================
            2. DESKTOP EXPANDED FLOATING NAVBAR (>= lg: 1024px)
            Emerges from the center of the Pokéball as it opens.
           ======================================================== */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="desktop-expanded-navbar"
              initial={{ scale: 0.25, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.25, opacity: 0, y: 0 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="hidden lg:flex relative w-full max-w-7xl bg-[#121633]/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9),_0_0_25px_rgba(210,19,25,0.25)] rounded-2xl p-2.5 px-6 items-center justify-between gap-4 z-20"
            >
              {/* BRANDMARK */}
              <Link
                href="/"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                    e.preventDefault();
                    scrollToSection('home');
                  } else {
                    handleCollapse();
                  }
                }}
                className="flex items-center gap-2.5 group cursor-pointer shrink-0"
              >
                <span className="w-2.5 h-2.5 bg-[#D21319] group-hover:scale-125 transition-transform rounded-xs shadow-[0_0_8px_#D21319]" />
                <div className="flex flex-col">
                  <span className="font-serif text-lg font-black tracking-tight text-[#D21319] group-hover:text-white transition-colors leading-none uppercase">
                    INDIGO TECH FEST
                  </span>
                  <span className="label-editorial text-[8px] text-[#AFAEA2] tracking-[0.25em] mt-0.5">
                    JARVIS 3.0
                  </span>
                </div>
              </Link>

              {/* DESKTOP NAV LINKS */}
              <nav className="flex items-center gap-6">
                {navLinks.map((link, index) => {
                  const isActive = activeSection === link.id;
                  const delay = 0.06 + index * 0.025;

                  if (link.href) {
                    const isLinkActive = pathname === link.href || activeSection === link.id;
                    return (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, delay }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => handleCollapse()}
                          className={`relative font-grotesk text-xs uppercase tracking-[0.2em] transition-colors py-1 whitespace-nowrap ${
                            isLinkActive
                              ? 'text-white font-bold'
                              : 'text-[#AFAEA2] hover:text-white'
                          }`}
                        >
                          {link.label}
                          {isLinkActive && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D21319] shadow-[0_0_8px_#D21319]" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18, delay }}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection(link.id)}
                        className={`relative font-grotesk text-xs uppercase tracking-[0.2em] transition-colors py-1 cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-[#AFAEA2] hover:text-white'
                        }`}
                      >
                        {link.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D21319] shadow-[0_0_8px_#D21319]" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </nav>

              {/* DESKTOP RIGHT ACTIONS */}
              <div className="flex items-center gap-2.5 shrink-0">
                {onReplayIntro && (
                  <button
                    type="button"
                    onClick={onReplayIntro}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#E9E6DA] bg-black/40 hover:bg-[#D21319] hover:text-white border border-[#AFAEA2]/40 hover:border-[#D21319] rounded-lg transition-all cursor-pointer"
                    title="Play 1008.mp4 Intro Video"
                  >
                    <Play size={11} className="fill-current text-[#D21319] hover:text-white" />
                    <span>INTRO FILM</span>
                  </button>
                )}

                {!hasMaxEvents && (
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="px-4 py-2 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_12px_rgba(210,19,25,0.4)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ENLIST SQUAD</span>
                    <span>→</span>
                  </button>
                )}

                <Link
                  href="/admin"
                  className="inline-flex items-center px-3 py-2 text-xs font-mono font-bold text-[#AFAEA2] hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors cursor-pointer"
                  title="Curator & Admin Panel"
                >
                  [ ADMIN ]
                </Link>

                <button
                  type="button"
                  onClick={handleCollapse}
                  className="p-1.5 text-[#AFAEA2] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close navigation back to Pokéball"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ========================================================
          3. MOBILE MINIMALISTIC SIDEBAR (< lg: 1024px)
          Sleek, modern slide-in drawer on the right edge.
         ======================================================== */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Dimmed Backdrop Overlay */}
            <motion.div
              key="mobile-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCollapse}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 pointer-events-auto lg:hidden"
              aria-hidden="true"
            />

            {/* Minimalist Slide-In Sidebar */}
            <motion.aside
              key="mobile-minimalist-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-[290px] sm:w-[320px] max-w-[85vw] bg-[#0A0D1E]/98 backdrop-blur-2xl border-l border-white/10 z-50 pointer-events-auto flex flex-col justify-between p-6 shadow-[-15px_0_50px_rgba(0,0,0,0.85)] lg:hidden overflow-y-auto no-scrollbar"
            >
              {/* Top Section */}
              <div className="flex flex-col space-y-6">
                {/* Header: Brand & Close */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <Link
                    href="/"
                    onClick={(e) => {
                      if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                        e.preventDefault();
                        scrollToSection('home');
                      } else {
                        handleCollapse();
                      }
                    }}
                    className="flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span className="w-2 h-2 bg-[#D21319] rounded-xs shadow-[0_0_8px_#D21319] shrink-0 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-serif text-sm font-black tracking-wider text-[#D21319] group-hover:text-white transition-colors leading-none uppercase">
                        INDIGO TECH FEST
                      </span>
                      <span className="font-mono text-[8px] text-[#AFAEA2] tracking-[0.22em] mt-1">
                        JARVIS 3.0 · SLRTCE
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleCollapse}
                    className="p-1.5 text-[#AFAEA2] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-90"
                    title="Close sidebar"
                    aria-label="Close sidebar"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Minimalist Navigation Index */}
                <div className="flex flex-col">
                  <div className="text-[9px] font-mono text-[#AFAEA2]/50 tracking-[0.25em] uppercase pb-3">
                    NAVIGATION INDEX
                  </div>

                  <nav className="flex flex-col space-y-3.5">
                    {navLinks.map((link, idx) => {
                      const isActive = activeSection === link.id;
                      const indexStr = `0${idx + 1}`;

                      if (link.href) {
                        const isLinkActive = pathname === link.href || activeSection === link.id;
                        return (
                          <Link
                            key={link.id}
                            href={link.href}
                            onClick={() => handleCollapse()}
                            className="flex items-center justify-between group py-1.5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-mono text-[10px] tracking-widest ${
                                isLinkActive ? 'text-[#D21319] font-bold' : 'text-[#D21319]/70'
                              }`}>
                                {indexStr}
                              </span>
                              <span className={`font-grotesk text-xs tracking-[0.18em] uppercase transition-colors ${
                                isLinkActive
                                  ? 'text-white font-bold'
                                  : 'text-[#AFAEA2] group-hover:text-white'
                              }`}>
                                {link.label}
                              </span>
                            </div>
                            <ChevronRight size={13} className="text-[#AFAEA2]/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => scrollToSection(link.id)}
                          className="flex items-center justify-between group py-1.5 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-[10px] tracking-widest ${
                              isActive ? 'text-[#D21319] font-bold' : 'text-[#D21319]/70'
                            }`}>
                              {indexStr}
                            </span>
                            <span className={`font-grotesk text-xs tracking-[0.18em] uppercase transition-colors ${
                              isActive
                                ? 'text-white font-bold'
                                : 'text-[#AFAEA2] group-hover:text-white'
                            }`}>
                              {link.label}
                            </span>
                          </div>
                          {isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D21319] shadow-[0_0_6px_#D21319]" />
                          ) : (
                            <ChevronRight size={13} className="text-[#AFAEA2]/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Bottom Section: Actions & Telemetry */}
              <div className="flex flex-col space-y-3 pt-6 border-t border-white/10">
                {!hasMaxEvents && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCollapse();
                      if (onRegisterClick) onRegisterClick();
                    }}
                    className="w-full py-2.5 px-4 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(210,19,25,0.35)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>ENLIST SQUAD NOW</span>
                    <span>→</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onReplayIntro && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCollapse();
                        onReplayIntro();
                      }}
                      className="py-2 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Play size={10} className="fill-current text-amber-400" />
                      <span>INTRO FILM</span>
                    </button>
                  )}

                  <Link
                    href="/admin"
                    onClick={() => handleCollapse()}
                    className="py-2 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#AFAEA2] hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition active:scale-95 text-center"
                  >
                    <span>[ ADMIN ]</span>
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-2 text-[8px] font-mono text-[#AFAEA2]/40 uppercase tracking-widest">
                  <span>TELEMETRY: VER 3.0</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}
