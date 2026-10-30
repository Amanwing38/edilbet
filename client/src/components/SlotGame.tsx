import React, { useState } from 'react';
import { UserWallet } from '../types';

interface SlotGameProps {
  wallet: UserWallet;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
}

export const SlotGame: React.FC<SlotGameProps> = ({ wallet, onRefreshWallet, language }) => {
  const [stake, setStake] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [lastWin, setLastWin] = useState<{ mult: number; payout: number } | null>(null);

  const handleSpin = async () => {
    if (wallet.availableBalance < stake) {
      alert(`Insufficient balance. You need ${stake} ETB.`);
      return;
    }

    setIsSpinning(true);
    setLastWin(null);

    // Fast reel spinning effect
    const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣'];
    const interval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 80);

    try {
      const res = await fetch('/api/games/slot/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'Crazy777', stake })
      });
      const data = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        setReels(data.reels);
        setLastWin({ mult: data.multiplier, payout: data.payout });
        setIsSpinning(false);
        onRefreshWallet();
      }, 1000);
    } catch (err: any) {
      clearInterval(interval);
      setIsSpinning(false);
      alert('Spin error: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto">
      {/* Title */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-3xl flex items-center justify-center border border-purple-500/40">
            🎰
          </div>
          <div>
            <h3 className="font-black text-lg text-white">Crazy 777 2</h3>
            <p className="text-xs text-gray-400">Triple 7 pays 50x jackpot!</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs">
          JACKPOT
        </span>
      </div>

      {/* 3 Reels Stage */}
      <div className="bg-[#0b0e14] border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          {reels.map((sym, idx) => (
            <div
              key={idx}
              className={`w-24 h-32 rounded-2xl bg-[#161f2e] border-2 flex items-center justify-center text-5xl shadow-inner transition-all ${
                isSpinning ? 'border-purple-500 animate-pulse' : 'border-[#223147]'
              }`}
            >
              {sym}
            </div>
          ))}
        </div>

        {/* Win Alert */}
        {lastWin && (
          <div className="text-center font-black animate-bounce">
            {lastWin.payout > 0 ? (
              <span className="text-2xl text-[#00E676]">
                WIN: +{lastWin.payout.toFixed(2)} ETB ({lastWin.mult}x)
              </span>
            ) : (
              <span className="text-sm text-gray-400">Try Again!</span>
            )}
          </div>
        )}
      </div>

      {/* Stake & Spin Controls */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">Stake (ETB):</span>
          <div className="flex gap-1.5">
            {[10, 20, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                disabled={isSpinning}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  stake === v
                    ? 'bg-[#00E676] text-black'
                    : 'bg-[#182232] text-gray-300 border border-[#233148]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg uppercase tracking-wider shadow-xl shadow-purple-600/30 transition-all disabled:opacity-40"
        >
          {isSpinning ? 'SPINNING...' : `SPIN (${stake} ETB)`}
        </button>
      </div>
    </div>
  );
};
