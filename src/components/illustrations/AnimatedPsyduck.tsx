'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedPsyduckProps {
  size?: number;
  className?: string;
  showConfusionFx?: boolean;
  onEasterEggTrigger?: () => void;
  onTap?: () => void;
}

export function AnimatedPsyduck({
  size = 100,
  className = '',
  showConfusionFx = true,
  onEasterEggTrigger,
  onTap,
}: AnimatedPsyduckProps) {
  const [isScratching, setIsScratching] = useState(false);
  const [floatingNotes, setFloatingNotes] = useState<{ id: number; text: string; x: number }[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 40 + 1)) + 40);

  // Synthesize Psyduck's nostalgic confused "Psy-yi-yi?!" quack chime via native Web Audio API
  const playPsyduckCry = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // 1. Quizzical rising quack oscillator
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(540, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(380, now + 0.28);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.32);

      // 2. Head-scratch harmonic overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(640, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.16);
      osc2.frequency.exponentialRampToValueAtTime(700, now + 0.35);
      gain2.gain.setValueAtTime(0.06, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.4);
    } catch {
      // Audio muted or autoplay policy
    }
  }, []);

  const handleInteract = () => {
    setIsScratching(true);
    playPsyduckCry();

    if (onTap) {
      onTap();
    }

    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    if (nextClicks >= targetClicksRef.current) {
      if (onEasterEggTrigger) {
        onEasterEggTrigger();
      }
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 40 + 1)) + 40;
    }

    const phrases = ['💫 PSY...?!', '❓ *scratches head*', '✨ PSY-DUCK! ✨', '💭 *headache intensifies*', `💫 *tap ${nextClicks}*`];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    const id = Date.now();
    const xOffset = (Math.random() - 0.5) * 32;

    setFloatingNotes((prev) => [...prev.slice(-3), { id, text, x: xOffset }]);

    setTimeout(() => {
      setIsScratching(false);
    }, 700);

    setTimeout(() => {
      setFloatingNotes((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
      onClick={handleInteract}
      title="Psyduck · No. 054 (Duck Pokémon) — Scratching its head in confusion! Click to soothe."
      style={{ width: size, height: size + 16 }}
    >
      {/* Floating Confusion Bubbles / Onomatopoeia */}
      <div className="absolute inset-x-0 -top-7 h-8 pointer-events-none flex justify-center items-center z-30">
        <AnimatePresence>
          {floatingNotes.map((item) => (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, y: 8, scale: 0.8, x: item.x }}
              animate={{ opacity: 1, y: -16, scale: 1.05 }}
              exit={{ opacity: 0, y: -26, scale: 0.7 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute font-mono text-[10px] font-bold text-amber-900 bg-amber-100/95 px-2 py-0.5 rounded-full border border-amber-300 shadow-[1px_1px_0px_#000] tracking-wider whitespace-nowrap"
            >
              {item.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Looping Head-Scratching Sway & Rocking Animation */}
      <motion.div
        animate={
          isScratching
            ? {
                rotate: [-8, 8, -6, 6, 0],
                y: [0, -5, 0, -3, 0],
                scale: [1, 1.08, 0.98, 1.05, 1],
              }
            : {
                rotate: [-3.5, 3.5, -3.5],
                y: [0, -3, 0],
              }
        }
        transition={
          isScratching
            ? { duration: 0.65, ease: 'easeInOut' }
            : {
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Soft Golden Ambient Aura Behind Psyduck */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-300/20 via-yellow-200/25 to-transparent blur-md scale-95 group-hover:scale-115 transition-transform duration-500 pointer-events-none" />

        {/* Authentic 3D Model Animated Psyduck (Holding / Scratching its head) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/psyduck.gif"
          alt="Psyduck Scratching Head 3D Animation"
          width={size}
          height={size}
          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)] transition-transform duration-200"
          style={{ imageRendering: 'auto' }}
          loading="lazy"
        />

        {/* Ambient Confusion Spiral / Sweatdrop Accents */}
        {showConfusionFx && (
          <motion.div
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute -top-1 -right-1 z-20 pointer-events-none w-5 h-5 flex items-center justify-center text-amber-500 font-bold text-xs"
          >
            💫
          </motion.div>
        )}
      </motion.div>

      {/* 3D Ground Perspective Shadow (Breathes and rocks with Psyduck) */}
      <motion.div
        animate={{
          scaleX: [1, 1.14, 1],
          opacity: [0.3, 0.45, 0.3],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="h-2 w-14 bg-black/20 rounded-full blur-[2px] mt-0.5 pointer-events-none"
      />
    </div>
  );
}
