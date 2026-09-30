import React from 'react';
import { ShieldCheck, Copyright, FileText, CheckCircle2, Lock, X, ExternalLink } from 'lucide-react';

interface CopyrightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopyrightModal: React.FC<CopyrightModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="copyright-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="copyright-certificate-card"
        className="bg-[#0e1013] border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto relative"
      >
        {/* Certificate Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#14171c] to-emerald-950/20 border-b border-emerald-500/20 p-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Intellectual Property
                </span>
                <span className="text-[10px] text-slate-400 font-mono">EST. 2026</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1">
                KURAL™ Copyright & License
              </h2>
              <p className="text-xs text-slate-400">
                Official ownership declaration & creative rights
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Ownership Badge Box */}
          <div className="bg-[#14171c] rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Author & Exclusive Copyright Holder
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Creator
              </span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>Benjamin Clifford George</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono">
                (benjamincliffordgeorge@gmail.com)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Creator, System Architect & Sole Proprietor of <strong className="text-white">KURAL™ AI Search & Neural Audio Studio</strong>.
            </div>
          </div>

          {/* Legal Claims Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Protected Intellectual Property Rights
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#0a0b0d] rounded-lg border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Copyright className="w-3.5 h-3.5 text-emerald-400" />
                  <span>UI / UX Architecture</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Original layout, chat flow, floating pill input, and dark aesthetic design.
                </p>
              </div>

              <div className="p-3 bg-[#0a0b0d] rounded-lg border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Brand Identity & Name</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  "KURAL" (குரல் = Voice) and tagline "Your Voice. Your Intelligence."
                </p>
              </div>

              <div className="p-3 bg-[#0a0b0d] rounded-lg border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Proprietary Logic</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Live search grounding integration, dual-engine voice hearing, and TTS encoding.
                </p>
              </div>

              <div className="p-3 bg-[#0a0b0d] rounded-lg border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Commercial Rights</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  All rights reserved worldwide under international copyright laws (WIPO/Berne).
                </p>
              </div>
            </div>
          </div>

          {/* Formal Notice */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 leading-relaxed font-mono">
            © 2026 KURAL by Benjamin Clifford. All Rights Reserved. No portion of this software, interface design, or proprietary brand assets may be reproduced, reverse-engineered, or distributed without express prior written consent from Benjamin Clifford George.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#14171c]/50 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Registration Ref: KURAL-2026-BCG
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
