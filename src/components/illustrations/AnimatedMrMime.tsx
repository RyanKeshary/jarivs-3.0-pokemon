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

  // Click tracking to trigger the secret tape lightbox (random range 40-67)
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 40 + 1)) + 40);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Play video with robust browser autoplay fallback (audio strictly ON by default)
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.volume = 1.0;
    vid.muted = isMuted; // False by default: audio ON

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Initial unmuted autoplay restricted by browser policy; starting muted video with audio ready on first tap:', err);
          // Start video frames so it doesn't freeze, but preserve audio-on user setting
          vid.muted = true;
          vid.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((e2) => {
              console.warn('Autoplay requires direct user tap:', e2);
              setIsPlaying(false);
            });
        });
    }
  }, [isMuted]);

  // Lock body scroll while lightbox is active & listen for Escape key
  useEffect(() => {
    if (showVideoModal) {
      document.body.style.overflow = 'hidden';
      // Pause any background audio / lullaby
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pause_background_audio'));
      }
      const timer = setTimeout(() => {
        attemptPlay();
      }, 60);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
  }, [showVideoModal, attemptPlay]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideoModal) {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoModal]);

  // Listen for global pause requests
  useEffect(() => {
    const handlePauseVideo = () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    };
    window.addEventListener('pause_video_transmission', handlePauseVideo);
    return () => window.removeEventListener('pause_video_transmission', handlePauseVideo);
  }, []);

  const closeLightbox = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowVideoModal(false);
    setIsPlaying(false);
  };

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

    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    // Open lightbox when reaching target clicks (40-67 taps)
    if (nextClicks >= targetClicksRef.current) {
      setIsMuted(false);
      setShowVideoModal(true);
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 40 + 1)) + 40;
    }
  };

  const handleModalInteraction = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (!isMuted && vid.muted) {
      vid.muted = false;
      vid.volume = 1.0;
    }
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    vid.volume = 1.0;
    setIsMuted(nextMuted);
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <>
      <div className="relative inline-flex flex-col items-center justify-center">
        <div
          className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
          onClick={handleInteract}
          title="Mr. Mime · No. 122 (Barrier Pokémon) — Tap to interact!"
          style={{ width: size, height: size + 16 }}
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

          {/* 3D Perspective Ground Shadow */}
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
      </div>

      {/* ============================================================== */}
      {/* MR. MIME ELEGANT RETRO LIGHTBOX MODAL                         */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-default select-none"
            onClick={closeLightbox}
          >
            {/* Centered Lightbox Card: Sized to fit 9:16 portrait video seamlessly */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-[360px] sm:max-w-[420px] bg-[#0E101D] border-2 border-[#D21319] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(210,19,25,0.35)] overflow-hidden flex flex-col my-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleModalInteraction();
              }}
              onPointerDown={handleModalInteraction}
            >
              {/* Lightbox Header Bar */}
              <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-b border-white/10 flex items-center justify-between text-white font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse shadow-[0_0_8px_#D21319]" />
                  <span className="font-bold tracking-wider uppercase text-xs text-[#E9E6DA]">
                    MR. MIME SECRET TAPE
                  </span>
                  <span className="text-[9px] bg-red-950/80 text-red-300 border border-red-500/50 px-1.5 py-0.2 rounded font-bold">
                    #122
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Audio Mute/Unmute toggle */}
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="flex items-center gap-1 text-[11px] text-slate-200 hover:text-white px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all cursor-pointer font-bold"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX size={13} className="text-amber-400" />
                        <span className="text-amber-300">UNMUTE</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} className="text-emerald-400" />
                        <span className="text-emerald-300">AUDIO ON</span>
                      </>
                    )}
                  </button>

                  {/* Close Lightbox Button */}
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-[#D21319] text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow"
                    title="Close Lightbox (Esc)"
                    aria-label="Close Lightbox"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Video Player Area with Aspect Ratio matching 480x864 portrait */}
              <div className="relative w-full aspect-[9/16] max-h-[68vh] bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  poster="/media/mr-mime-poster.jpg"
                  autoPlay
                  controls
                  playsInline
                  loop
                  preload="auto"
                  muted={isMuted}
                  onCanPlay={attemptPlay}
                  onLoadedMetadata={attemptPlay}
                  onPlay={() => setIsPlaying(true)}
                  onPlaying={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain bg-black"
                >
                  <source src="/media/mr-mime-secret.mp4" type="video/mp4" />
                  <source src="/media/mr-mime-secret.webm" type="video/webm" />
                  Your browser does not support HTML5 video.
                </video>

                {/* Big Center Play Overlay (visible if paused or awaiting interaction) */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const vid = videoRef.current;
                      if (vid) {
                        vid.muted = false;
                        vid.volume = 1.0;
                        setIsMuted(false);
                        vid.play()
                          .then(() => setIsPlaying(true))
                          .catch((err) => {
                            console.warn('Playback error:', err);
                            vid.muted = true;
                            vid.play().then(() => setIsPlaying(true)).catch(() => {});
                          });
                      }
                    }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] cursor-pointer group transition-opacity"
                    aria-label="Play video"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#D21319] text-white flex items-center justify-center shadow-2xl border-2 border-white mb-2 transition-transform group-hover:scale-110 active:scale-95">
                      <Play size={26} className="translate-x-0.5 fill-white" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-black/80 px-3 py-1 rounded border border-white/20 uppercase tracking-wider">
                      Tap to Play
                    </span>
                  </button>
                )}
              </div>

              {/* Lightbox Footer Bar */}
              <div className="px-3.5 py-2 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-slate-300">
                <span className="text-[#D21319] font-bold">JARVIS 3.0 · ARCHIVES</span>
                <span className="text-slate-400 uppercase tracking-wider">
                  Click backdrop or ✕ to close
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
