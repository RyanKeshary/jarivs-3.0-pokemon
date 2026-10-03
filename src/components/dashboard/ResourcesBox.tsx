'use client';

import React, { useState } from 'react';
import { FolderDown, Download, FileText, ExternalLink, ChevronRight, Eye } from 'lucide-react';
import type { ProblemStatement } from '@/lib/database.types';

interface ResourcesBoxProps {
  brochureUrl?: string;
  pptTemplateUrl?: string;
  problemStatements: ProblemStatement[];
}

export function ResourcesBox({
  brochureUrl = '/assets/placeholders/brochure.pdf',
  pptTemplateUrl = '/assets/placeholders/template.pptx',
  problemStatements,
}: ResourcesBoxProps) {
  const [selectedStatement, setSelectedStatement] = useState<ProblemStatement | null>(null);

  return (
    <div className="bg-[#1E232A] text-white rounded-xl border-3 border-[#334155] p-4 flex flex-col h-full shadow-[4px_4px_0px_#1E232A] overflow-hidden">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <FolderDown size={16} className="text-[#FFCB05]" />
          <h3 className="font-pixel text-[11px] text-[#FFCB05] tracking-wider uppercase">
            BOX 4: RESOURCES & STATEMENTS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gray-400">DOWNLOADS</span>
      </div>

      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 space-y-3">
        {/* Quick Resource Downloads */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={brochureUrl}
            download
            className="p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-2 transition-all group"
          >
            <Download size={14} className="text-[#FFCB05] group-hover:scale-110 transition-transform" />
            <div className="overflow-hidden">
              <span className="font-pixel text-[9px] text-white block truncate">BROCHURE</span>
              <span className="text-[8px] font-mono text-gray-400 block">PDF GUIDE</span>
            </div>
          </a>

          <a
            href={pptTemplateUrl}
            download
            className="p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-2 transition-all group"
          >
            <FileText size={14} className="text-[#3B4CCA] group-hover:scale-110 transition-transform" />
            <div className="overflow-hidden">
              <span className="font-pixel text-[9px] text-white block truncate">PPT TEMPLATE</span>
              <span className="text-[8px] font-mono text-gray-400 block">SLIDE DECK</span>
            </div>
          </a>
        </div>

        {/* Problem Statements List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-gray-300 font-bold uppercase">
              ACTIVE PROBLEM STATEMENTS ({problemStatements.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {problemStatements.length === 0 ? (
              <div className="p-4 bg-gray-900/60 rounded-lg border border-gray-800 text-center text-xs text-gray-400 font-mono">
                Problem statements will unlock when hackathon starts.
              </div>
            ) : (
              problemStatements.map((statement, idx) => (
                <div
                  key={statement.id}
                  onClick={() => setSelectedStatement(statement)}
                  className="p-2.5 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-700 cursor-pointer flex items-center justify-between gap-2 transition-all"
                >
                  <div className="overflow-hidden">
                    <span className="font-pixel text-[9px] text-white truncate block">
                      PS {idx + 1}: {statement.title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-sans truncate block line-clamp-1">
                      {statement.description}
                    </span>
                  </div>
                  <Eye size={14} className="text-gray-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Problem Statement Detail Modal */}
      {selectedStatement && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1E232A] text-white border-3 border-[#FFCB05] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
              <span className="font-pixel text-xs text-[#FFCB05]">PROBLEM STATEMENT</span>
              <button
                onClick={() => setSelectedStatement(null)}
                className="text-gray-400 hover:text-white font-mono text-sm px-2 py-0.5 rounded hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <h4 className="font-pixel text-sm text-white mb-2">{selectedStatement.title}</h4>
            <div className="text-xs text-gray-300 max-h-60 overflow-y-auto leading-relaxed font-sans mb-4 whitespace-pre-wrap">
              {selectedStatement.description}
            </div>

            {selectedStatement.file_url && (
              <a
                href={selectedStatement.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-[10px] rounded-lg border border-white"
              >
                <Download size={14} />
                <span>DOWNLOAD PROBLEM ASSETS</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
