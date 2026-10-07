'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Play, Pause, ChevronRight, Sparkles } from 'lucide-react';
import { playRetroBeep, isSoundEnabled, toggleSound } from '@/lib/sound';

interface IntroSceneProps {
  onComplete: () => void;
}

const DIALOGUES = [
  {
    speaker: 'PROFESSOR OAK',
    text: 'Welcome, Trainer! The Kento League is about to commence at SLRTCE!',
    tag: 'SYSTEM BOOT',
  },
  {
    speaker: 'PROFESSOR OAK',
    text: 'Assemble your dream squad, code legendary hacks, and claim the ₹90,000+ prize pool!',
    tag: 'MISSION BRIEF',
  },
  {
    speaker: 'PROFESSOR OAK',
    text: 'Prepare your Pokéball. The battle arena awaits your command!',
    tag: 'BATTLE READY',
  },
];

export function IntroScene({ onComplete }: IntroSceneProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (videoRef.current) {
      videoRef.current.muted = !newState;
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setVideoProgress((current / total) * 100);

    // Auto-advance dialogue steps based on video timestamps
    if (total > 0) {
      const ratio = current / total;
      if (ratio > 0.66) {
        setCurrentStep(2);
      } else if (ratio > 0.33) {
        setCurrentStep(1);
      } else {
        setCurrentStep(0);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      videoRef.current.play().catch(() => {
        // Autoplay policy might require muted start
        if (videoRef.current) {
          videoRef.current.muted = true;
          setSoundOn(false);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  };

  const handleVideoEnded = () => {
    finishIntro();
  };

  const finishIntro = () => {
    localStorage.setItem('kento_intro_seen', 'true');
    document.cookie = 'kento_intro_seen=true; path=/; max-age=864000';
    playRetroBeep(660, 'square', 0.08);
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden">
      {/* Full-screen Introduction Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="/introduction.mp4"
          autoPlay
          playsInline
          muted={!soundOn}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
        {/* Cinematic Vignette & Ambient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      </div>

      {/* Top Cinematic HUD Header */}
      <div className="w-full max-w-6xl mx-auto z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-white shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EE1515] animate-ping" />
          <span className="font-pixel text-[10px] sm:text-xs text-[#FFCB05] tracking-wider uppercase">
            KENTO LEAGUE · INTRODUCTION
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={togglePlayPause}
            className="p-2 sm:px-3 sm:py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full sm:rounded-lg border border-white/20 text-xs font-mono backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            title={isPlaying ? 'Pause Video' : 'Play Video'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span className="hidden sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={handleSoundToggle}
            className="p-2 sm:px-3 sm:py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full sm:rounded-lg border border-white/20 text-xs font-mono backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            title="Toggle Audio"
          >
            {soundOn ? (
              <Volume2 size={16} className="text-[#FFCB05]" />
            ) : (
              <VolumeX size={16} className="text-gray-400" />
            )}
            <span className="hidden sm:inline">{soundOn ? 'SOUND ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={finishIntro}
            className="flex items-center gap-2 px-4 py-2 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 text-white font-pixel text-[11px] sm:text-xs rounded-lg border-2 border-white/80 shadow-[0_4px_14px_rgba(238,21,21,0.5)] transition-all cursor-pointer"
          >
            <span>ENTER LEAGUE</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Center Cinematic Title / Logo Splash */}
      <div className="relative z-10 text-center my-auto pointer-events-none px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFCB05] font-pixel text-[10px] mb-3"
        >
          <Sparkles size={14} className="text-[#EE1515]" />
          <span>HACKATHON 3.0 CINEMATIC</span>
        </motion.div>
      </div>

      {/* Bottom Subtitle / Dialogue HUD & Progress bar */}
      <div className="w-full max-w-4xl mx-auto z-10 flex flex-col gap-3">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur">
          <div
            className="h-full bg-gradient-to-r from-[#EE1515] via-[#FFCB05] to-[#3B4CCA] transition-all duration-200"
            style={{ width: `${videoProgress}%` }}
          />
        </div>

        {/* Pokémon Styled Dialogue Card */}
        <div className="bg-black/75 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFCB05]" />
              <span className="font-pixel text-[11px] text-[#FFCB05] tracking-wider">
                {DIALOGUES[currentStep].speaker}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded">
              {DIALOGUES[currentStep].tag}
            </span>
          </div>

          <p className="font-pixel text-xs sm:text-sm text-white/95 leading-relaxed min-h-[44px]">
            {DIALOGUES[currentStep].text}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
            <span className="text-[11px] font-mono text-gray-400">
              Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-white font-bold">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-white font-bold">Esc</kbd> to skip into the arena
            </span>

            <button
              onClick={finishIntro}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFCB05] hover:bg-[#E5B500] text-[#1E232A] font-pixel text-[11px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] transition-all cursor-pointer font-bold"
            >
              <span>OPEN POKÉBALL</span>
              <FastForward size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
