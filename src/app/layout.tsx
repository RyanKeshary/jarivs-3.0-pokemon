import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

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

export const viewport: Viewport = {
  themeColor: '#161A35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://indigo-techfest.vercel.app'),
  title: 'INDIGO TECH FEST · Jarvis 3.0',
  description: 'An editorial vintage natural-history tech fest of algorithmic craft. 16 - 17 October 2026.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
