'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, Heart, Shield, Mail, ExternalLink } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

export function Footer() {
  const handleReplayIntro = () => {
    localStorage.removeItem('kento_intro_seen');
    document.cookie = 'kento_intro_seen=; path=/; max-age=0';
    playRetroBeep(440, 'square', 0.05);
    window.location.reload();
  };

  return (
    <footer className="bg-[#1E232A] text-white border-t-4 border-[#1E232A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#EE1515] border-2 border-white flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-[#1E232A]" />
              </div>
              <span className="font-pixel text-sm text-[#FFCB05] tracking-wider">
                KENTO LEAGUE · JARVIS 3.0
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed font-sans">
              The flagship Pokémon-themed hackathon of Shree L. R. Tiwari College of Engineering (SLRTCE). 24 hours of innovation, teamwork, and championship glory.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#334155] hover:bg-[#475569] text-gray-200 font-pixel text-[10px] rounded-lg border border-gray-600 transition-all cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>REPLAY INTRO SCENE</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <span className="font-pixel text-xs text-[#FFCB05] block mb-4 uppercase">
              LEAGUE DIRECTORY
            </span>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  Arena Overview
                </Link>
              </li>
              <li>
                <Link href="/#prizes" className="hover:text-white transition-colors">
                  Prizes & Bounties
                </Link>
              </li>
              <li>
                <Link href="/#tracks" className="hover:text-white transition-colors">
                  Gym Battle Tracks
                </Link>
              </li>
              <li>
                <Link href="/#timeline" className="hover:text-white transition-colors">
                  Route Map
                </Link>
              </li>
              <li>
                <Link href="/#rules" className="hover:text-white transition-colors">
                  Rules & Eligibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Trainer Portal & Admin */}
          <div>
            <span className="font-pixel text-xs text-[#FFCB05] block mb-4 uppercase">
              TRAINER PORTAL
            </span>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/auth?mode=login" className="hover:text-white transition-colors">
                  Trainer Login
                </Link>
              </li>
              <li>
                <Link href="/auth?mode=register" className="hover:text-white transition-colors">
                  Trainer Registration
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Pokémon Center Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/auth?mode=master"
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 pt-2 border-t border-gray-700 font-mono"
                >
                  <Shield size={12} />
                  <span>Master Command Gate</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Credits */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
          <p>
            © 2026 Kento League Hackathon · Organised by SLRTCE Jarvis Team.
          </p>
          <p className="text-[11px] text-gray-500 max-w-xl text-center md:text-right">
            Disclaimer: Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc., and GAME FREAK inc. This event is a non-profit collegiate hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
