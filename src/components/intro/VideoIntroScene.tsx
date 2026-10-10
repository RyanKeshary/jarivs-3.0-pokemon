'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Play, Pause } from 'lucide-react';

interface VideoIntroSceneProps {
  onComplete: () => void;
}

export function VideoIntroScene({ onComplete }: VideoIntroSceneProps) {
  // Sound is ON by default
  const [soundOn, setSoundOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(13.9);
  const [showCenterFeedback, setShowCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  // Synchronously select ultra-low-packet mobile stream on handhelds (< 768px or mobile UA)
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const isMobilePhone =
        window.innerWidth < 640 ||
        /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobilePhone) {
        return '/media/intro-vid-mobile-lite.mp4'; // Ultra-low packet: only 551 KB, 324 kbps!
      }
      const isTablet = window.innerWidth < 1024 || /iPad/i.test(navigator.userAgent);
      if (isTablet) {
        return '/media/intro-vid-mobile.mp4'; // 945 KB, 544 kbps
      }
      return '/media/intro-vid.mp4';
    }
    return '/media/intro-vid-mobile-lite.mp4';
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef({ time: 0, wallClock: Date.now() });
  const lastUpdateRef = useRef(0);

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
    }, 400);
  }, [isExiting, onComplete, playTacticalChime]);

  // Video error handler with progressive alternate source retry ladder
  const handleVideoError = useCallback(() => {
    console.warn('Intro video error encountered for src:', videoSrc);
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      // Ladder: lite -> mobile standard -> desktop
      let nextSrc = '/media/intro-vid-mobile.mp4';
      if (videoSrc === '/media/intro-vid-mobile.mp4') {
        nextSrc = '/media/intro-vid.mp4';
      }
      setVideoSrc(nextSrc);
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) {
          vid.load();
          attemptPlay();
        }
      }, 100);
    } else {
      // If alternate source fails as well, proceed smoothly so user is never locked out
      handleFinishOrSkip();
    }
  }, [hasTriedFallback, videoSrc, handleFinishOrSkip]);

  // Playback automatically - try unmuted first, seamlessly fallback to muted autoplay if browser restricts
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.volume = 1.0;
    vid.playsInline = true;

    // Try unmuted autoplay first
    vid.muted = false;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setSoundOn(true);
          lastProgressRef.current = { time: vid.currentTime, wallClock: Date.now() };
        })
        .catch(() => {
          // If browser restricts unmuted autoplay, immediately start playing automatically without asking for permission!
          vid.muted = true;
          setSoundOn(false);
          vid.play()
            .then(() => {
              setIsPlaying(true);
              lastProgressRef.current = { time: vid.currentTime, wallClock: Date.now() };
            })
            .catch(() => {});
        });
    }
  }, []);

  // Initial video setup & autoplay kick-off
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.volume = 1.0;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.setAttribute('x5-playsinline', '');
    vid.setAttribute('x5-video-player-type', 'h5-page');

    // Audio is strictly ON
    vid.muted = false;
    attemptPlay();
  }, [videoSrc, attemptPlay]);

  // Universal listeners: ANY interaction on screen immediately un-mutes and ensures playback with FULL audio
  useEffect(() => {
    const handleGlobalInteraction = () => {
      const vid = videoRef.current;
      if (!vid || isExiting) return;

      if (vid.muted || !soundOn) {
        vid.muted = false;
        vid.volume = 1.0;
        setSoundOn(true);
      }

      if (vid.paused) {
        vid.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {});
      }
    };

    const events = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleGlobalInteraction, { passive: true, capture: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleGlobalInteraction, { capture: true } as any);
      });
    };
  }, [soundOn, isExiting]);

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

      if (vid.paused && !vid.ended && !isExiting) {
        // Nudge paused video to keep playing automatically
        vid.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            vid.muted = true;
            vid.play().catch(() => {});
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
  }, [isExiting, handleFinishOrSkip]);

  const unmuteAndPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = false;
    vid.volume = 1.0;
    setSoundOn(true);
    vid.play().then(() => setIsPlaying(true)).catch(() => {});
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

  // Throttled video time updates: saves up to 75% of main thread React re-render cycles
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const ct = vid.currentTime;
    const now = Date.now();

    // Throttle state update to at most once per 250ms or when duration changes
    if (now - lastUpdateRef.current >= 250 || ct >= (vid.duration || 13.9) - 0.2) {
      lastUpdateRef.current = now;
      setCurrentTime(ct);
      if (vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
    }

    if (ct > lastProgressRef.current.time + 0.05) {
      lastProgressRef.current = { time: ct, wallClock: now };
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
        scale: isExiting ? 1.05 : 1,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-[#070913] flex items-center justify-center overflow-hidden select-none pointer-events-auto touch-manipulation"
      style={{
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
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
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            handleTimeUpdate();
            attemptPlay();
          }}
          onCanPlay={attemptPlay}
          onPlaying={() => {
            setIsPlaying(true);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onEnded={handleFinishOrSkip}
          onError={handleVideoError}
          className="w-full h-full object-cover"
          style={{
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
        />

        {/* 2. Anamorphic Cinematic Letterbox Overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-36 sm:h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

        {/* 3. Subtle Futuristic HUD Reticle (Centered onto the Pokéball, static on mobile to avoid layer re-paints) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
          <svg className="w-[320px] xs:w-[380px] sm:w-[460px] h-[320px] xs:h-[380px] sm:h-[460px] sm:animate-[spin_60s_linear_infinite]" viewBox="0 0 400 400">
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

      </div>

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
            title={soundOn ? "Mute Audio (Hotkey: M)" : "Unmute Audio (Hotkey: M)"}
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
                  MUTE 🔇
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

