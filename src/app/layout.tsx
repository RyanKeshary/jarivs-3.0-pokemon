import type { Metadata } from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kento League · Jarvis Hackathon 3.0',
  description: 'Where Code Meets the Pokémon League — Hackathon 3.0 at SLRTCE',
  icons: {
    icon: '/assets/placeholders/pokeball-top-red.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`}>
      <body className="min-h-screen bg-[#F8F9FA] text-[#1E232A] antialiased selection:bg-[#FFCB05] selection:text-[#1E232A]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
