import React from 'react';
import { useMonetization } from '../context/MonetizationContext';
import { Zap, Sparkles, X, ShieldAlert, ArrowRight, Coins } from 'lucide-react';

export const LimitReachedModal: React.FC = () => {
  const { limitAlert, closeLimitAlert, openPricingModal } = useMonetization();

  if (!limitAlert) return null;

  const featureNames: Record<string, string> = {
    voice: 'Voice Synthesis',
    chat: 'Gemini Chat & Search',
    live: 'Live Voice API',
  };

  const displayName = featureNames[limitAlert.feature] || 'AI Studio Operation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#0e1013] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 relative">
        <button
          type="button"
          onClick={closeLimitAlert}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Free Quota Reached
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {displayName} Limit
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {limitAlert.message ||
            `You have used your free daily allowance for ${displayName}. Your free quota resets at midnight, or you can top up credits starting at just ₹49 to continue immediately.`}
        </p>

        {/* Quick Top-up Options */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              closeLimitAlert();
              openPricingModal('credits');
            }}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold text-xs flex items-center justify-between hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Top Up 100 Credits (₹49)</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              closeLimitAlert();
              openPricingModal('plans');
            }}
            className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Upgrade to Pro Creator (Unlimited Voice)</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={closeLimitAlert}
            className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
