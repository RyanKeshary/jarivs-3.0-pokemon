'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Play, Pause } from 'lucide-react';

interface VideoIntroSceneProps {
  onComplete: () => void;
}

export function VideoIntroScene({ onComplete }: VideoIntroSceneProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(13.9);
  const [isWiping, setIsWiping] = useState(false);
  const [showCenterFeedback, setShowCenterFeedback] = useState<'play' | 'pause' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger brief audio cue using Web Audio API for tactical UI feedback
  const playTacticalChime = useCallback((freq = 587.33, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext policy fallback
    }
  }, []);

  const [isExiting, setIsExiting] = useState(false);

  const handleFinishOrSkip = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    playTacticalChime(880, 'triangle');
    try {
      sessionStorage.setItem('indigo_vid_intro_seen', 'true');
    } catch {
      // ignore
    }
    // Instant cinematic fade directly into the hero section with zero intermediate card
    setTimeout(() => {
      onComplete();
    }, 450);
  }, [isExiting, onComplete, playTacticalChime]);

  const handleToggleSound = useCallback(() => {
    if (!videoRef.current) return;
    const nextSound = !soundOn;
    videoRef.current.muted = !nextSound;
    videoRef.current.volume = 1.0;
    setSoundOn(nextSound);
    playTacticalChime(nextSound ? 659.25 : 329.63);
  }, [soundOn, playTacticalChime]);

  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowCenterFeedback('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowCenterFeedback('pause');
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setShowCenterFeedback(null), 800);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleSound();
      } else if (e.code === 'Escape' || e.code === 'Enter') {
        e.preventDefault();
        handleFinishOrSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleToggleSound, handleFinishOrSkip]);

  // Sync video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format running SMPTE timecode (00:00:SS:FF)
  const formatTimecode = (seconds: number) => {
    const s = Math.floor(seconds);
    const ms = Math.floor((seconds % 1) * 24);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `00:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
  };

  // Circular progress calculations for the Skip CTA
  const circleRadius = 12;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - (circumference * progressPercent) / 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.08 : 1,
        filter: isExiting ? 'blur(12px) brightness(1.25)' : 'blur(0px) brightness(1)',
      }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-[#070913] flex items-center justify-center overflow-hidden select-none pointer-events-auto"
    >
      
      {/* 1. Cinematic Background Video Canvas */}
      <div className="relative w-full h-full cursor-pointer" onClick={handleTogglePlay}>
        <video
          ref={videoRef}
          src="/media/intro-vid.mp4"
          autoPlay
          playsInline
          muted={!soundOn}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleFinishOrSkip}
          className="w-full h-full object-cover"
        />

        {/* 2. Anamorphic Cinematic Letterbox Overlays */}
        {/* Top Vignette */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
        {/* Bottom Vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

        {/* 3. Subtle Futuristic HUD Reticle (Centered onto the Pokéball) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
          <svg className="w-[380px] sm:w-[460px] h-[380px] sm:h-[460px] animate-[spin_60s_linear_infinite]" viewBox="0 0 400 400">
            {/* Outer segmented radar track */}
            <circle cx="200" cy="200" r="185" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="3 8" fill="none" opacity="0.3" />
            <circle cx="200" cy="200" r="170" stroke="#D21319" strokeWidth="1.2" strokeDasharray="16 120" fill="none" opacity="0.7" />
            {/* Inner focus brackets */}
            <circle cx="200" cy="200" r="145" stroke="#E9E6DA" strokeWidth="0.6" strokeDasharray="6 6" fill="none" opacity="0.35" />
            <circle cx="200" cy="200" r="115" stroke="#D21319" strokeWidth="1" strokeDasharray="8 60" fill="none" opacity="0.6" />
          </svg>
          
          {/* Subtle crosshairs */}
          <div className="absolute w-12 h-12 border-t border-l border-white/50 -translate-x-14 -translate-y-14" />
          <div className="absolute w-12 h-12 border-t border-r border-white/50 translate-x-14 -translate-y-14" />
          <div className="absolute w-12 h-12 border-b border-l border-white/50 -translate-x-14 translate-y-14" />
          <div className="absolute w-12 h-12 border-b border-r border-white/50 translate-x-14 translate-y-14" />
        </div>

        {/* 4. Optical Corner Brackets (High-End Technical Framing) */}
        <div className="absolute top-4 left-4 sm:top-7 sm:left-7 pointer-events-none text-[9px] font-mono tracking-widest text-[#AFAEA2]/60 hidden sm:block">
          <span>┌ CODEX // SLRTCE MMXXVI</span>
        </div>
        <div className="absolute top-4 right-4 sm:top-7 sm:right-7 pointer-events-none text-[9px] font-mono tracking-widest text-[#AFAEA2]/60 hidden sm:block text-right">
          <span>OPTICAL TARGET: AUTOMATON ┐</span>
        </div>

        {/* 5. Center Play/Pause Micro-Feedback Animation */}
        <AnimatePresence>
          {showCenterFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/75 border border-white/30 backdrop-blur-md px-5 py-3 rounded-none shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center gap-3">
                {showCenterFeedback === 'play' ? (
                  <>
                    <Play className="w-5 h-5 text-white fill-white" />
                    <span className="font-mono text-xs uppercase tracking-widest text-white font-bold">TRANSMISSION ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 text-[#D21319] fill-[#D21319]" />
                    <span className="font-mono text-xs uppercase tracking-widest text-white font-bold">TRANSMISSION PAUSED</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. TOP CONTROL DOCK (Glassmorphic, Editorial, High-Tech) */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 sm:px-8 flex items-center justify-between z-30 pointer-events-auto">
        
        {/* Left: Festival Transmission Telemetry */}
        <div className="flex items-center gap-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 p-2 sm:px-4 sm:py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-all">
          {/* Pulsing REC Indicator */}
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] shadow-[0_0_8px_#D21319] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-red-500 uppercase">
              REC
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                INDIGO TECH FEST
              </span>
              <span className="hidden sm:inline font-mono text-[9px] text-[#AFAEA2] tracking-widest uppercase">
                · JARVIS 3.0
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-[#AFAEA2]">
              <span className="text-[#D21319] font-bold">PROLOGUE FEED</span>
              <span>·</span>
              <span className="tabular-nums tracking-widest">{formatTimecode(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Right: Master Control Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Sound Toggle (Interactive Animated Equalizer) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl border transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${
              soundOn
                ? 'bg-black/75 hover:bg-black/90 border-[#D21319]/80 text-white shadow-[0_0_15px_rgba(210,19,25,0.3)]'
                : 'bg-black/60 hover:bg-black/80 border-white/20 text-[#E9E6DA] hover:border-white/40'
            }`}
            title="Toggle Audio (Hotkey: M)"
          >
            {soundOn ? (
              <>
                <Volume2 className="w-4 h-4 text-[#D21319]" />
                {/* Dancing Equalizer Frequency Bars */}
                <div className="flex items-end gap-0.5 h-3.5 w-4">
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '70%' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.4s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '-0.2s' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.7s_ease-in-out_infinite]" style={{ height: '50%', animationDelay: '-0.4s' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.5s_ease-in-out_infinite]" style={{ height: '85%', animationDelay: '-0.1s' }} />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                  SOUND ACTIVE
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#AFAEA2]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#AFAEA2]">
                  UNMUTE
                </span>
              </>
            )}
            <kbd className="hidden sm:inline font-mono text-[9px] px-1 py-0.2 bg-white/10 text-neutral-400 border border-white/15">
              M
            </kbd>
          </button>

          {/* Hero Skip Button with Real-Time Radial Progress */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFinishOrSkip();
            }}
            className="group relative flex items-center gap-2.5 sm:gap-3 pl-3.5 pr-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#D21319] via-[#b91c1c] to-[#991b1b] hover:from-[#e11d48] hover:to-[#D21319] text-white font-sans font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[5px_5px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            title="Skip Prologue (Hotkey: ESC or SPACE)"
          >
            {/* Circular Progress Ring */}
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 28 28">
                {/* Background Track */}
                <circle
                  cx="14"
                  cy="14"
                  r={circleRadius}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Live Progress Arc */}
                <circle
                  cx="14"
                  cy="14"
                  r={circleRadius}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-150"
                />
              </svg>
              <FastForward className="w-2.5 h-2.5 text-white absolute" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-widest text-[11px] sm:text-xs">
                SKIP INTRO
              </span>
              <span className="text-white group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>

            <kbd className="hidden sm:inline font-mono text-[9px] px-1 py-0.5 bg-black/40 text-white/90 border border-white/30 ml-1">
              ESC
            </kbd>
          </button>

        </div>
      </header>



    </motion.div>
  );
}
