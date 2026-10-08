'use client';

import React, { useState, useEffect } from 'react';
import { VideoIntroScene } from '@/components/intro/VideoIntroScene';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { DynamicStage } from '@/components/landing/DynamicStage';
import { EventsLedger } from '@/components/sections/EventsLedger';
import { DaysTimeline } from '@/components/sections/DaysTimeline';
import { HowToJoin } from '@/components/sections/HowToJoin';
import { FaqAndCta } from '@/components/sections/FaqAndCta';
import { Footer } from '@/components/layout/Footer';
import { RegistrationModal } from '@/components/registration/RegistrationModal';

interface LandingClientProps {
  settings?: any;
}

export function LandingClient({ settings }: LandingClientProps) {
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Registration Modal State
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already seen the 1008.mp4 intro video in this session
    try {
      const hasSeen = sessionStorage.getItem('indigo_vid_intro_seen') === 'true';
      if (!hasSeen) {
        setShowVideoIntro(true);
      }
    } catch {
      // fallback
    }
    setIsReady(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
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

  if (!isReady) {
    return <div className="min-h-screen bg-[#161A35]" />;
  }

  // Scroll ratio for overlay animation (0 at top, 1 around 320px scroll)
  const scrollProgress = Math.min(1, Math.max(0, (scrollY - 20) / 300));

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
        className="fixed inset-0 z-[1] pointer-events-none transition-all duration-300"
        style={{
          opacity: scrollProgress,
          backgroundColor: `rgba(255, 255, 255, ${scrollProgress * 0.85})`,
          backdropFilter: scrollProgress > 0.05 ? `blur(${scrollProgress * 18}px)` : 'none',
          WebkitBackdropFilter: scrollProgress > 0.05 ? `blur(${scrollProgress * 18}px)` : 'none',
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
