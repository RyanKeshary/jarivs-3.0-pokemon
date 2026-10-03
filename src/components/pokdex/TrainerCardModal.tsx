import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSelectSound, playSuccessSound } from '../../lib/sound';

interface TrainerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: {
    trainerId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
  };
  team: {
    name: string;
    teamId: string;
  } | null;
}

const BADGES = [
  { name: 'Boulder', color: '#94a3b8' },
  { name: 'Cascade', color: '#38bdf8' },
  { name: 'Thunder', color: '#facc15' },
  { name: 'Rainbow', color: '#4ade80' },
  { name: 'Soul', color: '#c084fc' },
  { name: 'Marsh', color: '#fb923c' },
  { name: 'Volcano', color: '#f87171' },
  { name: 'Earth', color: '#a3e635' },
];

export function TrainerCardModal({ isOpen, onClose, trainer, team }: TrainerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    playSelectSound();
    setDownloading(true);

    try {
      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const width = 800;
      const height = 500;
      canvas.width = width;
      canvas.height = height;

      // Card Background with Pokémon styling
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#F8FAFC');
      gradient.addColorStop(1, '#EDF2F7');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Top Red Banner
      ctx.fillStyle = '#EE1515';
      ctx.fillRect(0, 0, width, 90);

      // Gold Accent Stripe
      ctx.fillStyle = '#FFCB05';
      ctx.fillRect(0, 90, width, 10);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('KANTO LEAGUE · JARVIS HACKATHON 3.0', 30, 48);

      ctx.fillStyle = '#FFE4E6';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('OFFICIAL TRAINER PASSPORT', 30, 75);

      // Border around card
      ctx.strokeStyle = '#EE1515';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, width - 10, height - 10);

      // Photo Box
      const photoX = 40;
      const photoY = 130;
      const photoSize = 180;
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      ctx.strokeStyle = '#3B4CCA';
      ctx.lineWidth = 4;
      ctx.strokeRect(photoX, photoY, photoSize, photoSize);

      // Draw avatar placeholder or initial
      ctx.fillStyle = '#3B4CCA';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      const initial = (trainer.name || 'T')[0].toUpperCase();
      ctx.fillText(initial, photoX + photoSize / 2, photoY + photoSize / 2 + 25);
      ctx.textAlign = 'left';

      // Trainer Info on Right
      const infoX = 250;
      let curY = 160;

      // Name
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('TRAINER NAME:', infoX, curY);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(trainer.name || 'Anonymous Trainer', infoX, curY + 30);

      // Trainer ID
      curY += 75;
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('TRAINER ID NO:', infoX, curY);
      ctx.fillStyle = '#EE1515';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(trainer.trainerId || 'TRN-KL3-000000', infoX, curY + 28);

      // Team
      curY += 70;
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('TEAM SQUAD:', infoX, curY);
      ctx.fillStyle = '#3B4CCA';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(team ? `${team.name} (${team.teamId})` : 'Free Agent Trainer', infoX, curY + 28);

      // Bottom Badges Section
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.fillRect(30, 340, width - 60, 110);
      ctx.strokeRect(30, 340, width - 60, 110);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('KANTO LEAGUE HACKATHON BADGES', 45, 362);

      // Draw 8 badge medals
      const badgeSpacing = 85;
      BADGES.forEach((badge, idx) => {
        const bx = 70 + idx * badgeSpacing;
        const by = 405;
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fillStyle = badge.color;
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(badge.name.slice(0, 3).toUpperCase(), bx, by + 4);
        ctx.textAlign = 'left';
      });

      // Bottom Bar
      ctx.fillStyle = '#EE1515';
      ctx.fillRect(0, 480, width, 20);

      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Trainer_Card_${trainer.trainerId || 'Kanto'}.png`;
      link.href = dataUrl;
      link.click();
      playSuccessSound();
    } catch (err) {
      console.error('Failed to export ID card:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border-4 border-red-600"
        >
          {/* Card Top Header */}
          <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 font-pixel text-xs">
                KL
              </span>
              <div>
                <h3 className="font-pixel text-xs uppercase tracking-wider">Trainer Passport</h3>
                <p className="text-[10px] text-red-100 font-mono">Jarvis Hackathon 3.0 · SLRTCE</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
              aria-label="Close modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="h-1.5 bg-amber-400 w-full" />

          {/* Interactive Card Preview */}
          <div ref={cardRef} className="p-6 bg-linear-to-b from-slate-50 to-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              {/* Avatar Box */}
              <div className="flex flex-col items-center justify-center">
                <div className="h-32 w-32 rounded-xl border-4 border-blue-600 bg-white flex items-center justify-center shadow-md overflow-hidden relative group">
                  {trainer.avatarUrl ? (
                    <img src={trainer.avatarUrl} alt={trainer.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-pixel text-4xl text-blue-600">
                      {(trainer.name || 'T')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <span className="mt-2 inline-block rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-mono font-bold text-red-700">
                  {trainer.role.toUpperCase()}
                </span>
              </div>

              {/* Data Details */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Trainer Name</p>
                  <p className="text-xl font-bold text-slate-900">{trainer.name || 'Trainer'}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Official Trainer ID</p>
                  <p className="font-mono text-base font-bold text-red-600 tracking-wider">
                    {trainer.trainerId || 'TRN-KL3-000000'}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Team Affiliation</p>
                  <p className="text-sm font-semibold text-blue-700">
                    {team ? `${team.name} • ${team.teamId}` : 'Free Agent (Looking for Squad)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Badges Bar */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tournament Gym Badges
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BADGES.map((b) => (
                  <div
                    key={b.name}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition"
                  >
                    <span className="h-6 w-6 rounded-full shadow-inner" style={{ backgroundColor: b.color }} />
                    <span className="mt-1 font-mono text-[9px] font-bold text-slate-600">{b.name.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">PNG Export with Official Seal</span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-pixel text-white uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition disabled:opacity-50"
              >
                {downloading ? 'Exporting...' : 'Download ID Card'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
