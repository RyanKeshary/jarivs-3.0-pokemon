'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Play, ChevronRight } from 'lucide-react';
import { playRetroBeep, isSoundEnabled, toggleSound } from '@/lib/sound';

interface IntroSceneProps {
  onComplete: () => void;
}

const DIALOGUES = [
  {
    speaker: 'PROFESSOR OAK',
    text: 'Hello there, Trainer! Welcome to the world of Pokémon and Technology! People affectionately call me the Pokémon Professor.',
    avatar: '👨‍🔬',
  },
  {
    speaker: 'PROFESSOR OAK',
    text: 'Trainers from all corners of Kanto are gathering here at SLRTCE for the grand KENTO LEAGUE · JARVIS HACKATHON 3.0!',
    avatar: '⚡',
  },
  {
    speaker: 'PROFESSOR OAK',
    text: 'Form your team of 1 to 4 trainers, build cutting-edge hacks across AI, Web3 & IoT, and battle for the Champion Trophy & ₹50,000!',
    avatar: '🏆',
  },
  {
    speaker: 'PROFESSOR OAK',
    text: 'A world of dreams and coding adventures awaits. Are you ready to show your true strength? Let the hackathon begin!',
    avatar: '🔴',
  },
];

export function IntroScene({ onComplete }: IntroSceneProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState && videoRef.current) {
      videoRef.current.muted = false;
    } else if (videoRef.current) {
      videoRef.current.muted = true;
    }
  };

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const fullText = DIALOGUES[currentStep].text;
    setDisplayedText('');

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index % 3 === 0) {
        playRetroBeep(880, 'triangle', 0.03);
      }
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [currentStep]);

  const handleNext = () => {
    playRetroBeep(520, 'square', 0.05);
    if (currentStep < DIALOGUES.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('kento_intro_seen', 'true');
    document.cookie = 'kento_intro_seen=true; path=/; max-age=864000';
    playRetroBeep(660, 'square', 0.08);
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 bg-[#12161A] flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden">
      {/* Background Video or Canvas Battle Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video
          ref={videoRef}
          src="/media/intro-theme.mp4"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12161A] via-transparent to-[#12161A]/80" />
      </div>

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#1E232A]/80 border-2 border-[#334155] px-3 py-1.5 rounded-lg text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-pixel text-[10px] text-[#FFCB05] tracking-wider">KENTO LEAGUE PROLOGUE</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSoundToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E232A] hover:bg-[#2D3748] text-white rounded-lg border-2 border-[#475569] text-xs font-mono transition-all"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 size={16} className="text-[#FFCB05]" /> : <VolumeX size={16} className="text-gray-400" />}
            <span>{soundOn ? 'SOUND ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-2 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 text-white font-pixel text-xs rounded-lg border-2 border-white shadow-[0_4px_0_#990000] transition-all cursor-pointer"
          >
            <span>SKIP INTRO</span>
            <FastForward size={14} />
          </button>
        </div>
      </div>

      {/* Center Character / Visual Scene */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-white/10 border-4 border-[#FFCB05] p-3 flex items-center justify-center shadow-[0_0_35px_rgba(255,203,5,0.4)] backdrop-blur-md"
        >
          <div className="text-6xl sm:text-7xl animate-bounce">
            {DIALOGUES[currentStep].avatar}
          </div>
        </motion.div>
        <div className="mt-4 px-3 py-1 bg-black/60 rounded border border-gray-600 font-pixel text-[11px] text-[#FFCB05]">
          {DIALOGUES[currentStep].speaker}
        </div>
      </div>

      {/* Classic Pokémon Dialogue Box */}
      <div className="w-full max-w-4xl z-10">
        <div className="bg-[#FAF9F6] border-4 border-[#1E232A] rounded-2xl p-5 sm:p-7 shadow-[6px_6px_0px_#EE1515] relative">
          <div className="font-pixel text-xs sm:text-sm text-[#1E232A] leading-relaxed min-h-[70px] sm:min-h-[85px]">
            {displayedText}
            <span className="inline-block w-2 h-4 ml-1 bg-[#EE1515] animate-pulse" />
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-gray-200 pt-3">
            <div className="text-[11px] font-mono text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-black font-bold">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-black font-bold">Enter</kbd> to advance
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-xs rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0_#1E232A] transition-all cursor-pointer"
            >
              <span>{currentStep < DIALOGUES.length - 1 ? 'NEXT' : 'ENTER LEAGUE'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
