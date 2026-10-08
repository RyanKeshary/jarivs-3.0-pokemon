'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { adminLoginAction } from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { EngravedPhoenix } from '@/components/illustrations/EngravedPokemon';

export function AdminLoginCard({ onLoginSuccess }: { onLoginSuccess: (data?: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Authenticate via Server Action to establish session cookies
      const res = await adminLoginAction(email, password);
      if (res.success && res.data) {
        onLoginSuccess(res.data);
        return;
      }

      // If server action reported an auth failure, try client auth fallback
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        throw new Error(res.error || error.message);
      }

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white border-2 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] text-black">
        
        {/* Phoenix Crown Header */}
        <div className="flex justify-center mb-4">
          <EngravedPhoenix size={90} className="w-20" />
        </div>

        <div className="border-b-2 border-black pb-4 mb-5 text-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 font-bold block">
            INDIGO TECH FEST · JARVIS 3.0
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Curator &amp; Admin Portal
          </h1>
          <p className="font-sans text-xs text-neutral-600 mt-1">
            Restricted to fest organizers, coordinators, and master adjudicators.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-[#D21319] text-xs font-mono text-[#991b1b]">
            <span className="font-bold text-[#D21319]">[ ERROR ]: </span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-black block mb-1">
              ADMINISTRATOR EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter administrator email"
              autoComplete="off"
              className="w-full bg-white border-2 border-black p-2.5 text-xs text-black font-mono focus:border-[#D21319] focus:outline-none shadow-[2px_2px_0px_#000]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-black block mb-1">
              MASTER PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              autoComplete="current-password"
              className="w-full bg-white border-2 border-black p-2.5 text-xs text-black font-mono focus:border-[#D21319] focus:outline-none shadow-[2px_2px_0px_#000]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D21319] hover:bg-[#b00f14] text-white font-sans font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER MASTER CONSOLE [ ➔ ]'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <Link href="/" className="hover:text-black underline cursor-pointer">
            ← Return to Arena
          </Link>
          <span>Secured via SLRTCE Auth</span>
        </div>

      </div>
    </div>
  );
}
