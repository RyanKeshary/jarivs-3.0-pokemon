'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-[#1E232A] rounded-2xl shadow-[8px_8px_0px_#1E232A] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#EE1515] p-5 text-white border-b-4 border-[#1E232A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1E232A] flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-[#EE1515] border-2 border-[#1E232A]" />
          </div>
          <div>
            <span className="font-pixel text-xs text-[#FFCB05] tracking-wider block">
              SYSTEM MALFUNCTION
            </span>
            <span className="text-[11px] text-white/90 font-mono font-bold block">
              POKÉMON CENTER RECOVERY
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-50 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-600">
            <AlertTriangle size={32} />
          </div>

          <h2 className="font-pixel text-sm text-[#1E232A]">
            AN UNEXPECTED GLITCH OCCURRED
          </h2>

          <p className="text-xs text-gray-600 font-mono">
            {error?.message || 'A wild system error appeared in the Indigo Plateau arena.'}
          </p>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFCB05] hover:bg-[#e6b800] active:scale-95 text-[#1E232A] font-pixel text-xs rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] transition-all cursor-pointer font-bold"
            >
              <RefreshCw size={14} />
              <span>RETRY ACTION</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 active:scale-95 text-[#1E232A] font-pixel text-xs rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] transition-all cursor-pointer"
            >
              <Home size={14} />
              <span>RETURN TO DASHBOARD</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
