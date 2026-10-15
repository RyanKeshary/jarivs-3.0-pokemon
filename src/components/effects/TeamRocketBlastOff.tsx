'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// Audio manager for instant, zero-latency playback with Web Audio API waveform integration + HTML5 fallback
class TeamRocketAudioManager {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private isPreloading = false;
  private preloadedAudio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private hasPendingPlay = false;
  private pendingWaveformCallback: ((amplitude: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Immediately instantiate and pre-buffer HTMLAudio element
      try {
        this.preloadedAudio = new Audio('/assets/team-rocket-blastoff.mp3');
        this.preloadedAudio.preload = 'auto';
        this.preloadedAudio.load();
      } catch (err) {
        console.warn('HTMLAudio init note:', err);
      }

      // 2. Preload Web Audio buffer shortly after boot
      setTimeout(() => {
        this.preloadWebAudio();
      }, 50);

      // 3. Attach global interaction listeners to unlock AudioContext & HTMLAudio
      const unlockListener = () => {
        this.unlock();
      };
      const interactionEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click', 'scroll', 'wheel'];
      interactionEvents.forEach((evt) => {
        window.addEventListener(evt, unlockListener, { capture: true, passive: true });
      });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  public async preloadWebAudio() {
    if (this.audioBuffer || this.isPreloading || typeof window === 'undefined') return;
    this.isPreloading = true;

    try {
      const res = await fetch('/assets/team-rocket-blastoff.mp3');
      const arrayBuf = await res.arrayBuffer();
      const ctx = this.getContext();
      if (ctx) {
        this.audioBuffer = await ctx.decodeAudioData(arrayBuf);
      }
    } catch (err) {
      console.warn('Web Audio preloading note:', err);
    } finally {
      this.isPreloading = false;
    }
  }

  public preload() {
    this.preloadWebAudio();
  }

  public async unlock() {
    if (this.isUnlocked) {
      if (this.hasPendingPlay) {
        this.hasPendingPlay = false;
        const cb = this.pendingWaveformCallback;
        this.pendingWaveformCallback = null;
        this.play(cb || undefined);
      }
      return;
    }

    // 1. Resume Web Audio context
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch {}

    // 2. Prime HTMLAudio element so mobile Safari and Chrome allow programmatic unmuted playback
    if (this.preloadedAudio) {
      try {
        this.preloadedAudio.muted = true;
        const p = this.preloadedAudio.play();
        if (p) {
          p.then(() => {
            if (this.preloadedAudio) {
              this.preloadedAudio.pause();
              this.preloadedAudio.currentTime = 0;
              this.preloadedAudio.muted = false;
            }
          }).catch(() => {});
        }
      } catch {}
    }

    this.isUnlocked = true;

    // 3. If a scroll trigger was deferred by browser autoplay policy, fire it now!
    if (this.hasPendingPlay) {
      this.hasPendingPlay = false;
      const cb = this.pendingWaveformCallback;
      this.pendingWaveformCallback = null;
      this.play(cb || undefined);
    }
  }

  public play(onWaveform?: (amplitude: number) => void): number {
    const ctx = this.getContext();

    // 1. If Web Audio Context is active and running, and audioBuffer is decoded:
    if (ctx && ctx.state === 'running' && this.audioBuffer) {
      try {
        const now = ctx.currentTime;

        // Cleanly cross-fade any currently playing instance
        const prevSource = this.currentSource;
        const prevGain = this.currentGain;
        if (prevSource && prevGain) {
          try {
            prevGain.gain.cancelScheduledValues(now);
            prevGain.gain.setValueAtTime(prevGain.gain.value, now);
            prevGain.gain.linearRampToValueAtTime(0.001, now + 0.02);
            setTimeout(() => {
              try {
                prevSource.stop();
                prevSource.disconnect();
              } catch {}
            }, 25);
          } catch {}
        }

        const source = ctx.createBufferSource();
        source.buffer = this.audioBuffer;

        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.7;

        const duration = this.audioBuffer.duration;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.004);

        const fadeOutStart = Math.max(now + 0.05, now + duration - 0.08);
        gain.gain.setValueAtTime(1.0, fadeOutStart);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        source.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);

        this.currentSource = source;
        this.currentGain = gain;

        source.start(now);

        if (onWaveform) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          let animationId = 0;
          const startTime = Date.now();

          const checkWavelength = () => {
            if (Date.now() - startTime > duration * 1000) {
              onWaveform(0);
              return;
            }
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              const val = (dataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / bufferLength);
            onWaveform(Math.min(rms * 2.8, 1));
            animationId = requestAnimationFrame(checkWavelength);
          };

          animationId = requestAnimationFrame(checkWavelength);
          source.onended = () => {
            cancelAnimationFrame(animationId);
            onWaveform(0);
          };
        }

        return duration;
      } catch (err) {
        console.warn('Web Audio play failed, falling back to HTMLAudio:', err);
      }
    }

    // 2. Also try to resume AudioContext in case it is currently suspended
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 3. Fallback to direct HTMLAudioElement playback (universally supported across all browsers)
    try {
      let audio = this.preloadedAudio;
      if (!audio) {
        audio = new Audio('/assets/team-rocket-blastoff.mp3');
        this.preloadedAudio = audio;
      }
      audio.muted = false;
      audio.volume = 1.0;
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            this.isUnlocked = true;
            this.hasPendingPlay = false;
          })
          .catch((err) => {
            console.warn('Autoplay prevented on this device until user interaction:', err);
            this.hasPendingPlay = true;
            this.pendingWaveformCallback = onWaveform || null;
          });
      }

      if (onWaveform) {
        onWaveform(0.85);
        setTimeout(() => onWaveform(0.5), 350);
        setTimeout(() => onWaveform(0.2), 850);
        setTimeout(() => onWaveform(0), 1600);
      }

      return audio.duration || 2.28;
    } catch (err) {
      console.warn('Audio playback fallback note:', err);
      this.hasPendingPlay = true;
      this.pendingWaveformCallback = onWaveform || null;
      return 2.28;
    }
  }
}

const audioManager = new TeamRocketAudioManager();

export function TeamRocketBlastOff() {
  const [showQuote, setShowQuote] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [waveVibration, setWaveVibration] = useState(0);

  // Easter egg counter: random target between 40 and 67
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 40 + 1)) + 40);
  const [showMemeModal, setShowMemeModal] = useState(false);
  const lastTriggerTimeRef = useRef(0);
  const hasTriggeredFlightAudioRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    audioManager.preload();
  }, []);

  // Lock body scroll while meme modal is active; ONLY closeable via the cross button
  useEffect(() => {
    if (showMemeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMemeModal]);

  const { scrollYProgress } = useScroll();

  // Watch scroll progress to automatically play unmuted Team Rocket audio as they blast off into view!
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (progress) => {
      if (progress >= 0.08 && progress <= 0.85) {
        if (!hasTriggeredFlightAudioRef.current) {
          hasTriggeredFlightAudioRef.current = true;
          audioManager.play((amp) => {
            setWaveVibration(amp);
          });
          setShowQuote(true);
          setTimeout(() => setShowQuote(false), 3800);
        }
      } else if (progress < 0.04 || progress > 0.95) {
        // Reset when user scrolls back to the top or past the end
        hasTriggeredFlightAudioRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  // Physics-smoothed scroll progress for buttery 60/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 28,
    stiffness: 85,
    mass: 0.5,
  });

  // LINEAR TRAJECTORY INCLINED UPWARDS FROM LEFT TO RIGHT:
  // Starts completely off-screen lower-left (-40vw, 92vh) and linearly ascends towards upper-right (106vw, -10vh)
  const x = useTransform(smoothProgress, [0, 1], ['-40vw', '106vw']);
  const y = useTransform(smoothProgress, [0, 1], ['92vh', '-10vh']);

  // Completely hidden at the start (opacity = 0 while scroll <= 0.05), smoothly emerges as user scrolls down
  const opacity = useTransform(smoothProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0]);

  // Distant perspective shrinkage as they blast off into the stratosphere
  const scale = useTransform(smoothProgress, [0, 0.65, 1], [1.05, 0.78, 0.32]);

  // Dynamic aerial wobble along the ascent vector
  const rotate = useTransform(smoothProgress, [0, 0.5, 1], [-6, 3, 14]);

  // Star twinkle opacity near the culmination of the blast-off
  const twinkleOpacity = useTransform(smoothProgress, [0.84, 0.94, 1], [0, 1, 0.8]);
  const twinkleScale = useTransform(smoothProgress, [0.84, 0.94, 1], [0.3, 1.3, 1]);

  if (!mounted) return null;

  // Instantaneous zero-latency trigger handler on click/tap
  const handleTrigger = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    // Guard against duplicate synthetic events (e.g. pointerdown followed immediately by click)
    if (now - lastTriggerTimeRef.current < 100) return;
    lastTriggerTimeRef.current = now;

    // 1. Immediately unlock browser audio state
    audioManager.unlock();

    // 2. Play the requested audio INSTANTANEOUSLY
    audioManager.play((amp) => {
      setWaveVibration(amp);
    });

    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 3800);

    // 3. Track clicks for the 40-67 random easter egg
    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    if (nextClicks >= targetClicksRef.current) {
      // Trigger funny meme presentation!
      setShowMemeModal(true);
      // Reset counter and set new random target between 40 and 67
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 40 + 1)) + 40;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-[35] overflow-hidden select-none"
      >
        {/* Scroll-Driven Team Rocket Flying Capsule */}
        <motion.div
          style={{
            x,
            y,
            scale,
            rotate,
            opacity,
          }}
          className="absolute top-0 left-0 will-change-transform"
        >
          <div
            className="relative group pointer-events-auto cursor-pointer touch-manipulation select-none"
            onPointerDown={handleTrigger}
            onClick={handleTrigger}
            style={{
              transform: waveVibration > 0 ? `scale(${1 + waveVibration * 0.12}) rotate(${(waveVibration - 0.5) * 8}deg)` : undefined,
              transition: 'transform 0.05s ease-out',
            }}
          >
            {/* Comic Dialogue Balloon */}
            <AnimatePresence>
              {showQuote && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -16, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.85 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white text-black font-mono font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-xl shadow-2xl border-2 border-[#D21319] whitespace-nowrap z-30"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>TEAM ROCKET FIRSE FAIL HO GAYI!</span>
                  </span>
                  {/* Speech balloon tail */}
                  <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#D21319]" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Wavelength Pulsing Ring Effect */}
            {waveVibration > 0.05 && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none animate-ping opacity-40 border-2 border-[#D21319]"
                style={{
                  transform: `scale(${1 + waveVibration * 0.4})`,
                }}
              />
            )}

            {/* Jessie, James & Meowth Sprite */}
            <img
              src="/assets/team-rocket-blastoff.png"
              alt="Team Rocket Blasting Off"
              loading="lazy"
              decoding="async"
              className="w-36 sm:w-48 md:w-56 h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-200"
              draggable={false}
            />

            {/* Tap to blast off audio pill badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/85 hover:bg-[#D21319] text-white text-[9px] sm:text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/40 shadow-lg whitespace-nowrap transition-all flex items-center gap-1 group-hover:scale-105">
              <span className="text-amber-300">🔊</span>
              <span>TAP TO BLAST OFF!</span>
            </div>

            {/* Iconic Anime Twinkle Star (Apex of Flight) */}
            <motion.div
              style={{
                opacity: twinkleOpacity,
                scale: twinkleScale,
              }}
              className="absolute -top-4 -right-4 pointer-events-none"
            >
              <svg
                className="w-8 h-8 text-amber-300 animate-spin"
                style={{ animationDuration: '4s' }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================== */}
      {/* FUNNY EASTER EGG MEME MODAL (TRIGGERS AFTER RANDOM 10-67 CLICKS) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showMemeModal && (
          <div
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -25, opacity: 0 }}
              animate={{
                scale: [0, 1.25, 0.95, 1.05, 1],
                rotate: [-25, 14, -8, 4, 0],
                opacity: 1,
              }}
              exit={{ scale: 0.1, rotate: 20, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 14,
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-[#FAF9F5] border-4 border-black shadow-[10px_10px_0px_#D21319] p-5 text-center flex flex-col items-center"
            >
              {/* THE ONLY CLOSE TRIGGER: Cross Icon Button */}
              <button
                type="button"
                onClick={() => setShowMemeModal(false)}
                className="absolute top-2.5 right-2.5 w-7 h-7 bg-black text-white hover:bg-[#D21319] border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-mono font-bold text-xs transition-colors cursor-pointer"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>

              {/* Comic Alert Header */}
              <div className="inline-block bg-[#D21319] text-white px-2.5 py-0.5 border-2 border-black font-mono text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] mb-3 animate-bounce">
                ⚡ A WILD SECRET MEME APPEARED!
              </div>

              {/* The Funny Meme Image */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-1 border-3 border-black bg-white shadow-[4px_4px_0px_#000] overflow-hidden flex items-center justify-center">
                <img
                  src="/assets/secret-meme.png"
                  alt="Secret Meme"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Funny Caption */}
              <div className="mt-3.5 space-y-1">
                <div className="font-sans font-black text-sm uppercase tracking-tight text-black">
                  Pikachu after dealing with Team Rocket...
                </div>
                <div className="font-mono text-[11px] text-neutral-600 font-bold">
                  (You unlocked the secret blast-off easter egg! ⚡)
                </div>
              </div>

              <div className="mt-3 font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Press ✕ in top corner to exit
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
