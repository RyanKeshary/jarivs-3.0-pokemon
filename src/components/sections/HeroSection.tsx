'use client';

import React, { useState, useEffect } from 'react';
import { DynamicStage } from '@/components/landing/DynamicStage';

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
      {/* 1. TRUE 100VH FULL-SCREEN CINEMATIC THEATRICAL STAGE SPACER (UNOBSTRUCTED) */}
      <section
        id="home"
        className="w-full h-screen min-h-screen relative pointer-events-none bg-transparent"
        aria-hidden="true"
      />

      {/* 2. CURATORIAL STATUS TICKER & ACTION STRIP (RELOCATED ACTIONS) */}
      <div className="w-full bg-black text-white border-y-2 border-black py-3.5 px-4 sm:px-6 select-none relative z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-mono">
          
          {/* Identifiers & Curatorial Plate Caption */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#D21319] shadow-[0_0_8px_#D21319]" />
              <span className="text-white font-sans font-black uppercase tracking-wider text-sm">
                INDIGO TECH FEST · JARVIS 3.0
              </span>
            </div>
            <span className="hidden sm:inline text-neutral-600">|</span>
            <div className="text-[10px] tracking-[0.2em] font-mono text-neutral-300 uppercase bg-neutral-900 px-3 py-1 border border-neutral-700">
              PLATE I · THE PHOENIX & THE SEVEN AUTOMATA · INTERACTIVE 3D
            </div>
          </div>

          {/* Countdown & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Minimalist Serif Countdown Ticker */}
            <div className="flex items-center gap-2 text-xs tracking-widest">
              <span className="text-[10px] text-neutral-400 font-mono">T-MINUS</span>
              <span className="font-mono text-xs font-bold text-white bg-neutral-900 px-2.5 py-1 border border-neutral-700 shadow-sm">
                {String(timeLeft.days).padStart(2, '0')}D : {String(timeLeft.hours).padStart(2, '0')}H : {String(timeLeft.minutes).padStart(2, '0')}M : {String(timeLeft.seconds).padStart(2, '0')}S
              </span>
            </div>

            {/* Relocated Action Buttons */}
            <div className="flex items-center gap-2.5">
              <a
                href="#events"
                onClick={(e) => {
                  e.preventDefault();
                  onViewEventsClick();
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-[#D21319] text-neutral-200 hover:text-white font-sans font-bold text-xs uppercase tracking-wider border border-neutral-700 hover:border-[#D21319] shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
              >
                <span>ENTER FESTIVAL</span>
                <span className="text-[#D21319] hover:text-white">↓</span>
              </a>

              {!hasMaxEvents && (
                <button
                  onClick={onRegisterClick}
                  className="px-4 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white font-sans font-black text-xs uppercase tracking-wider border border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <span>ENLIST SQUAD</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
