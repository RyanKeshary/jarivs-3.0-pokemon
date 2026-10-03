'use client';

import React, { useState, useEffect } from 'react';
import { IntroScene } from '@/components/intro/IntroScene';
import { PokeballTransition } from '@/components/transition/PokeballTransition';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
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

  if (!isReady) {
    return <div className="min-h-screen bg-[#F8F9FA]" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {showIntro && <IntroScene onComplete={handleIntroComplete} />}
      <PokeballTransition
        isOpening={isOpeningTransition}
        onAnimationComplete={handleTransitionComplete}
      />

      <Navbar />

      <main className="flex-1">
        <Hero
          name={settings.name}
          tagline={settings.tagline}
          countdownTarget={settings.countdown_target}
          registrationDeadline={settings.registration_deadline}
        />

        <About content={settings.landing_content} />

        <Timeline timeline={settings.landing_content.timeline} />

        <FinalCta
          brochureUrl={settings.brochure_url}
          pptTemplateUrl={settings.ppt_template_url}
        />
      </main>

      <Footer />
    </div>
  );
}
