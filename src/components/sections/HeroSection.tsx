'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Trophy, MapPin, ArrowDown, ChevronRight, Flame, ShieldAlert, Radio } from 'lucide-react';

interface HeroSectionProps {
  onRegisterClick: () => void;
  onViewEventsClick: () => void;
}

export function HeroSection({ onRegisterClick, onViewEventsClick }: HeroSectionProps) {
  // Target: 16 Oct 2026, 09:00:00 IST
  const targetDate = new Date('2026-10-16T09:00:00+05:30').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [hasMaxEvents, setHasMaxEvents] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      if (typeof window !== 'undefined') {
        const isLoggedOut = localStorage.getItem('indigo_logged_out') === 'true';
        const isReg = !isLoggedOut && localStorage.getItem('indigo_user_registered') === 'true';
        const eventsCount = parseInt(localStorage.getItem('indigo_user_events_count') || '0', 10);
        setHasMaxEvents(isReg || eventsCount >= 2);
      }
    };

    checkStatus();
    window.addEventListener('storage', checkStatus);
    window.addEventListener('auth_state_change', checkStatus);
    return () => {
      window.removeEventListener('storage', checkStatus);
      window.removeEventListener('auth_state_change', checkStatus);
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <>
      {/* 1. CINEMATIC FOREGROUND HERO STAGE (MOBILE RESPONSIVE & ANIMATED) */}
      <section
        id="home"
        className="relative w-full min-h-screen flex flex-col justify-end pt-24 pb-12 px-4 sm:px-6 lg:px-8 pointer-events-none select-none z-10"
      >
        <div className="max-w-5xl mx-auto w-full pointer-events-auto">
          {/* Frosted Theatrical HUD Console */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-8 bg-[#161A35]/80 sm:bg-[#161A35]/70 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl text-white relative overflow-hidden"
          >
            {/* Top Tactical Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse shadow-[0_0_10px_#D21319]" />
                <span className="font-mono text-[10px] sm:text-xs text-neutral-300 uppercase tracking-widest font-bold">
                  CONVOCATION · PLATE I · JARVIS 3.0
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-neutral-300">
                <span className="px-2 py-0.5 bg-neutral-900/90 border border-neutral-700 rounded text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REGISTRATION OPEN
                </span>
                <span className="hidden md:inline px-2 py-0.5 bg-red-950/60 border border-red-800/80 rounded text-red-300">
                  MAX 2 EVENTS / MEMBER
                </span>
              </div>
            </div>

            {/* Hero Main Typography */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#D21319] font-bold tracking-wider uppercase">
                <Sparkles size={14} />
                <span>INDIGO TECH FESTIVAL 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight uppercase leading-tight text-white drop-shadow-md">
                THE PHOENIX & THE SEVEN AUTOMATA
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed font-sans">
                A two-day technological proving ground where autonomous machines, software architectures, 
                and collegiate engineering squads converge under the legendary crest of the Phoenix.
              </p>
            </div>

            {/* Highlights Grid (Festival Lore & Venue Specs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5 font-mono text-[11px]">
              <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2">
                <Calendar size={14} className="text-[#D21319] shrink-0" />
                <div>
                  <span className="text-[9px] text-neutral-400 block uppercase">Dates</span>
                  <span className="font-bold text-white">16 & 17 Oct 2026</span>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2">
                <MapPin size={14} className="text-[#D21319] shrink-0" />
                <div>
                  <span className="text-[9px] text-neutral-400 block uppercase">Venue</span>
                  <span className="font-bold text-white">SLRTCE Mumbai</span>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2">
                <Trophy size={14} className="text-[#D21319] shrink-0" />
                <div>
                  <span className="text-[9px] text-neutral-400 block uppercase">Prize Pool</span>
                  <span className="font-bold text-emerald-400">₹1,00,000+</span>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2">
                <Flame size={14} className="text-[#D21319] shrink-0" />
                <div>
                  <span className="text-[9px] text-neutral-400 block uppercase">Arena</span>
                  <span className="font-bold text-amber-300">7 Disciplines</span>
                </div>
              </div>
            </div>

            {/* T-Minus Countdown Clock & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              {/* Countdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  T-MINUS
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold bg-black/60 px-3 py-1.5 border border-white/20 rounded">
                  <span className="text-white">{String(timeLeft.days).padStart(2, '0')}D</span>
                  <span className="text-[#D21319] animate-pulse">:</span>
                  <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}H</span>
                  <span className="text-[#D21319] animate-pulse">:</span>
                  <span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}M</span>
                  <span className="text-[#D21319] animate-pulse">:</span>
                  <span className="text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}S</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onViewEventsClick}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Explore Disciplines</span>
                  <ArrowDown size={13} />
                </button>

                {!hasMaxEvents && (
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[#D21319] hover:bg-[#b00f14] text-white border border-white/30 shadow-[0_0_15px_rgba(210,19,25,0.4)] rounded-lg text-xs font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Enlist Squad</span>
                    <span>➔</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. CURATORIAL STATUS TICKER & ACTION STRIP */}
      <div className="w-full bg-black text-white border-y-2 border-black py-3 px-4 sm:px-6 select-none relative z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#D21319]" />
            <span className="text-white font-sans font-bold uppercase tracking-wider text-xs">
              INDIGO TECH FEST · 7 DISCIPLINES LEDGER
            </span>
            <span className="text-neutral-500 hidden sm:inline">|</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline">
              OCTOBER 16 (DAY 1) & OCTOBER 17 (DAY 2) · SLRTCE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#announcements"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
            >
              <Radio size={12} className="animate-pulse" />
              <span>LIVE BULLETINS ACTIVE</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
