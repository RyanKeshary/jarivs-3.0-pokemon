'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavbarProps {
  onRegisterClick?: () => void;
  onReplayIntro?: () => void;
}

export function Navbar({ onRegisterClick, onReplayIntro }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'events' | 'schedule' | 'join'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const scrollPos = window.scrollY + 200;
      const sections = ['join', 'events', 'schedule', 'home'] as const;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { id: 'events', label: 'THE 6 DISCIPLINES' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'join', label: 'HOW TO JOIN' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 select-none ${
        scrolled
          ? 'bg-[#161A35]/95 backdrop-blur-md border-b border-[#AFAEA2]/25 shadow-lg py-2.5'
          : 'bg-gradient-to-b from-[#161A35]/90 via-[#161A35]/40 to-transparent border-b border-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left: Serif Brandmark */}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('home');
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <span className="w-2 h-2 bg-[#D21319] group-hover:scale-125 transition-transform" />
          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#D21319] group-hover:text-[#E9E6DA] transition-colors leading-none">
              INDIGO TECH FEST
            </span>
            <span className="label-editorial text-[8px] text-[#AFAEA2] tracking-[0.25em] mt-0.5">
              JARVIS 3.0 · CODEX MMXXVI
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Manifesto Removed) */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`relative font-grotesk text-xs uppercase tracking-[0.2em] transition-colors py-1 cursor-pointer ${
                  isActive
                    ? 'text-[#E9E6DA] font-semibold'
                    : 'text-[#AFAEA2] hover:text-[#E9E6DA]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D21319]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Triggers */}
        <div className="flex items-center gap-3">
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-[#E9E6DA] bg-[#161A35]/80 hover:bg-[#D21319] hover:text-white border-2 border-[#AFAEA2]/40 hover:border-[#D21319] shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="Play 1008.mp4 Intro Video"
            >
              <span>▷ INTRO FILM</span>
            </button>
          )}

          <button
            onClick={onRegisterClick}
            className="px-5 py-2 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>ENLIST SQUAD</span>
            <span>→</span>
          </button>

          <Link
            href="/admin"
            className="hidden lg:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#AFAEA2] hover:text-[#E9E6DA] border border-[#AFAEA2]/30 hover:border-[#AFAEA2] ml-1 transition-colors"
            title="Curator & Admin Panel"
          >
            [ ADMIN ]
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#AFAEA2] hover:text-[#E9E6DA] border border-[#AFAEA2]/30 ml-1"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#121435] border-b border-[#AFAEA2]/30 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="block w-full text-left font-serif text-sm tracking-wider text-[#E9E6DA] py-1 border-b border-[#AFAEA2]/15"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {onReplayIntro && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReplayIntro();
                }}
                className="text-left font-mono text-xs text-[#AFAEA2] py-1"
              >
                [ ▷ PLAY INTRO FILM ]
              </button>
            )}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left font-mono text-xs text-[#AFAEA2] py-1"
            >
              [ CURATOR ADMIN CONSOLE ]
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
