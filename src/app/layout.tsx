import type { Metadata } from 'next';
import { Bodoni_Moda, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jarivs-3-0-pokemon.vercel.app'),
  title: 'INDIGO TECH FEST · Jarvis 3.0',
  description: 'An editorial vintage natural-history tech fest of algorithmic craft. 16 - 17 October 2026.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bodoni.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[#1B1E4A] text-[#E9E6DA] font-sans antialiased selection:bg-[#D21319] selection:text-[#E9E6DA]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
