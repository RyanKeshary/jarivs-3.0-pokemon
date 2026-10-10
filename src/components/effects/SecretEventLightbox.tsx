'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Sparkles, ShieldAlert, Award } from 'lucide-react';

export function SecretEventLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 4 Minutes = 240 Seconds active tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already displayed in this browser session
    const hasBeenShown = sessionStorage.getItem('indigo_secret_lightbox_displayed');
    if (hasBeenShown === 'true') {
      return;
    }

    let activeSeconds = parseInt(sessionStorage.getItem('indigo_active_seconds') || '0', 10);
    if (isNaN(activeSeconds)) activeSeconds = 0;

    let isUserActive = true;
    let idleTimer: NodeJS.Timeout | null = null;

    const resetIdleTimer = () => {
      isUserActive = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isUserActive = false;
      }, 60000); // 1 minute of no interaction marks user idle
    };

    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    window.addEventListener('touchstart', resetIdleTimer, { passive: true });
    window.addEventListener('scroll', resetIdleTimer, { passive: true });
    window.addEventListener('click', resetIdleTimer, { passive: true });

    // Developer / user custom trigger event for instant testing
    const handleManualTrigger = () => {
      setIsOpen(true);
    };
    window.addEventListener('trigger-secret-event-lightbox', handleManualTrigger);

    const interval = setInterval(() => {
      // Only count if page is visible in browser
      if (document.visibilityState === 'visible' && isUserActive) {
        activeSeconds += 1;
        sessionStorage.setItem('indigo_active_seconds', activeSeconds.toString());

        // 240 seconds = 4 minutes active
        if (activeSeconds >= 240) {
          sessionStorage.setItem('indigo_secret_lightbox_displayed', 'true');
          setIsOpen(true);
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('trigger-secret-event-lightbox', handleManualTrigger);
    };
  }, []);

  // Handle Audio playback when lightbox is shown
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const audio = new Audio('/media/green-lantern-ost.mp3');
      audio.loop = true;
      audio.volume = 1.0;
      audioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
          })
          .catch((err) => {
            console.warn('Audio autoplay blocked by browser policy; awaiting user interaction:', err);
            setIsPlayingAudio(false);
          });
      }
    } else {
      document.body.style.overflow = '';
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    }

    return () => {
      document.body.style.overflow = '';
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
          {/* Subtle Ambient Cosmic Water Aura */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-[#071E3D]/45 to-black/90" />

          {/* Lightbox Container - Light Blue Pokemon Theme */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-xl bg-gradient-to-b from-[#0B1E38] via-[#08172D] to-[#040D1A] border-2 border-sky-400/60 text-sky-100 p-6 sm:p-9 shadow-[0_0_70px_rgba(56,189,248,0.4)] overflow-hidden rounded-md"
          >
            {/* Pokemon Water-Tech Corner Brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-400" />

            {/* Glowing Accent Top Bar - Light Blue Cyber Gradient */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 shadow-[0_0_16px_rgba(56,189,248,0.85)]" />

            {/* Subtle Pokeball Watermark in Background */}
            <img
              src="/assets/pokeball-full.png"
              alt=""
              className="absolute -right-14 -bottom-14 w-56 h-56 opacity-10 pointer-events-none select-none blur-[0.5px] rotate-12"
            />

            {/* Close Button (✕) */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-9 h-9 bg-sky-950/70 hover:bg-sky-500 border border-sky-400/40 hover:border-white text-sky-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_#0284c7] active:scale-95 z-20"
              title="Close notification"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header / Transmission Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
              </span>
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-sky-300">
                CLASSIFIED TRANSMISSION · 4-MIN DEDICATION
              </span>
            </div>

            {/* Main Headline with Animated Pokemon Sprite */}
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-sky-400/25">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0 bg-sky-500/20 border border-sky-400/50 rounded-lg shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <img
                  src="/assets/events/squirtle.gif"
                  alt="Pokemon"
                  className="w-8 h-8 object-contain pixelated"
                />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(56,189,248,0.6)]">
                CONGRATULATIONS! YOU'VE UNCOVERED AN EASTER EGG
              </h2>
            </div>

            {/* User Requested Body Text */}
            <div className="space-y-4 font-sans text-sm sm:text-base leading-relaxed text-sky-100">
              <p className="drop-shadow-sm font-medium">
                There are in total 7 hidden easter eggs hidden throughout the website. and some intentional technical ones <span className="text-sky-300 font-semibold">(find them, dev's will hate u💔)</span>
              </p>
              <div className="font-bold text-white text-base sm:text-lg border-l-4 border-sky-400 pl-3.5 py-2.5 bg-sky-500/15 rounded-r shadow-inner">
                the one to find all will win something sepecial😝.
              </div>
            </div>

            {/* Audio Soundtrack Status & Equalizer Bar */}
            <div className="mt-7 pt-4 border-t border-sky-400/15 flex flex-wrap items-center justify-between gap-3 bg-[#061324]/80 p-3 rounded border border-sky-500/25">
              <div className="flex items-center gap-2.5">
                {/* Audio Equalizer Animated Bars */}
                <div className="flex items-end gap-1 h-4">
                  <span className={`w-1 bg-sky-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-3 animate-pulse' : 'h-1.5'}`} />
                  <span className={`w-1 bg-sky-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-4 animate-bounce' : 'h-2'}`} />
                  <span className={`w-1 bg-sky-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-2.5 animate-pulse' : 'h-1'}`} />
                  <span className={`w-1 bg-sky-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-3.5 animate-bounce' : 'h-2'}`} />
                </div>
                <div className="text-[10px] font-mono leading-tight">
                  <div className="font-bold text-sky-300 uppercase tracking-wider">
                    GREEN LANTERN OST · FREDERIK WIEDMANN
                  </div>
                  <div className="text-sky-200/70 text-[9px]">
                    {isMuted ? 'Soundtrack Muted' : isPlayingAudio ? 'Now Playing · Secret Transmission' : 'Tap audio to play soundtrack'}
                  </div>
                </div>
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-mono text-xs font-black uppercase tracking-wider border-2 border-sky-200 shadow-[3px_3px_0px_#0284c7] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                UNLOCKED &amp; CONFIRMED 😝
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
