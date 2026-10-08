'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EngravedPhoenix } from '@/components/illustrations/EngravedPokemon';

export function AdminLoginCard({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('shrey.sleeps@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1E4A] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#121435] border border-[#AFAEA2] p-8 shadow-[4px_4px_0px_#0E1026] text-[#E9E6DA]">
        
        {/* Phoenix Crown Header */}
        <div className="flex justify-center mb-4">
          <EngravedPhoenix size={100} className="w-20" />
        </div>

        <div className="border-b border-[#AFAEA2]/40 pb-4 mb-6 text-center">
          <span className="label-editorial text-[9px] block">
            INDIGO PLATEAU CONVOCATION · CODEX MMXXVI
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#D21319] uppercase font-bold tracking-tight mt-1">
            ADMINISTRATIVE PORTAL
          </h1>
          <p className="font-grotesk text-xs text-[#AFAEA2] mt-1">
            Restricted to fest organizers and master adjudicators.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#D21319]/20 border border-[#D21319] text-xs font-grotesk">
            <span className="font-bold text-[#D21319]">[ ERROR ]: </span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-editorial text-[8px] block mb-1">ADMINISTRATOR EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2.5 text-xs text-[#E9E6DA] font-mono focus:border-[#D21319] focus:outline-none"
            />
          </div>

          <div>
            <label className="label-editorial text-[8px] block mb-1">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2.5 text-xs text-[#E9E6DA] font-mono focus:border-[#D21319] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase tracking-wider border border-[#D21319] shadow-[3px_3px_0px_#0E1026] hover:bg-[#A80D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0E1026] cursor-pointer"
            >
              {loading ? 'AUTHENTICATING...' : "ENTER MASTER CONSOLE [ -> ]"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#AFAEA2]/30 flex justify-between items-center text-[10px] font-mono text-[#AFAEA2]">
          <span>PROTECTED ROUTE</span>
          <a href="/" className="hover:text-[#E9E6DA]">[ BACK TO HOME ]</a>
        </div>

      </div>
    </div>
  );
}
