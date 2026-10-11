'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminLoginAction } from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { AnimatedPsyduck } from '@/components/illustrations/AnimatedPsyduck';
import { Eye, EyeOff, X } from 'lucide-react';

export function AdminLoginCard({ onLoginSuccess }: { onLoginSuccess: (data?: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPsyduckVideo, setShowPsyduckVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Play video with audio strictly ON by default (unmuted, full volume)
  const attemptPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.volume = 1.0;
    vid.muted = false;

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback policy retry:', err);
          // If browser initially halted unmuted, retry play immediately
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    }
  }, []);

  useEffect(() => {
    if (showPsyduckVideo) {
      document.body.style.overflow = 'hidden';
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
  }, [showPsyduckVideo, attemptPlay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPsyduckVideo) {
        if (videoRef.current) videoRef.current.pause();
        setShowPsyduckVideo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPsyduckVideo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Authenticate via Server Action to establish session cookies & fetch data
      const res = await adminLoginAction(cleanEmail, cleanPassword);
      if (res.success && res.data) {
        try {
          localStorage.removeItem('indigo_logged_out');
          localStorage.setItem('indigo_logged_in', 'true');
          window.dispatchEvent(new Event('auth_state_change'));
        } catch {}

        // Also sync client-side Supabase browser session in parallel
        try {
          const supabase = createClient();
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
        } catch {}

        onLoginSuccess(res.data);
        return;
      }

      // 2. If server action reported an auth failure, try client auth fallback
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        throw new Error(res.error || error.message || 'Authentication failed. Please verify credentials.');
      }

      try {
        localStorage.removeItem('indigo_logged_out');
        localStorage.setItem('indigo_logged_in', 'true');
        window.dispatchEvent(new Event('auth_state_change'));
      } catch {}

      // Retry fetching fest admin data with client session established
      const retryRes = await adminLoginAction(cleanEmail, cleanPassword);
      if (retryRes.success && retryRes.data) {
        onLoginSuccess(retryRes.data);
        return;
      }

      // 3. Fallback redirect/reload to enter console
      onLoginSuccess();
      window.location.href = '/admin';
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white border-2 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] text-black">
        
        {/* Animated Psyduck Easter Egg (40-67 taps to unlock secret full-screen transmission) */}
        <div className="flex items-center justify-center mb-3">
          <div
            className="cursor-pointer group hover:scale-105 transition-transform bg-transparent border-0 p-0 focus:outline-none"
            title="Psyduck · Tap repeatedly (40-67 times) to inspect secret transmission!"
          >
            <AnimatedPsyduck
              size={96}
              onEasterEggTrigger={() => {
                setShowPsyduckVideo(true);
              }}
            />
          </div>
        </div>

        <div className="border-b-2 border-black pb-4 mb-5 text-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 font-bold block">
            INDIGO TECH FEST · JARVIS 3.0
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Curator &amp; Admin Portal
          </h1>
          <p className="font-sans text-xs text-neutral-600 mt-1">
            Restricted to fest organizers, coordinators, and master adjudicators.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-[#D21319] text-xs font-mono text-[#991b1b]">
            <span className="font-bold text-[#D21319]">[ ERROR ]: </span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-black block mb-1">
              ADMINISTRATOR EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter administrator email"
              autoComplete="off"
              className="w-full bg-white border-2 border-black p-2.5 text-xs text-black font-mono focus:border-[#D21319] focus:outline-none shadow-[2px_2px_0px_#000]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-black block mb-1">
              MASTER PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                autoComplete="current-password"
                className="w-full bg-white border-2 border-black p-2.5 pr-10 text-xs text-black font-mono focus:border-[#D21319] focus:outline-none shadow-[2px_2px_0px_#000]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black p-1 cursor-pointer transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Explicit Show Password Checkbox Option */}
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 accent-[#D21319] rounded cursor-pointer"
              />
              <span className="font-mono text-xs text-neutral-700 hover:text-black font-semibold">
                Show password
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D21319] hover:bg-[#b00f14] text-white font-sans font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER MASTER CONSOLE [ ➔ ]'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <Link href="/" className="hover:text-black underline cursor-pointer">
            ← Return to Arena
          </Link>
          <span>Secured via SLRTCE Auth</span>
        </div>

      </div>

      {/* Secret Psyduck Lightbox Modal */}
      {showPsyduckVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-default select-none animate-in fade-in duration-200"
          onClick={() => {
            if (videoRef.current) videoRef.current.pause();
            setShowPsyduckVideo(false);
          }}
        >
          {/* Centered Lightbox Card */}
          <div
            className="relative w-full max-w-[380px] sm:max-w-[440px] bg-[#0E101D] border-2 border-amber-400 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(251,191,36,0.35)] overflow-hidden flex flex-col my-auto"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Top Bar Header */}
            <div className="relative z-30 px-3.5 py-2.5 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-b border-white/10 flex items-center justify-between text-white font-mono text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse" />
                <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  PSYDUCK TRANSMISSION
                </span>
                <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black border border-amber-300">
                  CLASSIFIED
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) videoRef.current.pause();
                    setShowPsyduckVideo(false);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 hover:bg-[#D21319] text-white border border-white/20 rounded-full flex items-center justify-center font-black transition-all cursor-pointer active:scale-95 shadow"
                  title="Close transmission (Esc)"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Video Container (1080x1350 aspect ratio) */}
            <div className="relative w-full aspect-[4/5] max-h-[68vh] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                poster="/media/untitled-design-poster.jpg"
                src="/media/untitled-design.mp4"
                controls
                autoPlay
                playsInline
                loop
                preload="auto"
                onCanPlay={attemptPlay}
                onLoadedMetadata={attemptPlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain bg-black"
              >
                <source src="/media/untitled-design.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Bottom Bar Notice */}
            <div className="px-3.5 py-2 bg-gradient-to-r from-[#17192A] via-[#0E101D] to-[#17192A] border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="text-amber-400 font-bold">JARVIS 3.0 · PSYDUCK ARCHIVES</span>
              <span className="text-white/70 uppercase tracking-wider">
                Click backdrop or ✕ to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
