import React from 'react';
import { Trophy } from 'lucide-react';
import { MoneyRainDrop } from '../types';

interface MoneyRainModalProps {
  drop: MoneyRainDrop;
  onClose: () => void;
  language: 'am' | 'en';
}

export const MoneyRainModal: React.FC<MoneyRainModalProps> = ({ drop, onClose, language }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 animate-scaleUp">
        {/* Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-400/20">
          <Trophy className="w-8 h-8 fill-amber-400" />
        </div>

        {/* Title & Subtitle (Exact copy from Screenshot 1) */}
        <div className="text-center flex flex-col gap-1">
          <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>🏆</span>
            <span>Money Rain — Winners</span>
          </h3>
          <p className="text-xs font-semibold text-gray-400">
            Br {drop.totalAmount} shared between {drop.recipientsCount} players
          </p>
        </div>

        {/* Winner Leaderboard List */}
        <div className="w-full flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {drop.winners.map((winner, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#161f2e] border border-[#212c3f] text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold w-4">{idx + 1}.</span>
                <span className="font-extrabold text-white">{winner.username}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400">{winner.maskedPhone}</span>
                <span className="font-black text-[#00E676]">{winner.amount} ETB</span>
              </div>
            </div>
          ))}
        </div>

        {/* Green "Keep playing" CTA (Exact copy from Screenshot 1) */}
        <button
          onClick={onClose}
          className="w-full h-13 py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-base uppercase tracking-wider shadow-xl shadow-[#00E676]/30 transition-all transform active:scale-98 mt-1"
        >
          Keep playing
        </button>
      </div>
    </div>
  );
};
