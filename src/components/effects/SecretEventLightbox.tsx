'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Sparkles, ShieldAlert, Award } from 'lucide-react';

export function SecretEventLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 5 Minutes = 300 Seconds active tracking
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

        // 300 seconds = 5 minutes active
        if (activeSeconds >= 300) {
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
          {/* Subtle Ambient Cosmic Aura */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-[#1B1E4A]/30 to-black/90" />

          {/* Lightbox Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-xl bg-[#0E1129] border-2 border-[#E9E6DA]/40 text-[#E9E6DA] p-6 sm:p-9 shadow-[0_0_60px_rgba(234,179,8,0.35)] overflow-hidden rounded-xs"
          >
            {/* Golden Vintage Corner Highlights */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />

            {/* Glowing Accent Top Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-[#D21319] to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]" />

            {/* Close Button (✕) */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-[#D21319] border border-white/20 hover:border-white text-white flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:scale-95 z-20"
              title="Close cipher"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header / Protocol Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
              </span>
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400">
                CLASSIFIED TRANSMISSION · 5-MIN DEDICATION
              </span>
            </div>

            {/* Main Headline */}
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/15">
              <Award className="text-yellow-400 w-6 h-6 shrink-0" />
              <h2 className="font-serif text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]">
                THE LEGENDARY CIPHER
              </h2>
            </div>

            {/* User Requested Body Text */}
            <div className="space-y-4 font-sans text-sm sm:text-base leading-relaxed text-slate-200">
              <p className="drop-shadow-sm font-medium">
                An event so extraordinary, it had to be hidden from the world. Only those sharp enough to uncover every clue will earn their place among the first. The one who finds it all? A special reward awaits.
              </p>
              <p className="font-bold text-white text-base sm:text-lg border-l-2 border-yellow-400 pl-3.5 py-1 bg-yellow-400/10">
                Be part of something legendary. Some things are too great to be found by everyone. 👌
              </p>
            </div>

            {/* Audio Soundtrack Status & Equalizer Bar */}
            <div className="mt-7 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded border border-white/5">
              <div className="flex items-center gap-2.5">
                {/* Audio Equalizer Animated Bars */}
                <div className="flex items-end gap-1 h-4">
                  <span className={`w-1 bg-yellow-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-3 animate-pulse' : 'h-1.5'}`} />
                  <span className={`w-1 bg-yellow-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-4 animate-bounce' : 'h-2'}`} />
                  <span className={`w-1 bg-yellow-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-2.5 animate-pulse' : 'h-1'}`} />
                  <span className={`w-1 bg-yellow-400 rounded-full ${isPlayingAudio && !isMuted ? 'h-3.5 animate-bounce' : 'h-2'}`} />
                </div>
                <div className="text-[10px] font-mono leading-tight">
                  <div className="font-bold text-yellow-300 uppercase tracking-wider">
                    GREEN LANTERN OST · FREDERIK WIEDMANN
                  </div>
                  <div className="text-slate-400 text-[9px]">
                    {isMuted ? 'Soundtrack Muted' : isPlayingAudio ? 'Now Playing · Main Theme' : 'Tap audio to play soundtrack'}
                  </div>
                </div>
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 border border-yellow-400/40 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
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
                className="w-full sm:w-auto px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                UNLOCKED &amp; CONFIRMED 👌
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
