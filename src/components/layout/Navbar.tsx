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

type NavAnimationPhase = 'closed' | 'opening' | 'open' | 'closing';

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

  const isExpanded = phase === 'opening' || phase === 'open' || mobileMenuOpen;

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

    if (phase === 'open' || phase === 'opening') return;

    clearSequenceTimers();
    setPhase('opening');

    try {
      playRetroBeep(780, 'square', 0.04);
    } catch {}

    // Phase 1 (0-120ms): Rotation
    // Phase 2 (120-270ms): Split top/bottom halves
    // Phase 3 (200-450ms): Emergence of navbar & disappearance of Pokéball
    const tOpen = setTimeout(() => {
      setPhase('open');
    }, 450);

    sequenceTimersRef.current.push(tOpen);
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

  const navLinks: { id: string; label: string; href?: string }[] = [
    { id: 'events', label: 'THE 7 DISCIPLINES' },
    { id: 'announcements', label: 'NOTICES' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'join', label: 'HOW TO JOIN' },
    { id: 'contact', label: 'HELPLINE', href: '/contact' },
  ];

  return (
    <header className="fixed top-2 sm:top-3.5 left-0 right-0 z-40 select-none px-3 sm:px-6 pointer-events-none flex justify-center">
      
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
            title="Hover or focus Pokéball to open navigation"
          >
            {/* The Rotating Pokéball Core Wrapper */}
            <motion.div
              animate={
                phase === 'opening'
                  ? {
                      rotateY: [0, 360],
                      scale: [1, 1.05, 1],
                      transition: { duration: 0.14, ease: [0.4, 0, 0.2, 1] },
                    }
                  : phase === 'closing'
                  ? {
                      rotateY: [360, 0],
                      scale: [1, 1],
                      transition: { duration: 0.12, ease: 'easeOut', delay: 0.14 },
                    }
                  : { rotateY: 0, scale: 1 }
              }
              className="relative w-[48px] h-[48px] flex flex-col items-center justify-center"
            >
              {/* TOP HALF: Slides UP symmetrically immediately after rotation */}
              <motion.img
                src="/assets/pokeball-top.png"
                alt="Pokéball Top Half"
                animate={
                  phase === 'opening'
                    ? {
                        y: [0, 0, -38, -48],
                        opacity: [1, 1, 1, 0],
                        transition: {
                          times: [0, 0.28, 0.65, 1],
                          duration: 0.44,
                          ease: [0.16, 1, 0.3, 1],
                        },
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

              {/* BOTTOM HALF: Slides DOWN symmetrically immediately after rotation */}
              <motion.img
                src="/assets/pokeball-bottom.png"
                alt="Pokéball Bottom Half"
                animate={
                  phase === 'opening'
                    ? {
                        y: [0, 0, 38, 48],
                        opacity: [1, 1, 1, 0],
                        transition: {
                          times: [0, 0.28, 0.65, 1],
                          duration: 0.44,
                          ease: [0.16, 1, 0.3, 1],
                        },
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
            Smooth scale + opacity + translate emergence with staggered items.
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
                delay: phase === 'opening' ? 0.16 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative w-full bg-[#161A35]/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.85),_0_0_20px_rgba(210,19,25,0.25)] rounded-2xl p-2.5 sm:px-6 overflow-hidden z-20"
            >
              <div className="flex items-center justify-between gap-4">
                
                {/* BRANDMARK (Emerges Staggered) */}
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.22 }}
                  className="shrink-0"
                >
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('home');
                    }}
                    className="flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 bg-[#D21319] group-hover:scale-125 transition-transform rounded-xs shadow-xs" />
                    <div className="flex flex-col">
                      <span className="font-serif text-base sm:text-lg font-black tracking-tight text-[#D21319] group-hover:text-white transition-colors leading-none uppercase">
                        INDIGO TECH FEST
                      </span>
                      <span className="label-editorial text-[8px] text-[#AFAEA2] tracking-[0.25em] mt-0.5">
                        JARVIS 3.0 · CODEX MMXXVI
                      </span>
                    </div>
                  </Link>
                </motion.div>

                {/* CENTER NAVIGATION LINKS (Staggered 25ms each) */}
                <nav className="hidden md:flex items-center gap-6">
                  {navLinks.map((link, index) => {
                    const isActive = activeSection === link.id;
                    const delay = 0.24 + index * 0.025;

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
                  transition={{ duration: 0.2, delay: 0.34 }}
                  className="flex items-center gap-2.5 shrink-0"
                >
                  {onReplayIntro && (
                    <button
                      type="button"
                      onClick={onReplayIntro}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#E9E6DA] bg-black/40 hover:bg-[#D21319] hover:text-white border border-[#AFAEA2]/40 hover:border-[#D21319] rounded-lg transition-all cursor-pointer"
                      title="Play 1008.mp4 Intro Video"
                    >
                      <Play size={11} className="fill-current" />
                      <span>INTRO FILM</span>
                    </button>
                  )}

                  {!hasMaxEvents && (
                    <button
                      type="button"
                      onClick={onRegisterClick}
                      className="px-4 py-2 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-wider rounded-lg shadow-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>ENLIST SQUAD</span>
                      <span>→</span>
                    </button>
                  )}

                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-mono font-bold text-[#AFAEA2] hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors cursor-pointer"
                    title="Curator & Admin Panel"
                  >
                    [ ADMIN ]
                  </Link>

                  {/* Manual Close / Repack Button */}
                  <button
                    type="button"
                    onClick={handleCollapse}
                    className="p-1.5 text-[#AFAEA2] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Close navigation back to Pokéball"
                  >
                    <X size={16} />
                  </button>

                  {/* Mobile Menu Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-1.5 text-[#AFAEA2] hover:text-white border border-white/20 rounded-lg ml-0.5 cursor-pointer"
                    aria-label="Toggle Mobile Menu"
                  >
                    <ChevronRight size={16} className={mobileMenuOpen ? 'rotate-90 transition-transform' : ''} />
                  </button>
                </motion.div>

              </div>

              {/* Mobile Expanded Menu Rows */}
              {mobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-2">
                  {navLinks.map((link) => {
                    if (link.href) {
                      return (
                        <Link
                          key={link.id}
                          href={link.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleCollapse();
                          }}
                          className="block w-full text-left font-serif text-xs uppercase tracking-wider text-white py-1.5 border-b border-white/5"
                        >
                          {link.label}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => scrollToSection(link.id)}
                        className="block w-full text-left font-serif text-xs uppercase tracking-wider text-white py-1.5 border-b border-white/5 cursor-pointer"
                      >
                        {link.label}
                      </button>
                    );
                  })}
                  <div className="pt-2 flex flex-col gap-2">
                    {onReplayIntro && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleCollapse();
                          onReplayIntro();
                        }}
                        className="text-left font-mono text-xs text-amber-400 py-1 cursor-pointer"
                      >
                        [ ▷ PLAY INTRO FILM ]
                      </button>
                    )}
                    <Link
                      href="/admin"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleCollapse();
                      }}
                      className="text-left font-mono text-xs text-[#AFAEA2] py-1"
                    >
                      [ CURATOR ADMIN CONSOLE ]
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </header>
  );
}
