import type { Metadata } from 'next';
import { Inter, Pixelify_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pixelFont = Pixelify_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jarivs-3-0-pokemon.vercel.app'),
  title: 'Kento League · Jarvis Hackathon 3.0',
  description: 'Where Code Meets the Pokémon League — Hackathon 3.0 at SLRTCE',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/placeholders/pokeball-top-red.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${pixelFont.variable}`}>
      <body className="min-h-screen bg-[#07090E] text-[#1E232A] antialiased selection:bg-[#FFCB05] selection:text-[#1E232A]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
