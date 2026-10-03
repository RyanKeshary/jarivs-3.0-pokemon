'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, VolumeX, Menu, X, Shield, User, Terminal } from 'lucide-react';
import { isSoundEnabled, toggleSound, playRetroBeep } from '@/lib/sound';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const [soundOn, setSoundOn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);

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

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playRetroBeep(880, 'sine', 0.05);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b-4 border-[#1E232A] shadow-md">
      {/* Top Pokédex red accent stripe */}
      <div className="h-1.5 w-full bg-[#EE1515]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Event Title */}
        <Link
          href="/"
          onClick={() => playRetroBeep(440, 'square', 0.04)}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-9 h-9 rounded-full border-2 border-[#1E232A] bg-[#EE1515] flex items-center justify-center shadow-[2px_2px_0px_#1E232A] group-hover:rotate-12 transition-transform">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1E232A] -translate-y-1/2" />
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#1E232A] z-10" />
          </div>
          <div>
            <span className="font-pixel text-xs sm:text-sm text-[#EE1515] tracking-wider block">
              KENTO LEAGUE
            </span>
            <span className="font-mono text-[10px] text-gray-500 font-bold block -mt-0.5">
              JARVIS HACKATHON 3.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#about"
            className="text-xs font-bold text-gray-700 hover:text-[#EE1515] uppercase tracking-wider transition-colors"
          >
            About
          </Link>
          <Link
            href="/#prizes"
            className="text-xs font-bold text-gray-700 hover:text-[#EE1515] uppercase tracking-wider transition-colors"
          >
            Prizes
          </Link>
          <Link
            href="/#tracks"
            className="text-xs font-bold text-gray-700 hover:text-[#EE1515] uppercase tracking-wider transition-colors"
          >
            Tracks
          </Link>
          <Link
            href="/#timeline"
            className="text-xs font-bold text-gray-700 hover:text-[#EE1515] uppercase tracking-wider transition-colors"
          >
            Route Map
          </Link>
          <Link
            href="/#rules"
            className="text-xs font-bold text-gray-700 hover:text-[#EE1515] uppercase tracking-wider transition-colors"
          >
            Rules
          </Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSoundToggle}
            className="p-2 rounded-lg border-2 border-[#1E232A] bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
            title={soundOn ? 'Mute 8-bit sound' : 'Unmute 8-bit sound'}
          >
            {soundOn ? <Volume2 size={16} className="text-[#EE1515]" /> : <VolumeX size={16} />}
          </button>

          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-xs rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Terminal size={14} />
              <span>DASHBOARD</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth?mode=login"
                className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-bold text-[#1E232A] hover:bg-gray-100 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all"
              >
                LOGIN
              </Link>
              <Link
                href="/auth?mode=register"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-xs rounded-lg border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <span>REGISTER</span>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border-2 border-[#1E232A] bg-gray-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-4 border-[#1E232A] p-4 flex flex-col gap-3">
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold text-gray-700 py-2 border-b border-gray-100"
          >
            ABOUT
          </Link>
          <Link
            href="/#prizes"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold text-gray-700 py-2 border-b border-gray-100"
          >
            PRIZES
          </Link>
          <Link
            href="/#tracks"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold text-gray-700 py-2 border-b border-gray-100"
          >
            TRACKS
          </Link>
          <Link
            href="/#timeline"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold text-gray-700 py-2 border-b border-gray-100"
          >
            ROUTE MAP (TIMELINE)
          </Link>
          <Link
            href="/#rules"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold text-gray-700 py-2"
          >
            RULES & ELIGIBILITY
          </Link>
          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth?mode=login"
                className="w-full text-center py-2 text-xs font-bold text-[#1E232A] border-2 border-[#1E232A] rounded-lg"
              >
                TRAINER LOGIN
              </Link>
              <Link
                href="/auth?mode=register"
                className="w-full text-center py-2 font-pixel text-xs bg-[#EE1515] text-white rounded-lg border-2 border-[#1E232A]"
              >
                TRAINER REGISTER
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
