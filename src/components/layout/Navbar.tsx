'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Play } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface NavbarProps {
  onRegisterClick?: () => void;
  onReplayIntro?: () => void;
}

type NavAnimationPhase = 'closed' | 'rotating' | 'splitting' | 'open' | 'closing';

export function Navbar({ onRegisterClick, onReplayIntro }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'events' | 'schedule' | 'join'>('home');
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
      const scrollPos = window.scrollY + 200;
      const sections = ['join', 'schedule', 'announcements', 'events', 'home'] as const;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(section as any);
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
      handleOpenSequence();
    } else {
      setIsPinned((prev) => !prev);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    handleCollapse();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
        className={`pointer-events-auto relative flex items-center justify-center transition-all duration-200 ${
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
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="expanded-navbar-bar"
              initial={{ scale: 0.25, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.25, opacity: 0, y: 0 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative w-full bg-[#161A35]/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.85),_0_0_20px_rgba(210,19,25,0.25)] rounded-2xl p-2 sm:p-2.5 lg:px-6 overflow-hidden z-20"
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                
                {/* BRANDMARK */}
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.18, delay: 0.04 }}
                  className="shrink-0"
                >
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('home');
                    }}
                    className="flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer"
                  >
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#D21319] group-hover:scale-125 transition-transform rounded-xs shadow-[0_0_8px_#D21319] shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-serif text-xs sm:text-base lg:text-lg font-black tracking-tight text-[#D21319] group-hover:text-white transition-colors leading-none uppercase">
                        INDIGO TECH FEST
                      </span>
                      <span className="label-editorial text-[7px] sm:text-[8px] text-[#AFAEA2] tracking-[0.2em] sm:tracking-[0.25em] mt-0.5">
                        JARVIS 3.0
                      </span>
                    </div>
                  </Link>
                </motion.div>

                {/* DESKTOP CENTER NAVIGATION LINKS */}
                <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
                  {navLinks.map((link, index) => {
                    const isActive = activeSection === link.id;
                    const delay = 0.06 + index * 0.025;

                    if (link.href) {
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
                            className="relative font-grotesk text-xs uppercase tracking-[0.2em] transition-colors py-1 cursor-pointer whitespace-nowrap text-[#AFAEA2] hover:text-white"
                          >
                            {link.label}
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

                {/* RIGHT ACTION TRIGGERS */}
                <motion.div
                  initial={{ opacity: 0, x: 12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.16 }}
                  className="flex items-center gap-1 sm:gap-2 shrink-0"
                >
                  {/* INTRO FILM BUTTON */}
                  {onReplayIntro && (
                    <button
                      type="button"
                      onClick={onReplayIntro}
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-[#E9E6DA] bg-black/40 hover:bg-[#D21319] hover:text-white border border-[#AFAEA2]/40 hover:border-[#D21319] rounded-lg transition-all cursor-pointer"
                      title="Play 1008.mp4 Intro Video"
                    >
                      <Play size={10} className="fill-current text-[#D21319] hover:text-white" />
                      <span>INTRO FILM</span>
                    </button>
                  )}

                  {/* ENLIST SQUAD BUTTON */}
                  {!hasMaxEvents && (
                    <button
                      type="button"
                      onClick={onRegisterClick}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-lg shadow-[0_0_12px_rgba(210,19,25,0.3)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>ENLIST SQUAD</span>
                      <span className="hidden xs:inline">→</span>
                    </button>
                  )}

                  {/* ADMIN LINK */}
                  <Link
                    href="/admin"
                    className="hidden lg:inline-flex items-center px-2.5 py-1.5 text-xs font-mono font-bold text-[#AFAEA2] hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors cursor-pointer"
                    title="Curator & Admin Panel"
                  >
                    [ ADMIN ]
                  </Link>

                  {/* Mobile Menu Dropdown Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-1.5 text-[#E9E6DA] hover:text-white bg-white/5 hover:bg-white/15 border border-white/20 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                    aria-label="Toggle Mobile Menu"
                    title="Toggle all navigation options"
                  >
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden xs:inline text-[#AFAEA2]">
                      {mobileMenuOpen ? 'HIDE' : 'ALL'}
                    </span>
                    <ChevronRight size={14} className={mobileMenuOpen ? 'rotate-90 text-[#D21319] transition-transform' : 'transition-transform'} />
                  </button>

                  {/* Close / Repack Button */}
                  <button
                    type="button"
                    onClick={handleCollapse}
                    className="p-1 sm:p-1.5 text-[#AFAEA2] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Close navigation back to Pokéball"
                  >
                    <X size={15} />
                  </button>
                </motion.div>

              </div>

              {/* ========================================================
                  3. MOBILE QUICK NAVIGATION RIBBON (Directly accessible on mobile)
                  Shows all options from the laptop cleanly in mobile view!
                 ======================================================== */}
              <div className="lg:hidden mt-2 pt-1.5 border-t border-white/10 overflow-hidden">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
                  {navLinks.map((link) => {
                    const isActive = activeSection === link.id;

                    if (link.href) {
                      return (
                        <Link
                          key={link.id}
                          href={link.href}
                          onClick={() => handleCollapse()}
                          className="shrink-0 px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 text-[#AFAEA2] hover:text-white text-[9.5px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap"
                        >
                          <span className="text-[11px]">{link.icon}</span>
                          <span>{link.shortLabel}</span>
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => scrollToSection(link.id)}
                        className={`shrink-0 px-2 py-1 rounded-md border text-[9.5px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#D21319]/25 border-[#D21319] text-white font-bold shadow-[0_0_8px_rgba(210,19,25,0.4)]'
                            : 'bg-white/5 hover:bg-white/15 border-white/15 text-[#AFAEA2] hover:text-white'
                        }`}
                      >
                        <span className="text-[11px]">{link.icon}</span>
                        <span>{link.shortLabel}</span>
                      </button>
                    );
                  })}

                  {/* Intro Film pill on mobile */}
                  {onReplayIntro && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCollapse();
                        onReplayIntro();
                      }}
                      className="shrink-0 px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <span className="text-[11px]">🎬</span>
                      <span>FILM</span>
                    </button>
                  )}

                  {/* Admin pill on mobile */}
                  <Link
                    href="/admin"
                    onClick={() => handleCollapse()}
                    className="shrink-0 px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 text-[#AFAEA2] hover:text-white font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <span className="text-[11px]">🛡️</span>
                    <span>ADMIN</span>
                  </Link>
                </div>
              </div>

              {/* ========================================================
                  4. MOBILE EXPANDED COMMAND DRAWER
                  Rich interactive menu with subtitles and badges when opened.
                 ======================================================== */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="lg:hidden mt-2 pt-2 border-t border-white/15 space-y-1 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {navLinks.map((link) => {
                        const isActive = activeSection === link.id;

                        if (link.href) {
                          return (
                            <Link
                              key={link.id}
                              href={link.href}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                handleCollapse();
                              }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{link.icon}</span>
                                <div>
                                  <div className="font-serif text-[11px] uppercase tracking-wider text-white font-bold group-hover:text-[#D21319] transition-colors">
                                    {link.label}
                                  </div>
                                  <div className="font-mono text-[8.5px] text-[#AFAEA2]">
                                    {link.desc}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={13} className="text-[#AFAEA2] group-hover:text-white transition-transform" />
                            </Link>
                          );
                        }

                        return (
                          <button
                            key={link.id}
                            type="button"
                            onClick={() => scrollToSection(link.id)}
                            className={`w-full p-2 rounded-lg border flex items-center justify-between text-left transition group cursor-pointer ${
                              isActive
                                ? 'bg-[#D21319]/20 border-[#D21319] shadow-[0_0_10px_rgba(210,19,25,0.25)]'
                                : 'bg-white/5 hover:bg-white/10 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{link.icon}</span>
                              <div>
                                <div className={`font-serif text-[11px] uppercase tracking-wider font-bold transition-colors ${
                                  isActive ? 'text-white' : 'text-[#E9E6DA] group-hover:text-white'
                                }`}>
                                  {link.label}
                                </div>
                                <div className="font-mono text-[8.5px] text-[#AFAEA2]">
                                  {link.desc}
                                </div>
                              </div>
                            </div>
                            {isActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D21319] shadow-[0_0_6px_#D21319]" />
                            ) : (
                              <ChevronRight size={13} className="text-[#AFAEA2] group-hover:text-white transition-transform" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 grid grid-cols-2 gap-1.5 border-t border-white/10">
                      {onReplayIntro && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleCollapse();
                            onReplayIntro();
                          }}
                          className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Play size={10} className="fill-current" />
                          <span>PLAY INTRO FILM</span>
                        </button>
                      )}

                      <Link
                        href="/admin"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleCollapse();
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[#AFAEA2] hover:text-white font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
                      >
                        <span>[ ADMIN CONSOLE ]</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </header>
  );
}
