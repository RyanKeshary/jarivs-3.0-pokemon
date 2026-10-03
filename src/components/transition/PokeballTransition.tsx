'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PokeballTransitionProps {
  isOpening: boolean;
  onAnimationComplete?: () => void;
}

export function PokeballTransition({
  isOpening,
  onAnimationComplete,
}: PokeballTransitionProps) {
  if (!isOpening) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Top Red Half */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-105%' }}
        transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#EE1515] border-b-8 border-[#1E232A] flex items-end justify-center shadow-2xl"
      >
        <div className="w-full h-8 bg-gradient-to-t from-black/20 to-transparent" />
      </motion.div>

      {/* Bottom White Half */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '105%' }}
        transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
        onAnimationComplete={onAnimationComplete}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#F8F9FA] border-t-8 border-[#1E232A] flex items-start justify-center shadow-2xl"
      >
        <div className="w-full h-8 bg-gradient-to-b from-black/10 to-transparent" />
      </motion.div>

      {/* Center Pokéball Button */}
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: [1, 1.3, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white border-8 border-[#1E232A] flex items-center justify-center shadow-2xl z-10"
      >
        <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-4 border-[#1E232A] bg-white pulse-glow flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#1E232A]" />
        </div>
      </motion.div>
    </div>
  );
}
