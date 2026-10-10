'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Heart, Play } from 'lucide-react';

interface NurseJoyHelpCompanionProps {
  className?: string;
}

export function NurseJoyHelpCompanion({ className = '' }: NurseJoyHelpCompanionProps) {
  // Silent easter egg counter: strictly 7 edge-to-edge screen drags (NO visible hint)
  const [completedEdgeDrags, setCompletedEdgeDrags] = useState(0);
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

  // Ensure body scroll is locked while full screen video modal is active
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.muted = isMuted;
          videoRef.current.volume = 1.0;
          videoRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Unmuted playback awaiting tap:', err);
              setIsPlaying(false);
            });
        }
      }, 60);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
  }, [showVideo, isMuted]);

  const handleDragStart = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } }
  ) => {
    setIsDragging(true);
    dragStartPointRef.current = { x: info.point.x, y: info.point.y };
  };

  const handleDrag = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number } }
  ) => {
    const { x, y } = info.offset;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

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

    // Require an across-the-screen drag from edge to edge
    // Measured either by total distance traversed or spanning across at least 45% of viewport width
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const dragDistanceX = Math.abs(info.point.x - dragStartPointRef.current.x);
    const minEdgeToEdgeThreshold = Math.min(screenWidth * 0.45, 340);

    const isAcrossScreen = dragDistanceX >= minEdgeToEdgeThreshold;

    if (isAcrossScreen) {
      playRetroChime();
      const nextCount = completedEdgeDrags + 1;
      setCompletedEdgeDrags(nextCount);

      if (nextCount >= 7) {
        setShowVideo(true);
        setCompletedEdgeDrags(0);
        setCurrentPrompt(
          '💖 Special archive transmission unlocked! Enjoy the exclusive Pokémon Center presentation!'
        );
      }
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
        {/* RETRO 2D DIALOGUE BUBBLE OFFERING HELP (NO 0/7 OR DRAG HINTS) */}
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
          onClick={() => {
            if (!showSpeechBubble) setShowSpeechBubble(true);
            playRetroChime();
          }}
          title="Nurse Joy & Chansey · 2D Pixel Pokémon Center Companion"
        >
          {/* Authentic 2D Pixel Art Sprite (Nurse Joy with clipboard & Chansey with egg) */}
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

      {/* FULL-SCREEN SECRET NURSE JOY VIDEO MODAL */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black flex flex-col justify-between overflow-hidden cursor-default select-none"
          >
            {/* Top Bar Header */}
            <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/75 to-transparent flex items-center justify-between text-white font-mono text-xs select-none">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" />
                <span className="font-bold tracking-wider uppercase text-xs sm:text-sm text-[#E9E6DA]">
                  NURSE JOY &amp; CHANSEY · SECRET TRANSMISSION
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-pink-900/80 text-pink-200 border border-pink-500/50 px-2 py-0.5 rounded font-mono font-bold">
                  HEALING ARCHIVES UNLOCKED
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Audio Status & Toggle */}
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
                    setShowVideo(false);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-black/80 hover:bg-[#D21319] text-white border border-white/30 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Close transmission"
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
                src="/media/nurse-joy-video.mp4"
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
                className="w-full h-full object-contain"
              >
                <source src="/media/nurse-joy-video.mp4" type="video/mp4" />
                <source src="/media/Oh-Nurse-Joy-SnapYT.App.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-2xl border-2 border-white animate-pulse mb-3 transition-transform hover:scale-110">
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
              <span className="text-pink-400 font-bold">JARVIS 3.0 · POKÉMON CENTER ARCHIVES</span>
              <span className="text-slate-400 uppercase tracking-wider">
                Audio ON by default · Press ✕ to exit full screen
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
