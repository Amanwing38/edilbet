import React, { useState } from 'react';
import { UserWallet } from '../types';

interface ChickenRoadGameProps {
  wallet: UserWallet;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
}

export const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({
  wallet,
  onRefreshWallet,
  language
}) => {
  const [stake, setStake] = useState<number>(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLane, setCurrentLane] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);

  const lanes = [1.35, 1.82, 2.46, 3.32, 4.48, 6.05, 8.17, 11.03];

  const handleStartGame = async () => {
    if (wallet.availableBalance < stake) {
      alert(`Insufficient balance. You need ${stake} ETB.`);
      return;
    }

    try {
      // Debit stake
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIndex: 0, currentMultiplier: 1.00, isCashingOut: false, stake })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
        return;
      }

      setIsPlaying(true);
      setCurrentLane(0);
      setMultiplier(1.00);
      setIsGameOver(false);
      setHasWon(false);
      setPayoutAmount(0);
      onRefreshWallet();
    } catch (err: any) {
      alert('Error starting Chicken Road: ' + err.message);
    }
  };

  const handleStep = async () => {
    if (!isPlaying || isGameOver) return;

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIndex: currentLane + 1,
          currentMultiplier: multiplier,
          isCashingOut: false,
          stake
        })
      });
      const data = await res.json();

      if (data.crashed) {
        setIsGameOver(true);
        setIsPlaying(false);
      } else {
        const nextLane = currentLane + 1;
        setCurrentLane(nextLane);
        setMultiplier(data.nextMultiplier);
        if (nextLane >= lanes.length) {
          handleCashout(data.nextMultiplier);
        }
      }
    } catch (err: any) {
      alert('Step error: ' + err.message);
    }
  };

  const handleCashout = async (multOverride?: number) => {
    if (!isPlaying || isGameOver) return;
    const finalMult = multOverride || multiplier;

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIndex: currentLane,
          currentMultiplier: finalMult,
          isCashingOut: true,
          stake
        })
      });
      const data = await res.json();
      if (data.cashedOut) {
        setIsPlaying(false);
        setHasWon(true);
        setPayoutAmount(data.payout);
        onRefreshWallet();
      }
    } catch (err: any) {
      alert('Cashout error: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">
      {/* Title */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center border border-amber-500/40">
            🐔
          </div>
          <div>
            <h3 className="font-black text-lg text-white">Chicken Road 2.0</h3>
            <p className="text-xs text-gray-400">Cross the highway. Cash out before getting hit!</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400">Multiplier</span>
          <div className="text-2xl font-black text-[#00E676] font-mono">{multiplier.toFixed(2)}x</div>
        </div>
      </div>

      {/* Highway Lanes Board */}
      <div className="bg-[#0b0e14] border border-[#1d273a] rounded-3xl p-5 shadow-2xl flex flex-col gap-2 relative overflow-hidden">
        {/* Road Surface */}
        {lanes.map((mult, idx) => {
          const isPassed = currentLane > idx;
          const isCurrent = currentLane === idx && isPlaying;
          return (
            <div
              key={idx}
              className={`h-11 rounded-xl border flex items-center justify-between px-4 transition-all ${
                isCurrent
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-black shadow-md shadow-amber-400/20'
                  : isPassed
                  ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676] font-bold'
                  : 'bg-[#141d2a] border-[#1e2b3e] text-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono">Lane {idx + 1}</span>
                {isCurrent && <span className="text-xl animate-bounce">🐔</span>}
                {isPassed && <span>🌽</span>}
              </div>
              <span className="font-mono font-black text-sm">{mult}x</span>
            </div>
          );
        })}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-fadeIn z-10">
            <span className="text-5xl">💥</span>
            <span className="text-xl font-black text-red-500 uppercase tracking-wider">
              CRUSHED!
            </span>
            <p className="text-xs text-gray-300">The chicken didn't make it across.</p>
          </div>
        )}

        {/* Win Overlay */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-fadeIn z-10">
            <span className="text-5xl">🏆</span>
            <span className="text-2xl font-black text-[#00E676] uppercase tracking-wider">
              CASHED OUT!
            </span>
            <span className="text-3xl font-black text-white font-mono">+{payoutAmount.toFixed(2)} ETB</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        {!isPlaying ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">Stake (ETB):</span>
              <div className="flex gap-1.5">
                {[10, 20, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    onClick={() => setStake(v)}
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
              onClick={handleStartGame}
              className="w-full h-13 py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-base uppercase tracking-wider shadow-lg shadow-[#00E676]/30 transition-all"
            >
              Start Game ({stake} ETB)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStep}
              className="h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Step Forward 🐔</span>
            </button>
            <button
              onClick={() => handleCashout()}
              disabled={currentLane === 0}
              className="h-14 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-[#00E676]/30 transition-all flex flex-col items-center justify-center disabled:opacity-40"
            >
              <span className="text-[10px] uppercase font-bold">Cash Out</span>
              <span className="text-sm font-black font-mono">{(stake * multiplier).toFixed(2)} ETB</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
