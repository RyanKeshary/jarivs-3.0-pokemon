'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    // Stable initial server render to avoid hydration mismatch
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-4 my-6">
        {['DAYS', 'HOURS', 'MINS', 'SECS'].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center bg-[#1E232A] text-white p-3 sm:p-4 rounded-xl border-2 border-[#334155] shadow-[4px_4px_0px_#EE1515] min-w-[70px] sm:min-w-[90px]"
          >
            <span className="font-pixel text-xl sm:text-3xl text-[#FFCB05]">--</span>
            <span className="font-mono text-[9px] sm:text-[10px] text-gray-400 mt-1 uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: 'DAYS', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'HOURS', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'MINS', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'SECS', value: String(timeLeft.seconds).padStart(2, '0') },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 my-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center bg-[#1E232A] text-white p-3 sm:p-4 rounded-xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#EE1515] min-w-[70px] sm:min-w-[95px] transform hover:-translate-y-1 transition-transform"
        >
          <span className="font-pixel text-xl sm:text-3xl text-[#FFCB05] tracking-widest">
            {item.value}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-gray-300 font-bold mt-1 uppercase">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
