import React, { useState } from 'react';
import { Trophy, Sparkles, X, Award } from 'lucide-react';
import { UserWallet } from '../types';

interface ShamoModalProps {
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

export const ShamoModal: React.FC<ShamoModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onRefreshWallet,
  currentUser,
  language
}) => {
  if (!isOpen) return null;

  const [stake, setStake] = useState<number>(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number[] | null>(null);
  const [winPayout, setWinPayout] = useState<number | null>(null);

  const chests = [0, 1, 2];

  const handlePick = async (index: number) => {
    if (wallet.availableBalance < stake) {
      alert('Insufficient balance!');
      return;
    }
    setIsPlaying(true);
    setSelectedChest(index);

    // Shuffle multipliers: one 0x, one 2x, one 5x (or 10x)
    const options = [0, 2.0, 5.0];
    const shuffled = options.sort(() => 0.5 - Math.random());
    const wonMult = shuffled[index];
    const payout = stake * wonMult;

    setTimeout(async () => {
      setRevealed(shuffled);
      setWinPayout(payout);
      setIsPlaying(false);

      if (payout > 0) {
        try {
          await fetch('/api/promotions/claim-bonus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser?.id || 'EB-741891'
            },
            body: JSON.stringify({ amount: payout - stake, reason: 'Shamo Win' })
          });
          onRefreshWallet();
        } catch {}
      }
    }, 1200);
  };

  const handleReset = () => {
    setSelectedChest(null);
    setRevealed(null);
    setWinPayout(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#10141d] border border-[#1f283a] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 text-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-[#1c2434] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black text-xs flex items-center justify-center">
              ሻሞ
            </div>
            <div className="text-left">
              <h3 className="font-black text-base text-white">Shamo (የሻሞ ጨዋታ)</h3>
              <span className="text-[10px] text-amber-400 font-bold">Pick the winning golden chest!</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#171d2b] hover:bg-[#20293d] border border-[#232f45] flex items-center justify-center text-gray-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* 3 Golden Mystery Chests */}
        <div className="grid grid-cols-3 gap-3 w-full py-4">
          {chests.map((i) => {
            const isPicked = selectedChest === i;
            const mult = revealed ? revealed[i] : null;

            return (
              <button
                key={i}
                disabled={isPlaying || revealed !== null}
                onClick={() => handlePick(i)}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 ${
                  isPicked
                    ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-[#151c28] border-[#222c3e] hover:bg-[#1d2738]'
                }`}
              >
                {revealed === null ? (
                  <>
                    <span className="text-3xl animate-pulse">🏺</span>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">#{i + 1}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{mult && mult > 0 ? '💰' : '💨'}</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        mult && mult > 0 ? 'text-[#00E676]' : 'text-gray-400'
                      }`}
                    >
                      {mult}x
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Win Alert */}
        {winPayout !== null && (
          <div
            className={`w-full p-3 rounded-2xl border flex flex-col items-center gap-0.5 animate-fadeIn ${
              winPayout > 0
                ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676]'
                : 'bg-[#182130] border-[#253248] text-gray-400'
            }`}
          >
            <span className="text-xs font-extrabold uppercase">
              {winPayout > 0 ? '🎉 You Won!' : 'Empty Chest!'}
            </span>
            <span className="text-xl font-black font-mono text-white">
              {winPayout > 0 ? `+${winPayout.toFixed(2)} ETB` : '0 ETB'}
            </span>
          </div>
        )}

        {/* Action Controls */}
        {revealed === null ? (
          <div className="w-full flex flex-col gap-2">
            <span className="text-xs text-gray-400 font-bold">Stake: {stake} ETB</span>
            <div className="grid grid-cols-4 gap-1.5 w-full">
              {[10, 20, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(v)}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono border ${
                    stake === v ? 'bg-amber-400 text-black border-amber-400 font-black' : 'bg-[#151c28] text-gray-300 border-[#222c3e]'
                  }`}
                >
                  {v} Br
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Tap any chest above to play!</p>
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00E676]/20 transition-all"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};
