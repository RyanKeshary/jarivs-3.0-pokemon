'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EngravedPhoenix } from '@/components/illustrations/EngravedPokemon';

interface EditorialIntroProps {
  onComplete: () => void;
}

export function EditorialIntro({ onComplete }: EditorialIntroProps) {
  const [isWiping, setIsWiping] = useState(false);

  const handleEnterOrSkip = () => {
    setIsWiping(true);
    try {
      sessionStorage.setItem('indigo_intro_seen', 'true');
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      onComplete();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1B1E4A] flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Background Editorial Paper Pattern */}
      <div className="absolute inset-0 border-[12px] sm:border-[24px] border-[#121435] pointer-events-none" />

      {/* Main Vintage Folio Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-2xl w-full border border-[#AFAEA2] p-6 sm:p-10 md:p-14 bg-[#1B1E4A] text-center shadow-[4px_4px_0px_#0E1026]"
      >
        {/* Folio Head Metadata */}
        <div className="flex items-center justify-between border-b border-[#AFAEA2]/40 pb-4 mb-6 text-xs text-[#AFAEA2] font-mono">
          <span>VOL. III · SEC. A</span>
          <span className="tracking-widest">16 - 17 OCTOBER 2026</span>
          <span>EST. MMXXVI</span>
        </div>

        {/* Engraved Crown Phoenix */}
        <div className="flex justify-center mb-4">
          <EngravedPhoenix size={120} className="w-24 sm:w-32" />
        </div>

        <span className="label-editorial text-[9px] sm:text-[11px] block text-[#AFAEA2]">
          ANNUAL CONVOCATION OF NATURAL & COMPUTATIONAL INQUIRY
        </span>

        {/* Masthead Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#D21319] uppercase tracking-tight font-bold mt-2">
          INDIGO TECH FEST
        </h1>
        <p className="font-grotesk tracking-[0.25em] text-xs sm:text-sm text-[#E9E6DA] uppercase mt-2 font-medium">
          JARVIS 3.0 · AN ARCHIVE OF ALGORITHMS & AUTOMATA
        </p>

        {/* Editorial Notice Text */}
        <div className="my-8 py-4 border-y border-[#AFAEA2]/30 text-stone-grey font-serif italic text-sm sm:text-base text-[#AFAEA2] max-w-lg mx-auto leading-relaxed">
          "Six mechanical archetypes. Two days of rigorous prototyping and algorithmic trials. Enter the hall of inquiry."
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={handleEnterOrSkip}
            className="w-full sm:w-auto px-8 py-3 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold tracking-widest uppercase text-xs border border-[#D21319] shadow-[3px_3px_0px_#0E1026] hover:bg-[#A80D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0E1026] transition-all cursor-pointer"
          >
            ENTER THE FEST {'[ -> ]'}
          </button>

          <button
            onClick={handleEnterOrSkip}
            className="w-full sm:w-auto px-6 py-3 bg-[#AFAEA2] text-[#1B1E4A] font-grotesk font-bold tracking-widest uppercase text-xs border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026] hover:bg-[#E9E6DA] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0E1026] transition-all cursor-pointer"
          >
            SKIP PROLOGUE
          </button>
        </div>

        {/* Footer plate mark */}
        <div className="mt-8 pt-4 border-t border-[#AFAEA2]/40 text-[10px] text-[#AFAEA2] font-mono tracking-widest">
          DEPARTMENT OF COMPUTER ENGINEERING · SLRTCE CAMPUS, MUMBAI
        </div>
      </motion.div>

      {/* Crimson Satin Ribbon Fullscreen Wipe Transition */}
      <AnimatePresence>
        {isWiping && (
          <motion.div
            initial={{ x: '-100%', skewX: -12 }}
            animate={{ x: '120%', skewX: -12 }}
            transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-y-0 w-[140vw] -left-[20vw] z-[100] bg-[#D21319] pointer-events-none shadow-[0_0_50px_#0E1026] flex items-center justify-center border-l-4 border-r-4 border-[#E9E6DA]"
          >
            <div className="w-full h-8 border-y-2 border-[#E9E6DA]/50 flex items-center justify-center">
              <span className="font-serif tracking-[0.4em] text-[#E9E6DA] uppercase text-sm sm:text-base font-bold">
                INDIGO TECH FEST · JARVIS 3.0
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
