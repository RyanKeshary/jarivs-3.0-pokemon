'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface NavbarProps {
  onRegisterClick?: () => void;
  onReplayIntro?: () => void;
}

export function Navbar({ onRegisterClick, onReplayIntro }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'events' | 'schedule' | 'join'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasMaxEvents, setHasMaxEvents] = useState(false);

  // Pokeball hover / deploy state
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = isHovered || isPinned || mobileMenuOpen;

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
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setIsPinned(false);
    setIsHovered(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (!isOpen) {
      try {
        playRetroBeep(780, 'square', 0.04);
      } catch (e) {}
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    // Fast 220ms grace window so fast cursor motion across buttons does not jitter
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned((prev) => !prev);
    try {
      playRetroBeep(880, 'triangle', 0.05);
    } catch (e) {}
  };

  const navLinks = [
    { id: 'events', label: 'THE 7 DISCIPLINES' },
    { id: 'announcements', label: 'NOTICES' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'join', label: 'HOW TO JOIN' },
  ];

  return (
    <header className="fixed top-2 sm:top-3 left-0 right-0 z-40 select-none px-3 sm:px-6 pointer-events-none flex justify-center">
      
      {/* Outer Interactive Container */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto relative w-full flex justify-center max-w-7xl"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* ========================================================
               DEFAULT STATE: CLOSED POKÉBALL CAPSULE DOCK
               ======================================================== */
            <motion.div
              key="closed-pokeball"
              initial={{ scale: 0.85, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={togglePin}
              className="group flex items-center gap-3 px-3.5 py-1.5 bg-[#161A35]/95 hover:bg-[#1A1F3F] backdrop-blur-xl border border-white/20 hover:border-[#D21319] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-200 hover:shadow-[0_0_25px_rgba(210,19,25,0.45)] hover:scale-105 active:scale-95"
              title="Hover or click Pokéball to open navigation"
            >
              {/* Closed Pokéball: Top Half + Bottom Half assembled seamlessly */}
              <div className="relative w-[44px] h-[44px] flex flex-col items-center justify-center shrink-0">
                {/* Top Half */}
                <img
                  src="/assets/pokeball-top.png"
                  alt="Pokéball Top Half"
                  className="w-[44px] h-[22px] object-contain block select-none pointer-events-none group-hover:-translate-y-0.5 transition-transform duration-200"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Bottom Half */}
                <img
                  src="/assets/pokeball-bottom.png"
                  alt="Pokéball Bottom Half"
                  className="w-[44px] h-[22px] object-contain block select-none pointer-events-none group-hover:translate-y-0.5 transition-transform duration-200"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Capsule Label */}
              <div className="flex flex-col pr-2 text-left">
                <span className="font-serif text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5 leading-none">
                  INDIGO CODEX
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D21319] animate-pulse" />
                </span>
                <span className="font-mono text-[9px] text-[#AFAEA2] tracking-widest uppercase mt-0.5 group-hover:text-amber-400 transition-colors">
                  HOVER TO DEPLOY
                </span>
              </div>
            </motion.div>
          ) : (
            /* ========================================================
               ACTIVE STATE: POKÉBALL ROTATES, SPLITS, DISAPPEARS &
               ALL THE NAVBAR POPS OUT OF THE POKÉBALL
               ======================================================== */
            <motion.div
              key="opened-navbar"
              initial={{ scale: 0.35, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.4, opacity: 0, y: -6 }}
              transition={{
                type: 'spring',
                stiffness: 440,
                damping: 26,
                mass: 0.7,
                duration: 0.24,
              }}
              className="relative w-full bg-[#161A35]/95 backdrop-blur-2xl border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.8)] rounded-2xl p-3 sm:px-6 overflow-hidden"
            >
              {/* Transient Opening Animation: Pokéball rotates once & splits apart */}
              <motion.div
                initial={{ opacity: 1, scale: 1, rotate: 0 }}
                animate={{ opacity: 0, scale: 1.25, rotate: 360 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <div className="relative w-[52px] h-[52px] flex flex-col items-center justify-center">
                  {/* Top Half slides UP */}
                  <motion.img
                    src="/assets/pokeball-top.png"
                    alt="Pokeball Top"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="w-[52px] h-[26px] object-contain select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {/* Bottom Half slides DOWN */}
                  <motion.img
                    src="/assets/pokeball-bottom.png"
                    alt="Pokeball Bottom"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="w-[52px] h-[26px] object-contain select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {/* Radiant Burst Flash */}
                  <motion.div
                    initial={{ scale: 0.2, opacity: 1 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-radial from-white via-[#D21319] to-transparent pointer-events-none"
                  />
                </div>
              </motion.div>

              {/* The Popped-Out Navbar Content */}
              <div className="flex items-center justify-between gap-4 relative z-20">
                
                {/* Left: Serif Brandmark */}
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('home');
                  }}
                  className="flex items-center gap-2.5 group cursor-pointer shrink-0"
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

                {/* Center Navigation Links */}
                <nav className="hidden md:flex items-center gap-6">
                  {navLinks.map((link) => {
                    const isActive = activeSection === link.id;
                    return (
                      <button
                        key={link.id}
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
                    );
                  })}
                </nav>

                {/* Right Action Triggers */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {onReplayIntro && (
                    <button
                      onClick={onReplayIntro}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#E9E6DA] bg-black/40 hover:bg-[#D21319] hover:text-white border border-[#AFAEA2]/40 hover:border-[#D21319] rounded-lg transition-all cursor-pointer"
                      title="Play 1008.mp4 Intro Video"
                    >
                      <span>▷ INTRO FILM</span>
                    </button>
                  )}

                  {!hasMaxEvents && (
                    <button
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
                    onClick={() => {
                      setIsPinned(false);
                      setIsHovered(false);
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-[#AFAEA2] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Close navigation back to Pokéball"
                  >
                    <X size={16} />
                  </button>

                  {/* Mobile Menu Toggle Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-1.5 text-[#AFAEA2] hover:text-white border border-white/20 rounded-lg ml-0.5"
                    aria-label="Toggle Mobile Menu"
                  >
                    <ChevronRight size={16} className={mobileMenuOpen ? 'rotate-90 transition-transform' : ''} />
                  </button>
                </div>

              </div>

              {/* Mobile Expanded Menu Rows */}
              {mobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="block w-full text-left font-serif text-xs uppercase tracking-wider text-white py-1.5 border-b border-white/5"
                    >
                      {link.label}
                    </button>
                  ))}
                  <div className="pt-2 flex flex-col gap-2">
                    {onReplayIntro && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsPinned(false);
                          setIsHovered(false);
                          onReplayIntro();
                        }}
                        className="text-left font-mono text-xs text-amber-400 py-1"
                      >
                        [ ▷ PLAY INTRO FILM ]
                      </button>
                    )}
                    <Link
                      href="/admin"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsPinned(false);
                        setIsHovered(false);
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
