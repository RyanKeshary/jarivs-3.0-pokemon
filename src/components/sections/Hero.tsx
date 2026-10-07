'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Terminal,
  Menu,
  X,
  ChevronDown,
  Layers,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { Countdown } from '@/components/ui/Countdown';
import { playRetroBeep, isSoundEnabled, toggleSound } from '@/lib/sound';
import { createClient } from '@/lib/supabase/client';

interface HeroProps {
  name: string;
  tagline: string;
  countdownTarget: string;
  registrationDeadline: string;
  onReplayIntro?: () => void;
}

export function Hero({
  name,
  tagline,
  countdownTarget,
  registrationDeadline,
  onReplayIntro,
}: HeroProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const titleParallaxX = useTransform(smoothMouseX, [-0.5, 0.5], [10, -10]);
  const titleParallaxY = useTransform(smoothMouseY, [-0.5, 0.5], [8, -8]);

  const badgeParallaxX = useTransform(smoothMouseX, [-0.5, 0.5], [-16, 16]);
  const badgeParallaxY = useTransform(smoothMouseY, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playRetroBeep(880, 'sine', 0.05);
  };

  const formattedRegDeadline = new Date(registrationDeadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-transparent text-white pt-4 pb-8"
    >
      {/* INTEGRATED ULTRA-SLEEK GLASS HUD NAVIGATION */}
      <header className="relative z-30 w-full pt-2 sm:pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-black/55 backdrop-blur-xl border-2 border-white/20 rounded-2xl px-4 sm:px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between transition-all hover:bg-black/65">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => playRetroBeep(440, 'square', 0.04)}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-full border-2 border-white/90 bg-[#EE1515] flex items-center justify-center shadow-[0_0_18px_rgba(238,21,21,0.9)] group-hover:rotate-12 transition-transform">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#11161B] -translate-y-1/2" />
              <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#11161B] z-10" />
            </div>
            <div>
              <span className="font-pixel text-xs sm:text-sm text-[#FFCB05] tracking-wider block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                KENTO LEAGUE
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] text-gray-300 font-bold block -mt-0.5 tracking-wider">
                JARVIS HACKATHON 3.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#events"
              className="text-xs font-bold text-gray-100 hover:text-[#FFCB05] uppercase tracking-wider transition-colors drop-shadow"
            >
              Arena Events
            </Link>
            <Link
              href="#timeline"
              className="text-xs font-bold text-gray-100 hover:text-[#FFCB05] uppercase tracking-wider transition-colors drop-shadow"
            >
              Route Map
            </Link>
            <Link
              href="#rules"
              className="text-xs font-bold text-gray-100 hover:text-[#FFCB05] uppercase tracking-wider transition-colors drop-shadow"
            >
              Rules & Guidelines
            </Link>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Replay Intro Button */}
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-[#FFCB05] rounded-xl border border-[#FFCB05]/50 text-xs font-pixel backdrop-blur-md transition-all cursor-pointer shadow-[0_0_12px_rgba(255,203,5,0.25)]"
                title="Watch Cinematic Intro"
              >
                <Play size={12} className="fill-[#FFCB05]" />
                <span>CINEMATIC</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer backdrop-blur"
              title={soundOn ? 'Mute sound' : 'Unmute sound'}
            >
              {soundOn ? <Volume2 size={16} className="text-[#FFCB05]" /> : <VolumeX size={16} />}
            </button>

            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-xs rounded-xl border-2 border-white/60 shadow-[0_0_15px_rgba(59,76,202,0.6)] active:scale-95 transition-all"
              >
                <Terminal size={14} />
                <span>DASHBOARD</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth?mode=login"
                  className="hidden sm:inline-block px-3 py-1.5 text-xs font-bold text-gray-100 hover:text-white hover:bg-white/15 rounded-xl transition-all"
                >
                  LOGIN
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-[11px] sm:text-xs rounded-xl border border-white/70 shadow-[0_0_20px_rgba(238,21,21,0.7)] active:scale-95 transition-all cursor-pointer"
                >
                  <span>REGISTER</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-white/20 bg-white/10 text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
          >
            <Link
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-gray-100 py-2 border-b border-white/10"
            >
              ARENA EVENTS (6 TRACKS)
            </Link>
            <Link
              href="#timeline"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-gray-100 py-2 border-b border-white/10"
            >
              ROUTE MAP (TIMELINE)
            </Link>
            <Link
              href="#rules"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-gray-100 py-2 border-b border-white/10"
            >
              RULES & GUIDELINES
            </Link>
            {onReplayIntro && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReplayIntro();
                }}
                className="w-full text-center py-2.5 font-pixel text-xs bg-white/10 text-[#FFCB05] rounded-xl border border-[#FFCB05]/40"
              >
                🎬 REPLAY CINEMATIC INTRO
              </button>
            )}
            {!user && (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/auth?mode=login"
                  className="w-full text-center py-2 text-xs font-bold text-white border border-white/20 rounded-xl"
                >
                  TRAINER LOGIN
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="w-full text-center py-2 font-pixel text-xs bg-[#EE1515] text-white rounded-xl border border-white/40"
                >
                  TRAINER REGISTER
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </header>

      {/* MAIN HERO INTERACTIVE PARALLAX CARD */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto py-12 sm:py-20 flex flex-col items-center">
        {/* Campus Region Badge */}
        <motion.div
          style={{ x: badgeParallaxX, y: badgeParallaxY }}
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-black/55 border-2 border-[#FFCB05]/70 shadow-[0_0_20px_rgba(255,203,5,0.35)] text-[10px] sm:text-xs font-bold text-[#FFCB05] mb-6 backdrop-blur-md hover:scale-105 transition-transform"
        >
          <Sparkles size={14} className="text-[#EE1515] animate-pulse" />
          <span>SLRTCE CAMPUS · 18 OCTOBER 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EE1515]" />
          <span className="text-cyan-300">ANNUAL CODING LEAGUE 3.0</span>
        </motion.div>

        {/* Main Title with Parallax & Glow */}
        <motion.div style={{ x: titleParallaxX, y: titleParallaxY }} className="w-full">
          <motion.h1
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-pixel text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#FFCB05] tracking-tight leading-snug sm:leading-snug max-w-5xl mx-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] break-words"
          >
            {name}
          </motion.h1>

          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto font-medium px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            {tagline}
          </motion.p>
        </motion.div>

        {/* Live Countdown in Glass Container */}
        <motion.div
          style={{ x: titleParallaxX, y: titleParallaxY }}
          className="mt-6 sm:mt-8 bg-black/55 backdrop-blur-xl border-2 border-white/25 rounded-2xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-xl w-full"
        >
          <p className="font-pixel text-[11px] sm:text-xs text-[#FFCB05] tracking-wider mb-2 drop-shadow">
            ⚡ BATTLE ARENA OPENS IN:
          </p>
          <Countdown targetDate={countdownTarget} />
        </motion.div>

        {/* Registration Deadline Warning */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 bg-red-950/75 border border-[#EE1515]/80 rounded-full text-[11px] sm:text-xs font-mono text-red-100 font-bold backdrop-blur-md shadow-md">
          <Calendar size={13} className="shrink-0 text-[#EE1515]" />
          <span suppressHydrationWarning>Registration Closes: {formattedRegDeadline} IST</span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-gray-200 font-normal">Squads of 1 to 4</span>
        </div>

        {/* Action CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-lg">
          <Link
            href="/auth?mode=register"
            onClick={() => playRetroBeep(880, 'square', 0.08)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-xs sm:text-sm rounded-xl border-2 border-white shadow-[0_0_25px_rgba(238,21,21,0.85)] cursor-pointer group pixel-btn transition-all"
          >
            <span>REGISTER SQUAD</span>
            <ArrowRight size={17} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>

          <Link
            href="/auth?mode=login"
            onClick={() => playRetroBeep(440, 'square', 0.05)}
            className="w-full sm:w-auto px-7 py-4 bg-white/20 hover:bg-white/30 text-white font-pixel text-xs rounded-xl border border-white/50 shadow-[0_4px_18px_rgba(0,0,0,0.5)] text-center backdrop-blur-md pixel-btn transition-all"
          >
            TRAINER LOGIN
          </Link>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="sm:hidden w-full py-3 bg-white/15 text-[#FFCB05] font-pixel text-xs rounded-xl border border-[#FFCB05]/40"
            >
              🎬 WATCH INTRO
            </button>
          )}
        </div>

        {/* Quick Highlights Strip with Clean Glassmorphism */}
        <div className="mt-10 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl w-full">
          <div className="bg-black/55 backdrop-blur-xl p-3.5 rounded-xl border-2 border-white/20 shadow-lg text-center hover:bg-black/70 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-[#FFCB05]">
              <Layers size={16} />
              <span className="font-pixel text-sm sm:text-base block">6 EVENTS</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-300 font-bold uppercase block">Battle Arenas</span>
          </div>

          <div className="bg-black/55 backdrop-blur-xl p-3.5 rounded-xl border-2 border-white/20 shadow-lg text-center hover:bg-black/70 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-[#EE1515]">
              <Clock size={16} />
              <span className="font-pixel text-sm sm:text-base block">24 HOURS</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-300 font-bold uppercase block">Non-Stop Hacking</span>
          </div>

          <div className="bg-black/55 backdrop-blur-xl p-3.5 rounded-xl border-2 border-white/20 shadow-lg text-center hover:bg-black/70 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-cyan-300">
              <Users size={16} />
              <span className="font-pixel text-sm sm:text-base block">1-4 TRAINERS</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-300 font-bold uppercase block">Team Squads</span>
          </div>

          <div className="bg-black/55 backdrop-blur-xl p-3.5 rounded-xl border-2 border-white/20 shadow-lg text-center hover:bg-black/70 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-300">
              <MapPin size={16} />
              <span className="font-pixel text-sm sm:text-base block">SLRTCE</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-300 font-bold uppercase block">College Arena</span>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="relative z-20 pb-2 flex flex-col items-center justify-center text-gray-300">
        <Link
          href="#events"
          className="flex flex-col items-center gap-1 hover:text-[#FFCB05] transition-colors font-mono text-[10px] uppercase tracking-widest drop-shadow"
        >
          <span>EXPLORE 6 ARENA EVENTS</span>
          <ChevronDown size={16} className="animate-bounce text-[#FFCB05]" />
        </Link>
      </div>
    </section>
  );
}
