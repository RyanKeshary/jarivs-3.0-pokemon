'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { playBlastOffSound } from '@/lib/sound';

export function TeamRocketBlastOff() {
  const [showQuote, setShowQuote] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll();

  // Physics-smoothed scroll progress for buttery 60/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 28,
    stiffness: 85,
    mass: 0.5,
  });

  // LINEAR TRAJECTORY INCLINED UPWARDS FROM LEFT TO RIGHT:
  // Starts lower-left (-16vw, 84vh) and linearly ascends towards upper-right (106vw, -10vh)
  const x = useTransform(smoothProgress, [0, 1], ['-16vw', '106vw']);
  const y = useTransform(smoothProgress, [0, 1], ['84vh', '-10vh']);

  // Distant perspective shrinkage as they blast off into the stratosphere
  const scale = useTransform(smoothProgress, [0, 0.65, 1], [1.05, 0.78, 0.32]);

  // Dynamic aerial wobble along the ascent vector
  const rotate = useTransform(smoothProgress, [0, 0.5, 1], [-6, 3, 14]);

  // Star twinkle opacity near the culmination of the blast-off
  const twinkleOpacity = useTransform(smoothProgress, [0.84, 0.94, 1], [0, 1, 0.8]);
  const twinkleScale = useTransform(smoothProgress, [0.84, 0.94, 1], [0.3, 1.3, 1]);

  if (!mounted) return null;

  const handleClick = () => {
    playBlastOffSound();
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 3200);
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-25 overflow-hidden select-none"
    >
      {/* Scroll-Driven Team Rocket Flying Capsule */}
      <motion.div
        style={{
          x,
          y,
          scale,
          rotate,
        }}
        className="absolute top-0 left-0 will-change-transform"
      >
        <div className="relative group pointer-events-auto cursor-pointer" onClick={handleClick}>
          
          {/* Comic Dialogue Balloon */}
          <AnimatePresence>
            {showQuote && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -16, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.85 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white text-black font-mono font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-xl shadow-2xl border-2 border-[#D21319] whitespace-nowrap z-30"
              >
                <span>🚀 TEAM ROCKET IS BLASTING OFF AGAIN!</span>
                {/* Speech balloon tail */}
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#D21319]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jessie, James & Meowth Sprite */}
          <img
            src="/assets/team-rocket-blastoff.png"
            alt="Team Rocket Blasting Off"
            className="w-36 sm:w-48 md:w-56 h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-200"
            draggable={false}
          />

          {/* Iconic Anime Twinkle Star (Apex of Flight) */}
          <motion.div
            style={{
              opacity: twinkleOpacity,
              scale: twinkleScale,
            }}
            className="absolute -top-4 -right-4 pointer-events-none"
          >
            <svg
              className="w-8 h-8 text-amber-300 animate-spin"
              style={{ animationDuration: '4s' }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
