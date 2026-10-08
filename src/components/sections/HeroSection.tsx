'use client';

import React from 'react';
import { ArrowDown, Radio } from 'lucide-react';

interface HeroSectionProps {
  onRegisterClick: () => void;
  onViewEventsClick: () => void;
}

export function HeroSection({ onRegisterClick, onViewEventsClick }: HeroSectionProps) {
  return (
    <>
      {/* 1. CINEMATIC 100VH UNOBSTRUCTED STAGE HERO (CARD REMOVED AS REQUESTED) */}
      <section
        id="home"
        className="relative w-full min-h-screen flex flex-col justify-end pb-8 sm:pb-12 px-4 pointer-events-none select-none z-10"
      >
        {/* Clean, Subtle Bottom Scroll Prompt */}
        <div
          onClick={onViewEventsClick}
          className="mx-auto flex flex-col items-center gap-2 pointer-events-auto cursor-pointer group"
        >
          <span className="font-mono text-[10px] sm:text-xs text-white/90 tracking-[0.25em] uppercase font-bold group-hover:text-[#D21319] transition-colors drop-shadow-md">
            EXPLORE THE 7 DISCIPLINES
          </span>
          <div className="w-8 h-8 rounded-full bg-black/60 border border-white/30 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-[#D21319] group-hover:border-[#D21319] transition-all animate-bounce shadow-lg">
            <ArrowDown size={14} />
          </div>
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
