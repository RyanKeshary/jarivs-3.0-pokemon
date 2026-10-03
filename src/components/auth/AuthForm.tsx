'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ArrowRight, UserCheck, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { playRetroBeep, playVictoryChime } from '@/lib/sound';

const MASTER_EMAILS = [
  'ryankeshary@gmail.com',
  'shrey.sleeps@gmail.com',
];

function isMasterEmail(emailStr: string): boolean {
  return MASTER_EMAILS.includes(emailStr.trim().toLowerCase());
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState<'register' | 'login' | 'reset'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [domainWarning, setDomainWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  // Prefetch targets so login redirects are instantaneous
  useEffect(() => {
    try {
      router.prefetch('/admin');
      router.prefetch('/dashboard');
    } catch {}
  }, [router]);

  // Real-time domain validation check
  // Until and unless someone puts exactly what the master email is, show college email caution
  useEffect(() => {
    if (!email) {
      setDomainWarning(null);
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const isMaster = isMasterEmail(emailLower);

    // If exact master email, do not show college email caution
    if (isMaster) {
      setDomainWarning(null);
      return;
    }

    // Otherwise, show caution if email doesn't end with @slrtce.in
    if (emailLower.includes('@') && !emailLower.endsWith('@slrtce.in')) {
      setDomainWarning('Only @slrtce.in trainers may enter! Please use your institutional college email.');
    } else {
      setDomainWarning(null);
    }
  }, [email, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrimmed = email.trim().toLowerCase();
    const isMaster = isMasterEmail(emailTrimmed);

    // Enforce @slrtce.in unless exact master email
    if (!emailTrimmed.endsWith('@slrtce.in') && !isMaster) {
      setErrorMsg('Only @slrtce.in trainers may enter! Registration & Login is restricted to SLRTCE college IDs.');
      playRetroBeep(220, 'sawtooth', 0.15);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your trainer name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            // Attempt auto login with provided credentials
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: emailTrimmed,
              password,
            });
            if (!signInErr && signInData?.user) {
              playVictoryChime();
              setSuccessMsg('Trainer ID recognized! Logging into Pokémon Center...');
              setTimeout(() => {
                window.location.href = isMaster ? '/admin' : '/dashboard';
              }, 150);
              return;
            }
          }
          setErrorMsg(error.message);
          playRetroBeep(220, 'sawtooth', 0.15);
        } else {
          // Guarantee session exists in browser cookies
          if (!data?.session) {
            await supabase.auth.signInWithPassword({
              email: emailTrimmed,
              password,
            });
          }
          playVictoryChime();
          setSuccessMsg('Trainer ID registered successfully! Redirecting to Pokémon Center...');
          setTimeout(() => {
            window.location.href = isMaster ? '/admin' : '/dashboard';
          }, 150);
        }
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          playRetroBeep(220, 'sawtooth', 0.15);
        } else {
          playVictoryChime();

          let target = '/dashboard';
          let welcomeMsg = 'Welcome back, Trainer! Entering Pokémon Center...';

          if (isMaster) {
            target = '/admin';
            const staffName = emailTrimmed.includes('ryan')
              ? 'Ryan'
              : emailTrimmed.includes('shrey')
              ? 'Shrey'
              : 'Commander';
            welcomeMsg = `Command Staff recognized! Welcome, Master ${staffName}. Redirecting to Admin HQ...`;
          } else if (data?.user?.id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', data.user.id)
                .single();

              if (profile?.role === 'master' || profile?.role === 'admin' || profile?.role === 'manager') {
                target = '/admin';
                welcomeMsg = `Gym Leader recognized! Welcome, ${profile.full_name || 'Admin'}. Redirecting to Admin HQ...`;
              } else if (profile?.full_name) {
                welcomeMsg = `Welcome back, Trainer ${profile.full_name}! Entering Pokémon Center...`;
              }
            } catch {
              // fallback to default
            }
          }

          setSuccessMsg(welcomeMsg);

          setTimeout(() => {
            window.location.href = target;
          }, 100);
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
          redirectTo: `${window.location.origin}/auth?mode=update-password`,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Recovery poké-ball signal sent! Check your inbox for the reset link.');
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isMasterActive = isMasterEmail(email);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Retro Pokémon Card Frame */}
      <div className="bg-white border-4 border-[#1E232A] rounded-2xl shadow-[8px_8px_0px_#1E232A] overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-[#EE1515] p-5 text-white border-b-4 border-[#1E232A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1E232A] flex items-center justify-center shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full bg-[#EE1515] border-2 border-[#1E232A]" />
            </div>
            <div>
              <span className="font-pixel text-xs text-[#FFCB05] tracking-wider block">
                TRAINER GATEWAY
              </span>
              <span className="text-[11px] text-white/90 font-mono font-bold block">
                KENTO LEAGUE 3.0
              </span>
            </div>
          </div>

          {isMasterActive ? (
            <span className="px-2.5 py-1 bg-[#FFCB05] text-[#1E232A] font-pixel text-[9px] rounded border border-[#1E232A] shadow-sm flex items-center gap-1">
              <Shield size={10} />
              <span>COMMAND STAFF</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-white/20 text-white font-mono text-[10px] rounded">
              @slrtce.in
            </span>
          )}
        </div>

        {/* Tab Selection: Only REGISTER and LOGIN */}
        <div className="grid grid-cols-2 border-b-2 border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-3.5 font-pixel text-xs transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#EE1515] border-b-3 border-[#EE1515] font-bold shadow-sm'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            REGISTER
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-3.5 font-pixel text-xs transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#EE1515] border-b-3 border-[#EE1515] font-bold shadow-sm'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            LOGIN
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {/* Domain Warning Alert */}
          <AnimatePresence>
            {domainWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-amber-50 border-2 border-[#FFCB05] rounded-xl flex items-start gap-2.5 shadow-sm"
              >
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-900 font-medium">
                  <span className="font-bold block">COLLEGE EMAIL CAUTION</span>
                  {domainWarning}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border-2 border-[#EE1515] rounded-xl flex items-center gap-2 text-xs text-[#EE1515] font-bold">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name Field (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="font-pixel text-[10px] text-gray-700 block mb-1">
                TRAINER FULL NAME
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ash Ketchum"
                className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-[#1E232A] rounded-xl font-sans text-sm focus:outline-none focus:bg-white focus:border-[#EE1515] transition-all"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="font-pixel text-[10px] text-gray-700 block mb-1 flex items-center justify-between">
              <span>{isMasterActive ? 'STAFF / MASTER EMAIL' : 'COLLEGE EMAIL (@slrtce.in)'}</span>
              {!isMasterActive && (
                <span className="text-[9px] text-[#EE1515] font-mono font-bold">REQUIRED</span>
              )}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@slrtce.in"
              className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-[#1E232A] rounded-xl font-sans text-sm focus:outline-none focus:bg-white focus:border-[#EE1515] transition-all"
            />
          </div>

          {/* Password Field */}
          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-pixel text-[10px] text-gray-700">
                  SECRET PASSCODE
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[10px] font-mono text-gray-500 hover:text-[#EE1515] transition-colors"
                  >
                    Forgot passcode?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-[#1E232A] rounded-xl font-sans text-sm focus:outline-none focus:bg-white focus:border-[#EE1515] transition-all"
              />
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="font-pixel text-[10px] text-gray-700 block mb-1">
                CONFIRM PASSCODE
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-[#1E232A] rounded-xl font-sans text-sm focus:outline-none focus:bg-white focus:border-[#EE1515] transition-all"
              />
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 disabled:opacity-50 text-white font-pixel text-xs rounded-xl border-2 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] transition-all cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">CONNECTING TO POKÉ-CENTER...</span>
            ) : mode === 'register' ? (
              <>
                <span>REGISTER AS TRAINER</span>
                <ArrowRight size={14} />
              </>
            ) : mode === 'reset' ? (
              <span>SEND RECOVERY POKÉ-BALL</span>
            ) : isMasterActive ? (
              <>
                <Shield size={14} />
                <span>COMMAND STAFF LOGIN</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <span>TRAINER LOGIN</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs font-mono text-gray-500 hover:text-black py-1"
            >
              Back to Login
            </button>
          )}
        </form>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t-2 border-gray-200 text-center text-[11px] text-gray-500 font-mono">
          Having trouble? Contact SLRTCE Hackathon Desk at{' '}
          <span className="text-[#EE1515] font-bold">jarvis@slrtce.in</span>
        </div>
      </div>
    </div>
  );
}
