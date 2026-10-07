'use client';

import React, { useState, useEffect } from 'react';
import { IntroScene } from '@/components/intro/IntroScene';
import { PokeballTransition } from '@/components/transition/PokeballTransition';
import { Hero } from '@/components/sections/Hero';
import { LeagueEvents } from '@/components/sections/LeagueEvents';
import { Timeline } from '@/components/sections/Timeline';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/layout/Footer';
import type { EventSettings } from '@/lib/database.types';

interface LandingClientProps {
  settings: EventSettings;
}

export function LandingClient({ settings }: LandingClientProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user has already seen the intro
    const hasSeenIntro =
      localStorage.getItem('kento_intro_seen') === 'true' ||
      document.cookie.includes('kento_intro_seen=true');

    if (!hasSeenIntro) {
      setShowIntro(true);
    }
    setIsReady(true);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIsOpeningTransition(true);
  };

  const handleTransitionComplete = () => {
    setIsOpeningTransition(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  if (!isReady) {
    return <div className="min-h-screen bg-[#07090E]" />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#07090E] overflow-x-hidden">
      {/* GLOBAL PERSISTENT LOOPING BACKGROUND VIDEO (Plays continuously while surfing) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          src="/banner.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter brightness-[0.88] contrast-[1.04]"
        />
        {/* Balanced backdrop shading to ensure all floating cards & texts are crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(7,9,14,0.6)_100%)]" />
      </div>

      {/* 1-Time Cinematic Introduction Video */}
      {showIntro && <IntroScene onComplete={handleIntroComplete} />}

      {/* Pokéball Opening Animation */}
      <PokeballTransition
        isOpening={isOpeningTransition}
        onAnimationComplete={handleTransitionComplete}
      />

      {/* Main Content Floating Over Global Video */}
      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <Hero
          name={settings.name}
          tagline={settings.tagline}
          countdownTarget={settings.countdown_target}
          registrationDeadline={settings.registration_deadline}
          onReplayIntro={handleReplayIntro}
        />

        {/* 6 Arena Events Section */}
        <LeagueEvents />

        {/* Route Map (Timeline) */}
        <Timeline timeline={settings.landing_content.timeline} />

        {/* Final Registration CTA */}
        <FinalCta
          brochureUrl={settings.brochure_url}
          pptTemplateUrl={settings.ppt_template_url}
        />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
