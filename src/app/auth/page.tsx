import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Trainer Registration & Login | Kento League 3.0',
  description: 'Enter the arena for Kento League · Jarvis Hackathon 3.0',
};

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 text-[#1E232A] font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] transition-all"
        >
          <ArrowLeft size={12} />
          <span>RETURN TO ARENA</span>
        </Link>
      </div>

      {/* Center Auth Card with Suspense */}
      <div className="flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md h-96 bg-white border-4 border-[#1E232A] rounded-2xl animate-pulse" />
          }
        >
          <AuthForm />
        </Suspense>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-xs text-gray-500 font-mono mt-8">
        Kento League · Jarvis Hackathon 3.0 · SLRTCE
      </div>
    </div>
  );
}
