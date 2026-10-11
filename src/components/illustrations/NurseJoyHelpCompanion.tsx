'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Heart, Play } from 'lucide-react';

interface NurseJoyHelpCompanionProps {
  className?: string;
}

export function NurseJoyHelpCompanion({ className = '' }: NurseJoyHelpCompanionProps) {
  // Easter egg counter: counts edge-to-edge drags in ANY direction (random range 10-20)
  const [completedEdgeDrags, setCompletedEdgeDrags] = useState(0);
  const targetSwipesRef = useRef(Math.floor(Math.random() * (20 - 10 + 1)) + 10);
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 40 + 1)) + 40);
  const [showVideo, setShowVideo] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>(
    'Welcome to the Indigo Pokémon Center Help Desk! Need assistance reaching our coordinators? 💖'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maxTravelRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Synthesize authentic 8-bit/16-bit retro chime via Web Audio API
  const playRetroChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.07 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.18);
      });
    } catch {
      // Audio autoplay policy
    }
  }, []);

  // Reliable video autoplay with audio strictly ON by default
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
          console.warn('Initial unmuted playback restricted by browser policy; starting muted video with audio ready on first tap:', err);
          // Start video frames so it doesn't freeze, but preserve audio-on user setting
          vid.muted = true;
          vid.play()
            .then(() => setIsPlaying(true))
            .catch((e2) => {
              console.warn('Playback requires direct user tap:', e2);
              setIsPlaying(false);
            });
        });
    }
  }, [isMuted]);

  // Lock body scroll while video lightbox is active & pause background lullaby
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = 'hidden';
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
  }, [showVideo, attemptPlay]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideo) {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideo]);

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
    setShowVideo(false);
    setIsPlaying(false);
  };

  const handleDragStart = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } }
  ) => {
    setIsDragging(true);
    dragStartPointRef.current = { x: info.point.x, y: info.point.y };
    maxTravelRef.current = { x: 0, y: 0 };
  };

  const handleDrag = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number }; offset: { x: number; y: number } }
  ) => {
    const { x, y } = info.offset;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    const distX = Math.abs(info.point.x - dragStartPointRef.current.x);
    const distY = Math.abs(info.point.y - dragStartPointRef.current.y);

    maxTravelRef.current.x = Math.max(maxTravelRef.current.x, distX, absX);
    maxTravelRef.current.y = Math.max(maxTravelRef.current.y, distY, absY);

    if (absX > 25 || absY > 25) {
      if (absX > absY) {
        if (x < 0) {
          setCurrentPrompt(
            'Heading towards the West wing? 👈 Coordinating with Manthan & Shreyash for festival directives!'
          );
        } else {
          setCurrentPrompt(
            'Swiping East across the desk? 👉 Ryan & Shlok are on standby at the Takniki Coordination Desk!'
          );
        }
      } else {
        if (y < 0) {
          setCurrentPrompt(
            'Moving up? 👆 Direct student inquiries to Aditya, Indresh & Vaibhav for on-ground assistance!'
          );
        } else {
          setCurrentPrompt(
            'Taking a breather at the Pokémon Center? 👇 All fest coordinators are just a call away!'
          );
        }
      }
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number }; offset: { x: number; y: number } }
  ) => {
    setIsDragging(false);

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

    // Check travel across ANY axis: horizontal (left <-> right) OR vertical (top <-> bottom)
    const totalTravelX = Math.max(
      Math.abs(info.point.x - dragStartPointRef.current.x),
      Math.abs(info.offset.x),
      maxTravelRef.current.x
    );
    const totalTravelY = Math.max(
      Math.abs(info.point.y - dragStartPointRef.current.y),
      Math.abs(info.offset.y),
      maxTravelRef.current.y
    );

    // Responsive thresholds: ~18% screen dimension or 130px
    const thresholdX = Math.min(screenWidth * 0.18, 140);
    const thresholdY = Math.min(screenHeight * 0.16, 120);

    // Also count if dragged close to ANY screen edge (left, right, top, or bottom)
    const nearAnyEdge =
      info.point.x < 130 ||
      info.point.x > screenWidth - 130 ||
      info.point.y < 130 ||
      info.point.y > screenHeight - 130;

    const isEdgeToEdge =
      totalTravelX >= thresholdX ||
      totalTravelY >= thresholdY ||
      (nearAnyEdge && (totalTravelX >= 70 || totalTravelY >= 70)) ||
      Math.hypot(totalTravelX, totalTravelY) >= 150;

    if (isEdgeToEdge) {
      playRetroChime();
      const nextCount = completedEdgeDrags + 1;
      setCompletedEdgeDrags(nextCount);

      if (nextCount >= targetSwipesRef.current) {
        setIsMuted(false);
        setShowVideo(true);
        setCompletedEdgeDrags(0);
        targetSwipesRef.current = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        setCurrentPrompt(
          '💖 Special archive transmission unlocked! Enjoy the exclusive Pokémon Center presentation!'
        );
      } else {
        setCurrentPrompt(
          `💖 Healing wave [${nextCount}/${targetSwipesRef.current}] registered! Keep sweeping across the screen in any direction!`
        );
      }
    }
  };

  const handleCharacterClick = () => {
    if (!showSpeechBubble) setShowSpeechBubble(true);
    playRetroChime();

    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    // Tap easter egg trigger (40-67 taps)
    if (nextClicks >= targetClicksRef.current) {
      setIsMuted(false);
      setShowVideo(true);
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
      {/* 2D PIXELATED RETRO NURSE JOY & CHANSEY COMPANION */}
      <motion.div
        drag
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.06, cursor: 'grabbing' }}
        className={`fixed z-40 select-none bottom-5 right-5 sm:bottom-8 sm:right-8 flex flex-col items-end pointer-events-auto cursor-grab touch-none ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* RETRO 2D DIALOGUE BUBBLE OFFERING HELP */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 10 }}
              className="relative mb-2 max-w-[270px] sm:max-w-[320px] bg-white border-2 border-black p-3 sm:p-3.5 shadow-[4px_4px_0px_#000] text-black rounded-none"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b-2 border-black/10 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 font-black text-[#D21319] tracking-wider uppercase">
                  <Heart size={12} className="fill-[#D21319]" />
                  <span>POKÉMON CENTER DESK</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeechBubble(false);
                    }}
                    className="text-neutral-500 hover:text-black cursor-pointer p-0.5"
                    title="Dismiss dialogue"
                    aria-label="Dismiss dialogue"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Dynamic Speech Text */}
              <p className="font-sans text-xs sm:text-[13px] leading-snug font-medium text-neutral-800">
                {currentPrompt}
              </p>

              {/* Dialogue Arrow pointing to pixel character */}
              <div className="absolute -bottom-2 right-10 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2D PIXELATED SPRITE CONTAINER */}
        <div
          className="relative group flex items-end justify-center"
          onClick={handleCharacterClick}
          title="Nurse Joy & Chansey · Drag across the screen in any direction (left-right or top-bottom) to unlock secret!"
        >
          {/* Authentic 2D Pixel Art Sprite */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/assets/pixel-nurse-joy-chansey.png"
            alt="2D Pixel Art Nurse Joy and Chansey"
            animate={
              isDragging
                ? {
                    y: [-2, 2, -2],
                    rotate: [-3, 3, -3],
                  }
                : {
                    y: [0, -4, 0],
                  }
            }
            transition={
              isDragging
                ? { duration: 0.25, repeat: Infinity }
                : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            }
            style={{
              imageRendering: 'pixelated',
            }}
            className="relative z-10 w-28 sm:w-36 h-auto object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.28)] pointer-events-none"
          />

          {/* Retro Pixel Contact Shadow */}
          <div className="absolute -bottom-1 w-24 sm:w-32 h-2 bg-black/35 rounded-none blur-[1px] pointer-events-none" />
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* NURSE JOY ELEGANT RETRO LIGHTBOX MODAL                         */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-default select-none"
            onClick={closeLightbox}
          >
            {/* Centered Lightbox Card: Sized for 16:9 landscape presentation */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl sm:max-w-3xl bg-[#0E101D] border-2 border-pink-500 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(236,72,153,0.35)] overflow-hidden flex flex-col my-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleModalInteraction();
              }}
              onPointerDown={handleModalInteraction}
            >
              {/* Lightbox Top Header Bar */}
              <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-b border-white/10 flex items-center justify-between text-white font-mono text-xs select-none">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" />
                  <span className="font-bold tracking-wider uppercase text-xs sm:text-sm text-[#E9E6DA]">
                    NURSE JOY &amp; CHANSEY TRANSMISSION
                  </span>
                  <span className="hidden sm:inline-block text-[9px] bg-pink-950/80 text-pink-300 border border-pink-500/50 px-2 py-0.5 rounded font-bold">
                    HEALING ARCHIVES
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Audio Status & Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="flex items-center gap-1 text-[11px] text-slate-200 hover:text-white px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all cursor-pointer font-bold"
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
                    title="Close transmission (Esc)"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Video Player Area with Aspect Ratio matching 16:9 */}
              <div className="relative w-full aspect-video max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  poster="/media/nurse-joy-poster.jpg"
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
                  <source src="/media/nurse-joy-video.mp4" type="video/mp4" />
                  <source src="/media/nurse-joy-video.webm" type="video/webm" />
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
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-2xl border-2 border-white mb-2 transition-transform group-hover:scale-110 active:scale-95">
                      <Play size={26} className="translate-x-0.5 fill-white" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-black/80 px-3 py-1 rounded border border-white/20 uppercase tracking-wider">
                      Tap to Play Transmission
                    </span>
                  </button>
                )}
              </div>

              {/* Lightbox Footer Bar */}
              <div className="px-3.5 py-2 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-slate-300">
                <span className="text-pink-400 font-bold">JARVIS 3.0 · POKÉMON CENTER ARCHIVES</span>
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
