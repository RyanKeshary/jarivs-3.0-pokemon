'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { playInstantVoice, lazyStoreMedia } from '@/lib/mediaCache';

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
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maxTravelRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Lazy store Nurse Joy video in chunk packets in background so it's ready instantly
  useEffect(() => {
    lazyStoreMedia(['/media/nurse-joy-video.mp4', '/media/nurse-joy-voice.mp3']);
  }, []);

  // Play authentic Nurse Joy & Chansey voice line on every single click/drag
  const playRetroChime = useCallback(() => {
    playInstantVoice('/media/nurse-joy-voice.mp3', 1.0);
  }, []);

  // Reliable video autoplay with audio strictly ON by default (unmuted, full volume)
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.volume = 1.0;
    vid.muted = false;

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback policy retry:', err);
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    }
  }, []);

  // Lock body scroll while video lightbox is active & pause background lullaby
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = 'hidden';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pause_background_audio'));
      }
      // Trigger immediately without artificial delay to preserve user gesture
      const raf = requestAnimationFrame(() => {
        attemptPlay();
      });
      return () => {
        cancelAnimationFrame(raf);
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
        setShowVideo(true);
        setCompletedEdgeDrags(0);
        targetSwipesRef.current = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
      }
    }
  };

  const handleCharacterClick = () => {
    playRetroChime();

    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    // Tap easter egg trigger (40-67 taps)
    if (nextClicks >= targetClicksRef.current) {
      setShowVideo(true);
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 40 + 1)) + 40;
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
              }}
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
                  <span className="flex items-center gap-1 text-[11px] text-emerald-300 px-2.5 py-1 bg-emerald-950/60 rounded border border-emerald-500/40 font-mono font-bold">
                    AUDIO ON
                  </span>

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
