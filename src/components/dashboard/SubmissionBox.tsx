'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Lock, CheckCircle2, History, AlertTriangle, ExternalLink, Download, Loader2 } from 'lucide-react';
import { uploadSubmission, getDeckDownloadUrl } from '@/app/actions/dashboard';
import { playRetroBeep, playVictoryChime } from '@/lib/sound';
import type { Submission } from '@/lib/database.types';

interface SubmissionBoxProps {
  submissions: Submission[];
  teamId?: string;
  deadline: string;
  onPokedexRequest: () => void;
}

export function SubmissionBox({
  submissions,
  teamId,
  deadline,
  onPokedexRequest,
}: SubmissionBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocked = new Date() > new Date(deadline);
  const latestSubmission = submissions[0] || null;

  const handleDownload = async (storagePath: string) => {
    setDownloadingPath(storagePath);
    try {
      const res = await getDeckDownloadUrl(storagePath);
      if (res.signedUrl) {
        window.open(res.signedUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download deck');
    } finally {
      setDownloadingPath(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate size (50MB)
    if (file.size > 52428800) {
      setErrorMsg('File size exceeds the 50MB hackathon limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'ppt', 'pptx'].includes(ext || '')) {
      setErrorMsg('Invalid format. Only .pdf, .ppt, or .pptx presentation decks are accepted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadSubmission(formData);
      if (res.success) {
        playVictoryChime();
        setSuccessMsg(`Deck uploaded successfully as Version ${res.version}!`);
      }
    } catch (err: any) {
      playRetroBeep(220, 'sawtooth', 0.15);
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#1E232A] text-white rounded-xl border-3 border-[#334155] p-4 flex flex-col h-full shadow-[4px_4px_0px_#1E232A] overflow-hidden">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <UploadCloud size={16} className="text-[#EE1515]" />
          <h3 className="font-pixel text-[11px] text-[#EE1515] tracking-wider uppercase">
            BOX 3: SUBMISSION PORTAL
          </h3>
        </div>
        {isLocked ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
            <Lock size={10} />
            <span>LOCKED</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            OPEN
          </span>
        )}
      </div>

      {/* Main Body */}
      {!teamId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle size={28} className="text-amber-400 mb-2" />
          <p className="font-pixel text-xs text-amber-300">NO TEAM DETECTED</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs font-sans">
            You must form or join a squad before uploading your hackathon project deck.
          </p>
          <button
            onClick={onPokedexRequest}
            className="mt-3 px-3 py-1.5 bg-[#FFCB05] text-[#1E232A] font-pixel text-[10px] rounded-lg border border-[#1E232A] shadow-[2px_2px_0_black] cursor-pointer"
          >
            OPEN POKÉDEX TO JOIN TEAM
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
          {/* Status / Latest Submission */}
          <div>
            {latestSubmission ? (
              <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] text-[#FFCB05]">
                    LATEST: VERSION {latestSubmission.version}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400" suppressHydrationWarning>
                    {new Date(latestSubmission.submitted_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-700/60">
                  <div className="flex items-center gap-2 text-xs text-gray-200 min-w-0">
                    <FileText size={16} className="text-emerald-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">
                      {latestSubmission.ppt_url.split('/').pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(latestSubmission.ppt_url)}
                    disabled={downloadingPath === latestSubmission.ppt_url}
                    className="shrink-0 px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 rounded font-pixel text-[8px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {downloadingPath === latestSubmission.ppt_url ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <ExternalLink size={10} />
                    )}
                    <span>VIEW DECK</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-800/40 rounded-lg border border-dashed border-gray-700 text-center mb-3">
                <p className="text-xs text-gray-400 font-sans">No submission uploaded yet.</p>
              </div>
            )}

            {/* Version History List */}
            {submissions.length > 1 && (
              <div className="mb-3">
                <span className="font-mono text-[10px] text-gray-400 uppercase flex items-center gap-1 mb-1">
                  <History size={12} />
                  <span>Version History ({submissions.length})</span>
                </span>
                <div className="space-y-1 max-h-20 overflow-y-auto text-[11px] font-mono">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between px-2 py-1 bg-black/30 hover:bg-black/50 rounded text-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Version {sub.version}</span>
                        <span className="text-[9px] text-gray-500" suppressHydrationWarning>
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(sub.ppt_url)}
                        disabled={downloadingPath === sub.ppt_url}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-pixel flex items-center gap-1 cursor-pointer"
                      >
                        {downloadingPath === sub.ppt_url ? (
                          <Loader2 size={9} className="animate-spin" />
                        ) : (
                          <ExternalLink size={9} />
                        )}
                        <span>VIEW</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <p className="text-xs text-red-400 font-mono mb-2">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-xs text-emerald-400 font-mono mb-2">{successMsg}</p>
          )}

          {/* Upload Button or Locked Banner */}
          <div>
            {isLocked ? (
              <div className="p-2.5 bg-red-950/40 rounded-lg border border-red-800 text-center text-xs text-red-300 font-mono">
                Submissions are locked for judging.
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 disabled:opacity-50 text-white font-pixel text-[10px] rounded-lg border border-white shadow-[2px_2px_0px_black] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UploadCloud size={14} />
                  <span>
                    {uploading
                      ? 'TRANSMITTING DECK...'
                      : latestSubmission
                      ? 'REPLACE / UPLOAD NEW VERSION'
                      : 'UPLOAD PRESENTATION DECK (PPT/PDF)'}
                  </span>
                </button>
                <p className="text-[9px] text-center text-gray-400 mt-1 font-mono">
                  Accepted formats: .pdf, .ppt, .pptx · Max 50MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
