'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Play, Pause, Sparkles } from 'lucide-react';

interface VideoIntroSceneProps {
  onComplete: () => void;
}

export function VideoIntroScene({ onComplete }: VideoIntroSceneProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(13.9);
  const [showCenterFeedback, setShowCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const [isWaitingForUserTap, setIsWaitingForUserTap] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  // Synchronously select mobile stream on handhelds (< 768px or mobile UA) to prevent src-switch aborts
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const isMobile =
        window.innerWidth < 768 ||
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile ? '/media/intro-vid-mobile.mp4' : '/media/intro-vid.mp4';
    }
    return '/media/intro-vid-mobile.mp4';
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef({ time: 0, wallClock: Date.now() });

  // Trigger brief audio cue using Web Audio API for tactical UI feedback
  const playTacticalChime = useCallback((freq = 587.33, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
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

  // Video error handler with automatic alternate source retry
  const handleVideoError = useCallback(() => {
    console.warn('Intro video error encountered for src:', videoSrc);
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      const fallbackSrc =
        videoSrc === '/media/intro-vid-mobile.mp4' ? '/media/intro-vid.mp4' : '/media/intro-vid-mobile.mp4';
      setVideoSrc(fallbackSrc);
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) {
          vid.load();
          vid.play().catch(() => {
            setIsWaitingForUserTap(true);
          });
        }
      }, 100);
    } else {
      // If alternate source fails as well, proceed smoothly so user is never locked out
      handleFinishOrSkip();
    }
  }, [hasTriedFallback, videoSrc, handleFinishOrSkip]);

  // Attempt playback with mobile-safe defaults
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Enforce DOM properties directly for WebKit/iOS compatibility
    vid.muted = !soundOn;
    vid.playsInline = true;

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsWaitingForUserTap(false);
          lastProgressRef.current = { time: vid.currentTime, wallClock: Date.now() };
        })
        .catch((err) => {
          // Autoplay policy blocked (iOS low-power mode, battery saver, strict webviews)
          console.log('Mobile autoplay waiting for user gesture:', err);
          setIsPlaying(false);
          setIsWaitingForUserTap(true);
        });
    }
  }, [soundOn]);

  // Initial video setup & autoplay kick-off
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Force strict inline & muted attributes for iOS Safari / Android Chrome
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.setAttribute('x5-playsinline', '');
    vid.setAttribute('x5-video-player-type', 'h5-page');

    attemptPlay();
  }, [videoSrc, attemptPlay]);

  // Universal Touch & Click listeners: ANY tap on screen immediately starts playback or un-mutes
  useEffect(() => {
    const handleGlobalInteraction = () => {
      const vid = videoRef.current;
      if (!vid || isExiting) return;

      // If video is paused or stuck, immediate touch gesture guarantees play authorization
      if (vid.paused) {
        vid.muted = !soundOn;
        vid.play()
          .then(() => {
            setIsPlaying(true);
            setIsWaitingForUserTap(false);
          })
          .catch(() => {});
        return;
      }

      // If video is already playing but muted, first tap unlocks audio
      if (!soundOn) {
        vid.muted = false;
        vid.volume = 1.0;
        setSoundOn(true);
        playTacticalChime(659.25, 'triangle');
      }
    };

    const events = ['touchstart', 'touchend', 'pointerdown', 'click'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleGlobalInteraction, { passive: true, capture: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleGlobalInteraction, { capture: true } as any);
      });
    };
  }, [soundOn, isExiting, playTacticalChime]);

  // Tab switch / Screen unlock recovery
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && videoRef.current && !videoRef.current.ended && !isExiting) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isExiting]);

  // Resilient Stall Watchdog: nudges buffering video or auto-continues if permanently stalled
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      if (isExiting) return;
      const vid = videoRef.current;
      if (!vid) return;

      if (vid.paused && !vid.ended && !isWaitingForUserTap) {
        // Nudge paused video
        vid.play()
          .then(() => {
            setIsPlaying(true);
            setIsWaitingForUserTap(false);
          })
          .catch(() => {
            setIsWaitingForUserTap(true);
          });
      } else if (!vid.paused && !vid.ended) {
        const stalledDuration = Date.now() - lastProgressRef.current.wallClock;
        if (stalledDuration > 2500) {
          // Video is playing but time hasn't advanced: nudge playback
          vid.play().catch(() => {});
        }
        if (stalledDuration > 7000) {
          // If network completely stalls on mobile for > 7s, advance gracefully so user is never stuck
          handleFinishOrSkip();
        }
      }
    }, 1000);

    return () => clearInterval(watchdogInterval);
  }, [isExiting, isWaitingForUserTap, handleFinishOrSkip]);

  const unmuteAndPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = false;
    vid.volume = 1.0;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setSoundOn(true);
          setIsPlaying(true);
          setIsWaitingForUserTap(false);
        })
        .catch((err) => {
          console.warn('Audio unmute retry fell back to muted:', err);
          // If browser rejects unmuting, preserve video playback in muted mode
          vid.muted = true;
          vid.play().catch(() => {});
          setSoundOn(false);
        });
    }
    playTacticalChime(659.25, 'triangle');
  }, [playTacticalChime]);

  const handleToggleSound = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (!soundOn) {
      unmuteAndPlay();
    } else {
      vid.muted = true;
      setSoundOn(false);
      playTacticalChime(329.63, 'sine');
    }
  }, [soundOn, unmuteAndPlay, playTacticalChime]);

  const handleTogglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play()
        .then(() => {
          setIsPlaying(true);
          setIsWaitingForUserTap(false);
        })
        .catch(() => {});
      setShowCenterFeedback('play');
    } else {
      vid.pause();
      setIsPlaying(false);
      setShowCenterFeedback('pause');
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setShowCenterFeedback(null), 800);
  }, []);

  // Screen click handler
  const handleScreenClick = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play()
        .then(() => {
          setIsPlaying(true);
          setIsWaitingForUserTap(false);
        })
        .catch(() => {});
      return;
    }

    if (!soundOn) {
      unmuteAndPlay();
      return;
    }

    handleTogglePlay();
  };

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
    const vid = videoRef.current;
    if (vid) {
      const ct = vid.currentTime;
      setCurrentTime(ct);
      if (vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
      if (ct > lastProgressRef.current.time + 0.05) {
        lastProgressRef.current = { time: ct, wallClock: Date.now() };
        if (isWaitingForUserTap) {
          setIsWaitingForUserTap(false);
        }
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
      className="fixed inset-0 z-50 bg-[#070913] flex items-center justify-center overflow-hidden select-none pointer-events-auto touch-manipulation"
    >
      
      {/* 1. Cinematic Background Video Canvas */}
      <div className="relative w-full h-full cursor-pointer" onClick={handleScreenClick}>
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          muted={!soundOn}
          // @ts-ignore
          defaultMuted={true}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            handleTimeUpdate();
            attemptPlay();
          }}
          onCanPlay={attemptPlay}
          onPlaying={() => {
            setIsPlaying(true);
            setIsWaitingForUserTap(false);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onEnded={handleFinishOrSkip}
          onError={handleVideoError}
          className="w-full h-full object-cover"
        />

        {/* 2. Anamorphic Cinematic Letterbox Overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-36 sm:h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

        {/* 3. Subtle Futuristic HUD Reticle (Centered onto the Pokéball) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
          <svg className="w-[320px] xs:w-[380px] sm:w-[460px] h-[320px] xs:h-[380px] sm:h-[460px] animate-[spin_60s_linear_infinite]" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="185" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="3 8" fill="none" opacity="0.3" />
            <circle cx="200" cy="200" r="170" stroke="#D21319" strokeWidth="1.2" strokeDasharray="16 120" fill="none" opacity="0.7" />
            <circle cx="200" cy="200" r="145" stroke="#E9E6DA" strokeWidth="0.6" strokeDasharray="6 6" fill="none" opacity="0.35" />
            <circle cx="200" cy="200" r="115" stroke="#D21319" strokeWidth="1" strokeDasharray="8 60" fill="none" opacity="0.6" />
          </svg>
          
          <div className="absolute w-10 sm:w-12 h-10 sm:h-12 border-t border-l border-white/50 -translate-x-10 sm:-translate-x-14 -translate-y-10 sm:-translate-y-14" />
          <div className="absolute w-10 sm:w-12 h-10 sm:h-12 border-t border-r border-white/50 translate-x-10 sm:translate-x-14 -translate-y-10 sm:-translate-y-14" />
          <div className="absolute w-10 sm:w-12 h-10 sm:h-12 border-b border-l border-white/50 -translate-x-10 sm:-translate-x-14 translate-y-10 sm:translate-y-14" />
          <div className="absolute w-10 sm:w-12 h-10 sm:h-12 border-b border-r border-white/50 translate-x-10 sm:translate-x-14 translate-y-10 sm:translate-y-14" />
        </div>

        {/* 4. Optical Corner Brackets (High-End Technical Framing) */}
        <div className="absolute top-4 left-4 sm:top-7 sm:left-7 pointer-events-none text-[9px] font-mono tracking-widest text-[#AFAEA2]/60 hidden sm:block">
          <span>┌ JARVIS 3.0 // SLRTCE</span>
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
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
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

        {/* 6. Universal Mobile Tap-to-Play Overlay (Appears if browser autoplay is blocked or paused) */}
        <AnimatePresence>
          {isWaitingForUserTap && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => {
                e.stopPropagation();
                attemptPlay();
              }}
              className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3.5 px-6 py-6 sm:px-8 sm:py-7 bg-black/90 border-2 border-[#D21319] shadow-[0_0_50px_rgba(210,19,25,0.85)] max-w-[340px] text-center select-none active:scale-95 transition-transform">
                <div className="w-16 h-16 rounded-full bg-[#D21319] flex items-center justify-center shadow-[0_0_25px_#D21319] animate-pulse">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-sm sm:text-base font-black uppercase tracking-wider text-white">
                    TAP TO PLAY INTRO
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs text-[#AFAEA2]">
                    Tap anywhere on your screen to start festival video transmission
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#FFCB05] animate-spin" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFCB05] font-bold">
                    SYSTEM READY · TAP SCREEN
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Tap-to-Unmute Prompt on Mobile/Muted */}
      <AnimatePresence>
        {!soundOn && !isWaitingForUserTap && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              e.stopPropagation();
              unmuteAndPlay();
            }}
            className="absolute bottom-16 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2.5 bg-black/90 hover:bg-black border-2 border-[#D21319] text-white shadow-[0_0_30px_rgba(210,19,25,0.8)] backdrop-blur-xl rounded-full cursor-pointer group active:scale-95 transition-all select-none touch-manipulation"
          >
            <Volume2 className="w-4 h-4 text-[#D21319] animate-bounce shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap">
                TAP ANYWHERE FOR SOUND 🔊
              </span>
              <span className="font-mono text-[8.5px] sm:text-[9px] text-[#AFAEA2] whitespace-nowrap">
                Tap anywhere to start festival audio
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#D21319] animate-ping ml-1 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. TOP CONTROL DOCK (Glassmorphic, Editorial, High-Tech) */}
      <header className="absolute top-0 left-0 right-0 p-2.5 sm:p-6 sm:px-8 flex items-center justify-between z-30 pointer-events-auto">
        
        {/* Left: Festival Transmission Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 p-1.5 sm:px-4 sm:py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-all">
          <div className="flex items-center gap-1 sm:gap-1.5 pr-1.5 sm:pr-2.5 border-r border-white/20">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#D21319] shadow-[0_0_8px_#D21319] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-red-500 uppercase">
              REC
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-[11px] sm:text-sm font-black uppercase tracking-wider text-white">
                INDIGO FEST
              </span>
              <span className="hidden sm:inline font-mono text-[9px] text-[#AFAEA2] tracking-widest uppercase">
                · JARVIS 3.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[9px] font-mono text-[#AFAEA2]">
              <span className="text-[#D21319] font-bold">FEED</span>
              <span>·</span>
              <span className="tabular-nums tracking-widest">{formatTimecode(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Right: Master Control Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Sound Toggle (Interactive Animated Equalizer) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl border transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] touch-manipulation active:scale-95 ${
              soundOn
                ? 'bg-black/75 hover:bg-black/90 border-[#D21319]/80 text-white shadow-[0_0_15px_rgba(210,19,25,0.3)]'
                : 'bg-black/70 hover:bg-black/90 border-amber-500/60 text-[#FFCB05] shadow-[0_0_12px_rgba(255,203,5,0.3)]'
            }`}
            title="Toggle Audio (Hotkey: M)"
          >
            {soundOn ? (
              <>
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D21319]" />
                <div className="flex items-end gap-0.5 h-3.5 w-3.5 sm:w-4">
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '70%' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.4s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '-0.2s' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.7s_ease-in-out_infinite]" style={{ height: '50%', animationDelay: '-0.4s' }} />
                  <span className="w-0.5 bg-[#D21319] animate-[bounce_0.5s_ease-in-out_infinite]" style={{ height: '85%', animationDelay: '-0.1s' }} />
                </div>
                <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hidden xs:inline">
                  SOUND ON
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFCB05]" />
                <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#FFCB05]">
                  UNMUTE 🔊
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
            className="group relative flex items-center gap-1.5 sm:gap-3 px-3 py-2 sm:pl-3.5 sm:pr-4 sm:py-2.5 bg-gradient-to-r from-[#D21319] via-[#b91c1c] to-[#991b1b] hover:from-[#e11d48] hover:to-[#D21319] text-white font-sans font-bold text-[10px] sm:text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] hover:shadow-[5px_5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer touch-manipulation min-h-[36px]"
            title="Skip Prologue (Hotkey: ESC or SPACE)"
          >
            <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r={circleRadius}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2.5"
                  fill="none"
                />
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

            <div className="flex items-center gap-1">
              <span className="font-black tracking-widest text-[10px] sm:text-xs">
                SKIP
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

