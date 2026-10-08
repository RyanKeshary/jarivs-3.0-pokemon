'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoIntroSceneProps {
  onComplete: () => void;
}

export function VideoIntroScene({ onComplete }: VideoIntroSceneProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setSoundOn(!videoRef.current.muted);
    }
  };

  const handleFinishOrSkip = () => {
    setIsWiping(true);
    try {
      sessionStorage.setItem('indigo_vid_intro_seen', 'true');
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      onComplete();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1026] flex items-center justify-center overflow-hidden select-none">
      {/* 1008.mp4 Fullscreen Video Slot */}
      <video
        ref={videoRef}
        src="/media/intro-vid.mp4"
        autoPlay
        playsInline
        muted={!soundOn}
        onEnded={handleFinishOrSkip}
        className="w-full h-full object-cover"
      />

      {/* Elegant Editorial Overlay Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#121435]/90 border border-[#AFAEA2] px-3.5 py-1.5 shadow-[2px_2px_0px_#0E1026]">
          <span className="w-2 h-2 rounded-none bg-[#D21319] animate-pulse" />
          <span className="font-serif text-xs tracking-wider text-[#E9E6DA] uppercase font-bold">
            INDIGO TECH FEST · JARVIS 3.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="px-3.5 py-1.5 bg-[#121435]/90 hover:bg-[#1B1E4A] text-[#E9E6DA] font-mono text-xs border border-[#AFAEA2] shadow-[2px_2px_0px_#0E1026] transition-all cursor-pointer"
          >
            {soundOn ? '[ SOUND: ON ]' : '[ SOUND: MUTED ]'}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleFinishOrSkip}
            className="px-4 py-1.5 bg-[#D21319] hover:bg-[#A80D12] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase tracking-wider border border-[#D21319] shadow-[3px_3px_0px_#0E1026] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          >
            SKIP INTRO {'[ → ]'}
          </button>
        </div>
      </div>

      {/* Bottom Subtitle / Branding Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="label-editorial text-[10px] text-[#E9E6DA]/90 bg-[#121435]/80 px-4 py-1 border border-[#AFAEA2]/40">
          PROLOGUE TRANSMISSION · 16 - 17 OCTOBER 2026
        </span>
      </div>

      {/* Crimson Satin Ribbon Wiping Across Screen on Finish / Skip */}
      <AnimatePresence>
        {isWiping && (
          <motion.div
            initial={{ x: '-100%', skewX: -15 }}
            animate={{ x: '120%', skewX: -15 }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-y-0 w-[140vw] -left-[20vw] z-[100] bg-[#D21319] pointer-events-none shadow-[0_0_60px_#0E1026] flex items-center justify-center border-l-4 border-r-4 border-[#E9E6DA]"
          >
            <div className="w-full h-10 border-y-2 border-[#E9E6DA]/50 flex items-center justify-center">
              <span className="font-serif tracking-[0.4em] text-[#E9E6DA] uppercase text-sm sm:text-base font-bold">
                INDIGO TECH FEST · REVEAL
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
