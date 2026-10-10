'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play } from 'lucide-react';

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

  // Easter egg: random target click threshold between 40 and 67
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 40 + 1)) + 40);
  const [showVideoModal, setShowVideoModal] = useState(false);
  // Audio is ON by default
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reliable mobile play trigger with unmuted audio by default
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = isMuted;
    vid.volume = 1.0;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Autoplay awaiting user gesture for unmuted playback:', err);
          setIsPlaying(false);
        });
    }
  }, [isMuted]);

  // Lock body scroll while video modal is active; ONLY closeable via the cross button
  useEffect(() => {
    if (showVideoModal) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        attemptPlay();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showVideoModal, attemptPlay]);

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

    // Easter egg random click tracking (40 to 67 clicks)
    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    if (nextClicks >= targetClicksRef.current) {
      setShowVideoModal(true);
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 40 + 1)) + 40;
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

      {/* MR. MIME EASTER EGG FULL-SCREEN VIDEO MODAL */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden cursor-default select-none"
          >
            {/* Top Bar Header with Title and Close ✕ Button */}
            <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/75 to-transparent flex items-center justify-between text-white font-mono text-xs select-none">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#D21319] animate-pulse shadow-[0_0_8px_#D21319]" />
                <span className="font-bold tracking-wider uppercase text-xs sm:text-sm text-[#E9E6DA]">
                  MR. MIME SECRET ARCHIVE TAPE
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-red-900/80 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-mono font-bold">
                  UNLOCKED ARCHIVE
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const vid = videoRef.current;
                    if (!vid) return;
                    const nextMuted = !isMuted;
                    vid.muted = nextMuted;
                    setIsMuted(nextMuted);
                    if (vid.paused) {
                      vid.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }}
                  className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors cursor-pointer px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/20 font-bold text-xs"
                >
                  {isMuted ? <VolumeX size={15} className="text-amber-400" /> : <Volume2 size={15} className="text-emerald-400" />}
                  <span>{isMuted ? 'UNMUTE SOUND 🔊' : 'AUDIO ON 🔊'}</span>
                </button>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.pause();
                    }
                    setShowVideoModal(false);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-black/80 hover:bg-[#D21319] text-white border border-white/30 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Video Player Area: Takes Full Screen */}
            <div className="relative w-full h-full flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src="/media/mr-mime-secret.mp4"
                autoPlay
                controls
                playsInline
                // @ts-ignore
                webkit-playsinline="true"
                x5-playsinline="true"
                muted={isMuted}
                loop
                preload="auto"
                onPlay={() => setIsPlaying(true)}
                onPlaying={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={attemptPlay}
                onCanPlay={attemptPlay}
                className="w-full h-full object-contain"
              />

              {/* Big Tap to Play / Resume Fallback Overlay */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const vid = videoRef.current;
                    if (vid) {
                      vid.muted = isMuted;
                      vid.volume = 1.0;
                      vid.play()
                        .then(() => setIsPlaying(true))
                        .catch((err) => {
                          console.warn('Playback error:', err);
                        });
                    }
                  }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] cursor-pointer"
                  aria-label="Play video"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D21319] hover:bg-[#b00f14] text-white flex items-center justify-center shadow-2xl border-2 border-white animate-pulse mb-3 transition-transform hover:scale-110">
                    <Play size={30} className="translate-x-0.5 fill-white" />
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-bold text-white bg-black/80 px-4 py-1.5 rounded border border-white/20 uppercase tracking-wider">
                    Tap to Play Full Screen Video
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Bar Info */}
            <div className="relative z-30 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex items-center justify-between font-mono text-[11px] text-slate-300 select-none">
              <span className="text-[#D21319] font-bold">JARVIS 3.0 · MR. MIME ARCHIVES</span>
              <span className="text-slate-400 uppercase tracking-wider">
                Press ✕ to exit full screen
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
