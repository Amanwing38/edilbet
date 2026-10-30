import React, { useState, useRef } from 'react';
import { Sparkles, Trophy, X, Gift } from 'lucide-react';
import { UserWallet } from '../types';

interface LuckySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  onRefreshWallet: () => void;
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
  };
  language: 'am' | 'en';
}

const SLICES = [
  { label: '10 Br', value: 10, color: '#00E676', text: '#000000' },
  { label: '0 Br', value: 0, color: '#1f293d', text: '#ffffff' },
  { label: '50 Br', value: 50, color: '#f59e0b', text: '#000000' },
  { label: '5 Br', value: 5, color: '#3b82f6', text: '#ffffff' },
  { label: '100 Br', value: 100, color: '#ec4899', text: '#ffffff' },
  { label: '0 Br', value: 0, color: '#1f293d', text: '#ffffff' },
  { label: '500 Br', value: 500, color: '#e11d48', text: '#ffffff' },
  { label: '20 Br', value: 20, color: '#8b5cf6', text: '#ffffff' },
];

export const LuckySpinModal: React.FC<LuckySpinModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onRefreshWallet,
  currentUser,
  language
}) => {
  if (!isOpen) return null;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winPrize, setWinPrize] = useState<{ label: string; value: number } | null>(null);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinPrize(null);

    // Pick winning slice
    const winningIndex = Math.floor(Math.random() * SLICES.length);
    const sliceAngle = 360 / SLICES.length;
    // Extra full spins (5 to 8 rotations) + target angle
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = extraRotations + (360 - (winningIndex * sliceAngle + sliceAngle / 2));

    setRotation((prev) => prev + targetAngle);

    setTimeout(async () => {
      setIsSpinning(false);
      const won = SLICES[winningIndex];
      setWinPrize(won);

      if (won.value > 0) {
        try {
          await fetch('/api/promotions/claim-bonus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser?.id || 'EB-741891'
            },
            body: JSON.stringify({ amount: won.value, reason: 'Lucky Spin Win' })
          });
          onRefreshWallet();
        } catch {
          // offline fallback
        }
      }
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#10141d] border border-[#1f283a] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between border-b border-[#1c2434] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎡</span>
            <div>
              <h3 className="font-black text-base text-white">
                {language === 'am' ? 'የዕድል እሽክርክሪት (Lucky Spin)' : 'Lucky Wheel'}
              </h3>
              <span className="text-[10px] text-[#00E676] font-bold">1 Free Spin Available</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#171d2b] hover:bg-[#20293d] border border-[#232f45] flex items-center justify-center text-gray-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 my-2 flex items-center justify-center">
          {/* Top Indicator Pointer */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-md" />

          {/* Rotating Wheel */}
          <div
            className="w-60 h-60 rounded-full border-4 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] relative overflow-hidden transition-transform duration-[4500ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {SLICES.map((slice, idx) => {
              const angle = (360 / SLICES.length) * idx;
              return (
                <div
                  key={idx}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '50% 50%',
                    clipPath: 'polygon(50% 50%, 30% 0%, 70% 0%)',
                    backgroundColor: slice.color
                  }}
                >
                  <span
                    className="absolute top-4 left-1/2 -translate-x-1/2 font-black text-xs font-mono drop-shadow-sm whitespace-nowrap"
                    style={{ color: slice.text }}
                  >
                    {slice.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center Hub Button */}
          <div className="absolute z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-[#121824] to-[#1e293b] border-2 border-amber-400 flex items-center justify-center shadow-lg">
            <span className="text-base">⭐</span>
          </div>
        </div>

        {/* Win Alert */}
        {winPrize && (
          <div
            className={`w-full p-3 rounded-2xl border text-center flex flex-col items-center gap-0.5 animate-fadeIn ${
              winPrize.value > 0
                ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676]'
                : 'bg-[#182130] border-[#253248] text-gray-400'
            }`}
          >
            <span className="text-xs font-extrabold uppercase">
              {winPrize.value > 0 ? '🎉 Congratulations!' : 'Better luck next time!'}
            </span>
            <span className="text-xl font-black font-mono text-white">
              {winPrize.value > 0 ? `+${winPrize.value} ETB Credited` : '0 ETB'}
            </span>
          </div>
        )}

        {/* Spin Action Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/25 active:scale-98 transition-all disabled:opacity-50"
        >
          {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL (አሽከርክር)'}
        </button>
      </div>
    </div>
  );
};
