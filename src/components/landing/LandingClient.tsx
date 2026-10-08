'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { DynamicStage } from '@/components/landing/DynamicStage';
import { EventsLedger } from '@/components/sections/EventsLedger';
import { DaysTimeline } from '@/components/sections/DaysTimeline';
import { HowToJoin } from '@/components/sections/HowToJoin';
import { FaqAndCta } from '@/components/sections/FaqAndCta';
import { Footer } from '@/components/layout/Footer';

// Lazy load heavy interactive components for instantaneous initial page load
const VideoIntroScene = dynamic(
  () => import('@/components/intro/VideoIntroScene').then((mod) => mod.VideoIntroScene),
  { ssr: false }
);

const RegistrationModal = dynamic(
  () => import('@/components/registration/RegistrationModal').then((mod) => mod.RegistrationModal),
  { ssr: false }
);

interface LandingClientProps {
  settings?: any;
}

export function LandingClient({ settings }: LandingClientProps) {
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Registration Modal State
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already seen the intro video in this session
    try {
      const hasSeen = sessionStorage.getItem('indigo_vid_intro_seen') === 'true';
      if (!hasSeen) {
        setShowVideoIntro(true);
      }
    } catch {
      // fallback
    }
    setIsReady(true);

    // Highly performant 60/120fps scroll listener using rAF without triggering React re-renders
    let ticking = false;
    const overlayEl = document.getElementById('scroll-blur-overlay');

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = window.scrollY;
          const progress = Math.min(1, Math.max(0, (sy - 20) / 300));
          if (overlayEl) {
            overlayEl.style.opacity = String(progress);
            overlayEl.style.backgroundColor = `rgba(255, 255, 255, ${progress * 0.85})`;
            overlayEl.style.backdropFilter = progress > 0.05 ? `blur(${progress * 18}px)` : 'none';
            (overlayEl.style as any).webkitBackdropFilter = progress > 0.05 ? `blur(${progress * 18}px)` : 'none';
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenRegistration = (eventId?: string) => {
    if (eventId) {
      setPreselectedEventId(eventId);
    } else {
      setPreselectedEventId(null);
    }
    setRegModalOpen(true);
  };

  const handleViewEvents = () => {
    const el = document.getElementById('events');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayIntro = () => {
    setShowVideoIntro(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#161A35] text-black relative">
      
      {/* 1. PERSISTENT FIXED BACKGROUND STAGE: THE LANDING PAGE ALWAYS STAYS IN THE BACKGROUND */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          <DynamicStage
            onEnterClick={handleViewEvents}
            onRegisterClick={() => handleOpenRegistration()}
            hideActionDock={true}
          />
        </div>
      </div>

      {/* 2. SCROLL-DRIVEN TRANSLUCENT WHITE OVERSHADOWING SCREEN WITH BLUR */}
      <div
        id="scroll-blur-overlay"
        className="fixed inset-0 z-[1] pointer-events-none transition-all duration-150"
        style={{
          opacity: 0,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      />

      {/* 1008.mp4 Fullscreen Video Intro with Skip & Ribbon Wipe */}
      {showVideoIntro && (
        <VideoIntroScene onComplete={() => setShowVideoIntro(false)} />
      )}

      {/* Floating Header (Zero Spacer, Ethereal Transparency) */}
      <Navbar
        onRegisterClick={() => handleOpenRegistration()}
        onReplayIntro={handleReplayIntro}
      />

      {/* FOREGROUND SCROLLABLE CONTENT */}
      <main className="flex-1 relative z-10">
        
        {/* Continuous Crimson Satin SVG Ribbon Drawing Down the Page */}
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-0 overflow-hidden opacity-25">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 4000"
            fill="none"
          >
            <path
              d="M500 0 C400 400 650 800 500 1200 C350 1600 600 2000 450 2400 C300 2800 650 3200 500 3600 C450 3800 520 3950 500 4000"
              stroke="#D21319"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
        </div>

        {/* 1. True 100vh Full-Screen Theatrical Stage Hero */}
        <HeroSection
          onRegisterClick={() => handleOpenRegistration()}
          onViewEventsClick={handleViewEvents}
        />

        {/* 2. The Seven Disciplines Program Ledger */}
        <EventsLedger
          onSelectEventForRegistration={(evId) => handleOpenRegistration(evId)}
        />

        {/* 3. Chronology / Two-Day Schedule Timeline */}
        <DaysTimeline />

        {/* 4. How To Join Protocol (3-Stage Sequence) */}
        <HowToJoin onRegisterClick={() => handleOpenRegistration()} />

        {/* 5. Inquiries & Convocation Finale Card */}
        <FaqAndCta onRegisterClick={() => handleOpenRegistration()} />

      </main>

      {/* Editorial Colophon / Footer */}
      <Footer />

      {/* Working Registration System Modal */}
      <RegistrationModal
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        preselectedEventId={preselectedEventId}
      />

    </div>
  );
}
