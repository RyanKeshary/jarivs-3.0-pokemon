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
      {/* 1. TRUE 100VH FULL-SCREEN CINEMATIC THEATRICAL STAGE SPACER & ACTION DOCK */}
      <section
        id="home"
        className="w-full h-screen min-h-screen flex flex-col justify-end items-center relative select-none pb-12 px-4 pointer-events-none bg-transparent"
      >
        {/* Floating Tactical Action Dock at Base of Viewport */}
        <div className="flex flex-col items-center justify-center gap-3 pointer-events-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#events"
              onClick={(e) => {
                e.preventDefault();
                onViewEventsClick();
              }}
              className="px-8 py-3.5 bg-[#121435]/90 hover:bg-[#D21319] text-[#E9E6DA] hover:text-white font-serif font-bold text-xs uppercase tracking-[0.35em] border border-[#AFAEA2]/40 hover:border-[#D21319] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-200 cursor-pointer flex items-center gap-2 group active:scale-95"
            >
              <span>ENTER FESTIVAL</span>
              <span className="text-[#D21319] group-hover:text-white transition-colors">↓</span>
            </a>

            <button
              onClick={onRegisterClick}
              className="px-8 py-3.5 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-[0.25em] border border-[#D21319] shadow-[0_0_25px_rgba(210,19,25,0.6)] hover:shadow-[0_0_40px_rgba(210,19,25,0.9)] backdrop-blur-md transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>ENLIST SQUAD</span>
              <span>→</span>
            </button>
          </div>

          {/* Clean Curatorial Caption */}
          <div className="text-[10px] tracking-[0.25em] font-mono text-[#E9E6DA]/75 uppercase bg-[#0E1026]/80 px-4 py-1 border border-[#AFAEA2]/20 backdrop-blur-md">
            PLATE I · THE PHOENIX & THE SEVEN AUTOMATA · INTERACTIVE 3D
          </div>
        </div>
      </section>

      {/* 2. CURATORIAL STATUS TICKER RIBBON (Transitions into Disciplines) */}
      <div className="w-full bg-black text-white border-y-2 border-black py-3.5 px-4 sm:px-6 select-none relative z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-300">
          
          {/* Identifiers */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#D21319] shadow-[0_0_8px_#D21319]" />
            <span className="text-white font-sans font-bold uppercase tracking-wider text-sm">
              INDIGO TECH FEST · JARVIS 3.0
            </span>
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span className="hidden sm:inline text-neutral-300 uppercase">
              16 & 17 OCTOBER 2026 · SLRTCE CAMPUS, MUMBAI
            </span>
          </div>

          {/* Minimalist Serif Countdown Ticker */}
          <div className="flex items-center gap-2 text-xs tracking-widest">
            <span className="text-[10px] text-neutral-400 font-mono">T-MINUS CONVOCATION</span>
            <span className="font-mono text-sm font-bold text-white bg-neutral-900 px-2.5 py-1 border border-neutral-700 shadow-sm">
              {String(timeLeft.days).padStart(2, '0')}D : {String(timeLeft.hours).padStart(2, '0')}H : {String(timeLeft.minutes).padStart(2, '0')}M : {String(timeLeft.seconds).padStart(2, '0')}S
            </span>
          </div>

          {/* Disciplines & Token Quick Note */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-neutral-300">
            <span>SEVEN REGISTERED DISCIPLINES</span>
            <span>·</span>
            <span className="text-white font-bold">ROSTER CODE: JRV-XXXX</span>
          </div>

        </div>
      </div>
    </>
  );
}
