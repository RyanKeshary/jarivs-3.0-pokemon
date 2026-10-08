'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  EngravedPhoenix,
  EngravedSnorlax,
  EngravedJigglypuff,
  EngravedGengar,
  EngravedPikachu,
  EngravedPsyduck,
  EngravedEevee,
} from './EngravedPokemon';

interface HeroTitleCardProps {
  onRegisterClick?: () => void;
  onEventsClick?: () => void;
}

export function HeroTitleCard({ onRegisterClick, onEventsClick }: HeroTitleCardProps) {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-8 select-none">
      {/* Outer Editorial Vintage Natural-History Print Frame */}
      <div className="relative bg-[#1B1E4A] border border-[#AFAEA2] p-5 sm:p-8 md:p-12 shadow-[3px_3px_0px_#0E1026]">
        {/* Corner Engraved Filigree Marks */}
        <div className="absolute top-2 left-2 text-[#AFAEA2] text-[10px] tracking-widest font-mono">
          [ TAB. I ]
        </div>
        <div className="absolute top-2 right-2 text-[#AFAEA2] text-[10px] tracking-widest font-mono">
          [ MDCCCXXVI ]
        </div>
        <div className="absolute bottom-2 left-2 text-[#AFAEA2] text-[10px] tracking-widest font-mono">
          INDIGO ARCHIVE
        </div>
        <div className="absolute bottom-2 right-2 text-[#AFAEA2] text-[10px] tracking-widest font-mono">
          FIG. 1–7
        </div>

        {/* Hairline Inner Border */}
        <div className="border border-[#AFAEA2]/40 p-4 sm:p-6 md:p-8 relative">
          
          {/* Decorative Crimson Satin Ribbon Loop SVG in background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 800 500"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Ribbon Flow Paths */}
            <path
              d="M120 180 C80 120 140 60 260 80 C400 100 480 50 640 80 C740 100 760 180 700 240 C620 320 680 420 540 440 C380 460 280 420 180 430 C80 440 60 340 120 280 C180 220 220 240 260 220"
              stroke="#D21319"
              strokeWidth="1.75"
              strokeDasharray="4 2"
              opacity="0.85"
            />
            <path
              d="M160 140 C280 100 420 120 500 80 C600 40 700 120 640 200 C580 280 520 260 400 320 C280 380 220 340 160 300"
              stroke="#D21319"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Small ribbon bow knots */}
            <circle cx="260" cy="80" r="3" fill="#D21319" />
            <circle cx="640" cy="80" r="3" fill="#D21319" />
            <circle cx="540" cy="440" r="3" fill="#D21319" />
            <circle cx="180" cy="430" r="3" fill="#D21319" />
          </svg>

          {/* Top Plate Metadata */}
          <div className="text-center mb-6 relative z-10">
            <span className="label-editorial text-[10px] sm:text-xs">
              NATURAL HISTORY OF COMPUTATION · SECTION VII
            </span>
          </div>

          {/* Centerpiece Masthead & Engravings Grid */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* 1. The Phoenix (Ho-Oh) Still & Majestic Crown */}
            <div className="flex flex-col items-center justify-center">
              <EngravedPhoenix size={140} className="w-28 sm:w-36 md:w-44" />
              <div className="label-editorial text-[9px] mt-1 text-[#AFAEA2]">
                PHOENIX ASCENDANT · CHIEF ARBITER
              </div>
            </div>

            {/* 2. Massive High-Contrast Didone Serif Masthead in Crimson */}
            <div className="mt-4 text-center">
              <h1 className="font-serif text-4xl sm:text-6xl md:text-8xl tracking-tight text-[#D21319] uppercase leading-none font-bold">
                INDIGO TECH FEST
              </h1>
              <div className="flex items-center justify-center gap-3 sm:gap-6 mt-3 text-stone-grey">
                <span className="h-[1px] w-8 sm:w-16 bg-[#AFAEA2]" />
                <span className="font-grotesk tracking-[0.3em] uppercase text-xs sm:text-sm font-semibold text-[#E9E6DA]">
                  JARVIS 3.0 · AN EDITORIAL CONVOCATION
                </span>
                <span className="h-[1px] w-8 sm:w-16 bg-[#AFAEA2]" />
              </div>
            </div>

            {/* 3. Six Engraved Pokemon with gentle looping idle animations arranged in botanical plate style */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-2 mt-8 pt-6 border-t border-[#AFAEA2]/30">
              
              {/* Pokemon 1: EEVEE (Tail flick) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedEevee size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">I. EEVEE</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">Project Exhib.</span>
              </div>

              {/* Pokemon 2: PIKACHU (Paw wave) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedPikachu size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">II. PIKACHU</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">PID-geotto</span>
              </div>

              {/* Pokemon 3: GENGAR (Peeks) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedGengar size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">III. GENGAR</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">Cad-Mander</span>
              </div>

              {/* Pokemon 4: PSYDUCK (Scratches head) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedPsyduck size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">IV. PSYDUCK</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">Quiz-tle</span>
              </div>

              {/* Pokemon 5: SNORLAX (Breathes) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedSnorlax size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">V. SNORLAX</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">Build-asor</span>
              </div>

              {/* Pokemon 6: JIGGLYPUFF (Sways) */}
              <div className="flex flex-col items-center p-2 border border-[#AFAEA2]/20 hover:border-[#D21319] transition-colors bg-[#121435]">
                <EngravedJigglypuff size={80} animateIdle={true} />
                <span className="label-editorial text-[8px] mt-2">VI. JIGGLYPUFF</span>
                <span className="text-[10px] text-[#E9E6DA] font-mono mt-0.5">reelax</span>
              </div>

            </div>

          </div>

          {/* Hairline metadata footer on the print card */}
          <div className="mt-8 pt-4 border-t border-[#AFAEA2]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-[#AFAEA2] gap-2 font-mono">
            <span>DATES: DAY 1 (16 OCT 2026) · DAY 2 (17 OCT 2026)</span>
            <span>VENUE: [VENUE] · SLRTCE CAMPUS</span>
            <span>ORGANISED BY: [CLUB/COLLEGE]</span>
          </div>

        </div>
      </div>
    </div>
  );
}
