'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playPokedexOpenSound, playRetroBeep, playVictoryChime } from '@/lib/sound';

interface PokeballTransitionProps {
  isOpening: boolean;
  onAnimationComplete?: () => void;
}

type Stage = 'drop' | 'shake' | 'charge' | 'open' | 'fadeout' | 'done';

export function PokeballTransition({
  isOpening,
  onAnimationComplete,
}: PokeballTransitionProps) {
  const [stage, setStage] = useState<Stage>('drop');

  useEffect(() => {
    if (!isOpening) {
      setStage('drop');
      return;
    }

    // Step 1: Drop & Bounce sound
    playRetroBeep(440, 'square', 0.08);

    // Step 2: Shake (after bounce settles at 0.7s)
    const tShake = setTimeout(() => {
      setStage('shake');
      playRetroBeep(587.33, 'triangle', 0.06);
    }, 700);

    // Step 3: Charge up (at 1.5s)
    const tCharge = setTimeout(() => {
      setStage('charge');
      playPokedexOpenSound();
    }, 1500);

    // Step 4: Open & Burst (at 2.1s)
    const tOpen = setTimeout(() => {
      setStage('open');
      playVictoryChime();
      try {
        confetti({
          particleCount: 85,
          spread: 130,
          origin: { y: 0.5, x: 0.5 },
          colors: ['#FFCB05', '#EE1515', '#3B4CCA', '#00F0FF', '#FFFFFF'],
          ticks: 240,
          gravity: 0.65,
          scalar: 1.2,
        });
      } catch {}
    }, 2100);

    // Step 5: Fade out (at 3.0s)
    const tFadeout = setTimeout(() => {
      setStage('fadeout');
    }, 3000);

    // Step 6: Finish transition (at 3.5s)
    const tDone = setTimeout(() => {
      setStage('done');
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3500);

    return () => {
      clearTimeout(tShake);
      clearTimeout(tCharge);
      clearTimeout(tOpen);
      clearTimeout(tFadeout);
      clearTimeout(tDone);
    };
  }, [isOpening, onAnimationComplete]);

  if (!isOpening || stage === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="pokeball-transition"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'fadeout' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center pointer-events-none select-none"
      >
        {/* Transparent Frosted Glass Backdrop showing the background banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 'fadeout' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/35 backdrop-blur-md"
        />

        {/* Ambient Battle Arena Energy Rings (Transparent) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,203,5,0.15)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full border border-white/20 animate-pulse pointer-events-none" />
        <div className="absolute w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] rounded-full border border-[#EE1515]/30 pointer-events-none" />

        {/* Light Beam & Particle Flare on Open */}
        {(stage === 'open' || stage === 'fadeout') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.2, 4.5], opacity: [0, 0.95, 0] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute z-20 w-96 h-96 rounded-full bg-gradient-to-r from-yellow-300 via-white to-cyan-300 blur-3xl"
          />
        )}

        {/* Pokéball Shadow with Dynamic Ground Reaction */}
        <motion.div
          animate={
            stage === 'drop'
              ? {
                  scale: [0.2, 1.25, 0.85, 1],
                  opacity: [0.1, 0.7, 0.45, 0.6],
                }
              : stage === 'open' || stage === 'fadeout'
              ? { scale: 0, opacity: 0 }
              : { scale: [1, 1.1, 0.95, 1], opacity: 0.6 }
          }
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 sm:translate-y-32 w-48 sm:w-60 h-9 bg-black/50 rounded-full blur-lg z-10"
        />

        {/* Main Pokéball Container */}
        <div className="relative z-30 flex items-center justify-center">
          <motion.div
            animate={
              stage === 'drop'
                ? {
                    y: [-480, 0, -70, 0],
                    scaleY: [1.35, 0.72, 1.08, 1],
                    scaleX: [0.75, 1.28, 0.94, 1],
                  }
                : stage === 'shake'
                ? {
                    rotate: [0, -18, 18, -14, 14, -6, 6, 0],
                    x: [0, -12, 12, -8, 8, -4, 4, 0],
                  }
                : stage === 'charge'
                ? {
                    scale: [1, 1.12, 1.06, 1.18, 1.12],
                  }
                : {}
            }
            transition={
              stage === 'drop'
                ? { duration: 0.7, times: [0, 0.55, 0.8, 1], ease: 'easeInOut' }
                : stage === 'shake'
                ? { duration: 0.8, ease: 'easeInOut' }
                : stage === 'charge'
                ? { duration: 0.6, ease: 'easeInOut' }
                : {}
            }
            className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
          >
            {/* TOP RED HEMISPHERE */}
            <motion.div
              animate={
                stage === 'open' || stage === 'fadeout'
                  ? {
                      y: -140,
                      rotate: -32,
                      x: -25,
                      opacity: [1, 1, 0],
                    }
                  : { y: 0, rotate: 0, x: 0 }
              }
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-[#FF2E2E] via-[#EE1515] to-[#B80A0A] rounded-t-full border-4 sm:border-5 border-[#12161D] shadow-[inset_0_5px_15px_rgba(255,255,255,0.45)] overflow-hidden z-20 origin-bottom-left"
            >
              {/* Gloss Highlight */}
              <div className="absolute top-2 left-6 right-6 h-6 sm:h-8 bg-gradient-to-b from-white/70 to-transparent rounded-t-full" />
              <div className="absolute top-3.5 left-7 w-6 h-3 bg-white/90 rounded-full blur-[0.5px]" />
              {/* Seam Band */}
              <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-2.5 bg-[#12161D]" />
            </motion.div>

            {/* LIGHT EMITTER CORE (Emerges from between the opening shells) */}
            {(stage === 'charge' || stage === 'open' || stage === 'fadeout') && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  stage === 'charge'
                    ? { scale: [0.6, 1.3], opacity: [0.6, 1] }
                    : { scale: [1.3, 6, 9], opacity: [1, 0.85, 0] }
                }
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute z-15 w-28 h-28 rounded-full bg-gradient-to-r from-yellow-300 via-white to-cyan-300 shadow-[0_0_60px_#FFCB05]"
              />
            )}

            {/* BOTTOM WHITE HEMISPHERE */}
            <motion.div
              animate={
                stage === 'open' || stage === 'fadeout'
                  ? {
                      y: 100,
                      rotate: 18,
                      x: 15,
                      opacity: [1, 1, 0],
                    }
                  : { y: 0, rotate: 0, x: 0 }
              }
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-[#D5DCE6] via-[#F1F5F9] to-[#FFFFFF] rounded-b-full border-4 sm:border-5 border-[#12161D] shadow-[inset_0_-6px_15px_rgba(0,0,0,0.2)] overflow-hidden z-20 origin-top-right"
            >
              {/* Seam Band */}
              <div className="absolute top-0 left-0 right-0 h-2 sm:h-2.5 bg-[#12161D]" />
              {/* Soft bottom shading */}
              <div className="absolute bottom-2 left-6 right-6 h-4 bg-black/15 rounded-b-full" />
            </motion.div>

            {/* CENTER PUSH BUTTON */}
            <motion.div
              animate={
                stage === 'open' || stage === 'fadeout'
                  ? { scale: [1, 2, 0], opacity: [1, 1, 0] }
                  : stage === 'charge'
                  ? {
                      scale: [1, 1.35, 1.25],
                      boxShadow: '0 0 35px #FFCB05, 0 0 60px #EE1515',
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute z-30 w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white border-4 sm:border-5 border-[#12161D] flex items-center justify-center shadow-2xl"
            >
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-[#12161D] flex items-center justify-center transition-all ${
                  stage === 'charge'
                    ? 'bg-yellow-400 animate-ping'
                    : stage === 'shake'
                    ? 'bg-[#EE1515] animate-pulse'
                    : 'bg-white'
                }`}
              >
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                    stage === 'charge' ? 'bg-white' : 'bg-gray-300'
                  }`}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic Status Text with Glass Pill */}
        <div className="relative z-40 mt-10 sm:mt-14 text-center">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="inline-flex flex-col items-center gap-1.5 px-6 py-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl"
          >
            <span className="font-pixel text-xs sm:text-sm text-[#FFCB05] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {stage === 'drop' && '⚡ POKÉBALL DETECTED...'}
              {stage === 'shake' && '⚡ SYNCHRONIZING ARENA...'}
              {stage === 'charge' && '⚡ CHARGING ENERGY BEAM...'}
              {(stage === 'open' || stage === 'fadeout') && '🏆 ARENA UNLOCKED! WELCOME TRAINER!'}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] text-gray-300 font-bold uppercase tracking-widest">
              KENTO LEAGUE · JARVIS 3.0
            </span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
