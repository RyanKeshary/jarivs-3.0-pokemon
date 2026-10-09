'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { DynamicStage } from '@/components/landing/DynamicStage';
import { EventsLedger } from '@/components/sections/EventsLedger';
import { AnnouncementsSection } from '@/components/sections/AnnouncementsSection';
import { DaysTimeline } from '@/components/sections/DaysTimeline';
import { HowToJoin } from '@/components/sections/HowToJoin';
import { FaqAndCta } from '@/components/sections/FaqAndCta';
import { Footer } from '@/components/layout/Footer';
import { TeamRocketBlastOff } from '@/components/effects/TeamRocketBlastOff';

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
  const [isPastHero, setIsPastHero] = useState(false);

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

    // Highly performant 60/120fps scroll listener using rAF without triggering unneeded re-renders
    let ticking = false;
    let lastPastHero = false;
    const overlayEl = document.getElementById('scroll-blur-overlay');

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = window.scrollY;
          const isMobile = window.innerWidth < 768;
          const heroThreshold = window.innerHeight * 0.95;
          const pastHeroNow = sy > heroThreshold;

          if (pastHeroNow !== lastPastHero) {
            lastPastHero = pastHeroNow;
            setIsPastHero(pastHeroNow);
          }

          const progress = Math.min(1, Math.max(0, (sy - 20) / 300));
          if (overlayEl) {
            overlayEl.style.opacity = String(progress);
            overlayEl.style.backgroundColor = `rgba(202, 224, 250, ${progress * 0.78})`;
            // On mobile devices, avoid expensive dynamic backdrop-filter blur which drops frame rate
            if (!isMobile && progress > 0.05) {
              overlayEl.style.backdropFilter = `blur(${Math.min(6, progress * 6)}px)`;
              (overlayEl.style as any).webkitBackdropFilter = `blur(${Math.min(6, progress * 6)}px)`;
            } else {
              overlayEl.style.backdropFilter = 'none';
              (overlayEl.style as any).webkitBackdropFilter = 'none';
            }
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
      
      {/* 1. PERSISTENT FIXED BACKGROUND STAGE: UNLOADS ONCE SCROLLED PAST HERO TO MINIMIZE CPU/GPU */}
      <div
        className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none [clip-path:inset(0)] [-webkit-clip-path:inset(0)] transition-opacity duration-300"
        style={{
          visibility: isPastHero ? 'hidden' : 'visible',
          opacity: isPastHero ? 0 : 1,
        }}
      >
        {!isPastHero && (
          <div className="w-full h-full pointer-events-auto">
            <DynamicStage
              onEnterClick={handleViewEvents}
              onRegisterClick={() => handleOpenRegistration()}
              hideActionDock={true}
            />
          </div>
        )}
      </div>

      {/* 2. SCROLL-DRIVEN TRANSLUCENT COOL BLUISH OVERSHADOWING SCREEN */}
      <div
        id="scroll-blur-overlay"
        className="fixed inset-0 z-[1] pointer-events-none transition-all duration-150"
        style={{
          opacity: 0,
          backgroundColor: 'rgba(202, 224, 250, 0)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      />

      {/* Fullscreen Video Intro with Skip & Responsive Streaming */}
      <AnimatePresence mode="wait">
        {showVideoIntro && (
          <VideoIntroScene onComplete={() => setShowVideoIntro(false)} />
        )}
      </AnimatePresence>

      {/* Floating Header (Zero Spacer, Ethereal Transparency) */}
      <Navbar
        onRegisterClick={() => handleOpenRegistration()}
        onReplayIntro={handleReplayIntro}
      />

      {/* Team Rocket Blasting Off Scroll-Driven Trajectory */}
      <TeamRocketBlastOff />

      {/* FOREGROUND SCROLLABLE CONTENT (100vh / 100vw Virtualized) */}
      <main className="flex-1 relative z-10">

        {/* 1. True 100vh Full-Screen Theatrical Stage Hero */}
        <HeroSection
          onRegisterClick={() => handleOpenRegistration()}
          onViewEventsClick={handleViewEvents}
        />

        {/* 2. The Seven Disciplines Program Ledger (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <EventsLedger
            onSelectEventForRegistration={(evId) => handleOpenRegistration(evId)}
          />
        </div>

        {/* 3. Central Bulletins & Announcements Section (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <AnnouncementsSection />
        </div>

        {/* 4. Chronology / Two-Day Schedule Timeline (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <DaysTimeline />
        </div>

        {/* 5. How To Join Protocol (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <HowToJoin onRegisterClick={() => handleOpenRegistration()} />
        </div>

        {/* 6. Inquiries & Convocation Finale Card (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <FaqAndCta onRegisterClick={() => handleOpenRegistration()} />
        </div>

        {/* Valid Production Footer (Virtualized Viewport) */}
        <div className="viewport-virtualized">
          <Footer />
        </div>

      </main>

      {/* Working Registration System Modal */}
      <RegistrationModal
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        preselectedEventId={preselectedEventId}
      />

    </div>
  );
}
