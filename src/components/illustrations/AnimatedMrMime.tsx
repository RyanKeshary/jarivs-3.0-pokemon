'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';

interface AnimatedMrMimeProps {
  size?: number;
  className?: string;
  showBarrier?: boolean;
}

export function AnimatedMrMime({
  size = 110,
  className = '',
  showBarrier = true,
}: AnimatedMrMimeProps) {
  const [isTapping, setIsTapping] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number }[]>([]);

  // Easter egg: random target click threshold between 10 and 15
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (15 - 10 + 1)) + 10);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideoModal) {
        setShowVideoModal(false);
      }
    };
    if (showVideoModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showVideoModal]);

  // Synthesize Mr. Mime's signature playful psychic tap sound via native Web Audio API
  const playMimeSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // First crisp glass "tink"
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.18);

      // Second harmonic overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.14);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio may be muted or blocked by autoplay policy
    }
  }, []);

  const handleInteract = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTapping(true);
    playMimeSound();

    const phrases = ['✨ TINK! ✨', '🖐️ *mime* 🖐️', '🛡️ BARRIER!', '✨ *tap tap* ✨', '🔮 PSYCHIC!'];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    const id = Date.now();
    const xOffset = (Math.random() - 0.5) * 36;

    setFloatingTexts((prev) => [...prev.slice(-3), { id, text, x: xOffset }]);

    setTimeout(() => {
      setIsTapping(false);
    }, 600);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1800);

    // Easter egg random click tracking (10 to 15 clicks)
    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    if (nextClicks >= targetClicksRef.current) {
      setShowVideoModal(true);
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
    }
  };

  return (
    <>
      <div
        className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
        onClick={handleInteract}
        title="Mr. Mime · No. 122 (Barrier Pokémon) — Click to tap the invisible wall!"
        style={{ width: size, height: size + 20 }}
      >
        {/* Floating Sparkles / Onomatopoeia */}
        <div className="absolute inset-x-0 -top-6 h-8 pointer-events-none flex justify-center items-center z-30">
          <AnimatePresence>
            {floatingTexts.map((item) => (
              <motion.span
                key={item.id}
                initial={{ opacity: 0, y: 10, scale: 0.8, x: item.x }}
                animate={{ opacity: 1, y: -16, scale: 1.05 }}
                exit={{ opacity: 0, y: -28, scale: 0.7 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute font-mono text-[10px] font-bold text-[#D21319] bg-white/95 px-2 py-0.5 rounded-full border border-black/20 shadow-[1px_1px_0px_#000] tracking-wider whitespace-nowrap"
              >
                {item.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* 3D Model Floating Stage */}
        <motion.div
          animate={{
            y: [0, -4, 0],
            rotate: [-1.2, 1.2, -1.2],
          }}
          transition={{
            duration: 2.25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {/* Ambient Back Glow */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D21319]/10 via-[#FF7A8A]/15 to-transparent blur-md scale-95 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />

          {/* Authentic 3D Model Animated Mr. Mime */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mr-mime.gif"
            alt="Mr. Mime 3D Model Animation"
            width={size}
            height={size}
            className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)] transition-transform duration-200"
            style={{ imageRendering: 'auto' }}
            loading="lazy"
          />

          {/* Signature Invisible Barrier Glass Screen (Visible on Hover / Tap) */}
          {showBarrier && (
            <motion.div
              animate={
                isTapping
                  ? { opacity: [0.9, 0.4, 0], scale: [1.05, 1.08, 1.05] }
                  : { opacity: [0.08, 0.22, 0.08] }
              }
              transition={
                isTapping
                  ? { duration: 0.5, ease: 'easeOut' }
                  : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
              }
              className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            >
              <div className="w-[88%] h-[88%] rounded-xl border border-[#D21319]/40 bg-gradient-to-b from-[#FAF8F5]/30 to-[#FF7A8A]/10 backdrop-blur-[0.5px] shadow-[0_0_12px_rgba(210,19,25,0.25)] flex items-center justify-center overflow-hidden">
                {/* Glass Sheen Shimmer Reflection */}
                <div className="w-[200%] h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent rotate-45 transform -translate-y-4 animate-pulse" />
                {/* Barrier Hex Grid Accents */}
                <svg className="w-full h-full opacity-30 stroke-[#D21319]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="32" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M20 50 H80 M50 20 V80" strokeWidth="0.75" strokeDasharray="2 4" />
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 3D Perspective Ground Shadow (Breathes with Mr. Mime's animation) */}
        <motion.div
          animate={{
            scaleX: [1, 1.12, 1],
            opacity: [0.35, 0.5, 0.35],
          }}
          transition={{
            duration: 2.25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-2 w-16 bg-black/20 rounded-full blur-[2px] mt-1 pointer-events-none"
        />
      </div>

      {/* MR. MIME EASTER EGG VIDEO MODAL */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVideoModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md cursor-default select-none"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-black border-2 border-white shadow-[8px_8px_0px_#D21319] rounded-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-2.5 sm:p-3 bg-[#161A35] border-b border-white/20 flex items-center justify-between text-white font-mono text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse" />
                  <span className="font-bold tracking-wider uppercase text-[11px] sm:text-xs text-[#E9E6DA]">
                    MR. MIME SECRET ARCHIVE TAPE
                  </span>
                  <span className="hidden sm:inline-block text-[9px] bg-red-900/60 text-red-200 border border-red-500/40 px-1.5 py-0.5 rounded font-mono">
                    UNLOCKED!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
                  title="Close [ESC]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Video Player Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/media/mr-mime-secret.mp4"
                  autoPlay
                  controls
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="p-2.5 bg-[#0F1226] border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-slate-300 select-none">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                      }
                    }}
                    className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors cursor-pointer px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                  >
                    {isMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} className="text-green-400" />}
                    <span>{isMuted ? 'UNMUTE SOUND' : 'MUTED'}</span>
                  </button>
                  <span className="hidden sm:inline text-slate-400">
                    PRESS ESC TO CLOSE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-3 py-1 bg-white hover:bg-[#D21319] text-black hover:text-white font-bold uppercase transition-colors rounded-xs text-[10px] cursor-pointer"
                >
                  CLOSE [ESC]
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
