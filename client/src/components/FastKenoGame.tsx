import React, { useState } from 'react';
import { Sparkles, Trash2, Award, Info, RefreshCw } from 'lucide-react';
import { UserWallet } from '../types';

interface FastKenoGameProps {
  wallet: UserWallet;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
  };
  onBack?: () => void;
}

export const FastKenoGame: React.FC<FastKenoGameProps> = ({
  wallet,
  onRefreshWallet,
  language,
  currentUser,
  onBack
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [stake, setStake] = useState<number>(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [matchedNumbers, setMatchedNumbers] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<{ hits: number; mult: number; payout: number } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  // Toggle Number Selection (1 to 10 allowed)
  const toggleNumber = (num: number) => {
    if (isDrawing) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length >= 10) {
        alert('You can select a maximum of 10 numbers.');
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  // Quick Pick Random Numbers
  const handleQuickPick = (count: number = 5) => {
    if (isDrawing) return;
    const all = Array.from({ length: 80 }, (_, i) => i + 1);
    const shuffled = all.sort(() => 0.5 - Math.random());
    setSelectedNumbers(shuffled.slice(0, count).sort((a, b) => a - b));
  };

  // Clear Board
  const handleClear = () => {
    if (isDrawing) return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setMatchedNumbers([]);
    setLastWin(null);
  };

  // Play Draw
  const handlePlay = async () => {
    if (selectedNumbers.length === 0) {
      alert('Please pick between 1 and 10 numbers.');
      return;
    }
    if (wallet.availableBalance < stake) {
      alert(`Insufficient balance. You need ${stake} ETB.`);
      return;
    }

    setIsDrawing(true);
    setDrawnNumbers([]);
    setMatchedNumbers([]);
    setLastWin(null);

    try {
      const res = await fetch('/api/games/keno/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741891'
        },
        body: JSON.stringify({
          pickedNumbers: selectedNumbers,
          stake
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error);
        setIsDrawing(false);
        return;
      }

      // Animate Ball Drops (20 numbers, 80ms interval)
      const fullDrawn: number[] = data.drawnNumbers;
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < fullDrawn.length) {
          const ball = fullDrawn[currentIdx];
          setDrawnNumbers((prev) => [...prev, ball]);
          currentIdx++;
        } else {
          clearInterval(interval);
          setMatchedNumbers(data.matchedNumbers);
          setLastWin({
            hits: data.matchedCount,
            mult: data.multiplier,
            payout: data.payout
          });
          setIsDrawing(false);
          onRefreshWallet();
        }
      }, 70);
    } catch (err: any) {
      alert('Network error playing Keno: ' + err.message);
      setIsDrawing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111927] to-[#152033] border border-[#1e2a40] rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00c853] to-[#00E676] flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-[#00E676]/30">
            80
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                {language === 'am' ? 'ፋስት ኬኖ (Fast Keno)' : 'Fast Keno 10/20/80'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00E676]/20 text-[#00E676] text-[10px] font-bold border border-[#00E676]/40">
                PROVABLY FAIR
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Pick 1 to 10 numbers • 20 balls drawn • Multipliers up to 10,000x!
            </p>
          </div>
        </div>

        {/* Action Controls & Paytable Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaytable(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b2537] hover:bg-[#233047] border border-[#273854] text-xs font-bold text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4 text-[#00E676]" />
            <span>Paytable</span>
          </button>
          <button
            onClick={() => handleQuickPick(5)}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a2b22] hover:bg-[#22392d] border border-[#00E676]/40 text-xs font-bold text-[#00E676] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Pick 5</span>
          </button>
          <button
            onClick={handleClear}
            disabled={isDrawing || selectedNumbers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a1b1b] hover:bg-[#3d2424] border border-red-500/30 text-xs font-bold text-red-400 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Grid Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* The 80-Number Grid (3 Cols) */}
        <div className="lg:col-span-3 bg-[#111826] border border-[#1d273a] rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#1b2536] pb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Selected: <strong className="text-white font-mono text-sm">{selectedNumbers.length}/10</strong>
            </span>
            <span className="text-xs font-bold text-gray-400 font-mono">
              Balance: {wallet.availableBalance.toFixed(2)} ETB
            </span>
          </div>

          {/* 80 Grid Buttons (8 x 10) */}
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              const isDrawn = drawnNumbers.includes(num);
              const isHit = isSelected && isDrawn;

              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={isDrawing}
                  className={`h-9 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all transform active:scale-95 flex items-center justify-center border ${
                    isHit
                      ? 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/50 scale-105 z-10 animate-bounce'
                      : isDrawn
                      ? 'bg-red-500/25 border-red-500/60 text-red-400'
                      : isSelected
                      ? 'bg-[#00E676] border-[#00c853] text-black shadow-md shadow-[#00E676]/30 font-black'
                      : 'bg-[#16202f] border-[#222e42] text-gray-300 hover:bg-[#1f2b3e]'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Drawn 20 Balls Tray */}
          <div className="mt-2 bg-[#0b0e14] border border-[#1b2538] rounded-2xl p-3 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isDrawing ? 'animate-spin text-[#00E676]' : ''}`} />
              Drawn Balls ({drawnNumbers.length}/20):
            </span>
            <div className="flex flex-wrap gap-1.5 min-h-[38px] items-center">
              {drawnNumbers.map((b, idx) => {
                const wasHit = selectedNumbers.includes(b);
                return (
                  <span
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-sm ${
                      wasHit
                        ? 'bg-amber-400 text-black border border-amber-300 scale-110'
                        : 'bg-[#1b2638] text-white border border-[#2b3a54]'
                    }`}
                  >
                    {b}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Betting & Play Sidebar (1 Col) */}
        <div className="bg-[#111826] border border-[#1d273a] rounded-3xl p-5 shadow-xl flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider border-b border-[#1d273a] pb-2">
              Wager & Payout
            </h3>

            {/* Stake Input */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400">Stake (ETB):</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[10, 20, 50, 100, 200, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setStake(v)}
                    disabled={isDrawing}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      stake === v
                        ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/30'
                        : 'bg-[#182232] text-gray-300 hover:bg-[#202c40] border border-[#233148]'
                    }`}
                  >
                    {v} Br
                  </button>
                ))}
              </div>
            </div>

            {/* Win Display */}
            {lastWin && (
              <div
                className={`p-4 rounded-2xl border flex flex-col items-center gap-1 text-center animate-fadeIn ${
                  lastWin.payout > 0
                    ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676]'
                    : 'bg-[#1a2230] border-[#253246] text-gray-400'
                }`}
              >
                <Award className="w-8 h-8" />
                <span className="text-sm font-extrabold uppercase">
                  {lastWin.payout > 0 ? `YOU WON! (${lastWin.hits} Hits)` : 'NO WIN THIS ROUND'}
                </span>
                <span className="text-2xl font-black font-mono">
                  {lastWin.payout > 0 ? `+${lastWin.payout.toFixed(2)} ETB` : '0.00 ETB'}
                </span>
                {lastWin.mult > 0 && (
                  <span className="text-xs font-bold text-amber-400">
                    Multiplier: {lastWin.mult}x
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Play Draw Button */}
          <button
            onClick={handlePlay}
            disabled={isDrawing || selectedNumbers.length === 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black text-lg tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98 flex items-center justify-center gap-2"
          >
            {isDrawing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <span>PLAY ({stake} ETB)</span>
            )}
          </button>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <h3 className="font-extrabold text-base text-white">Ethiopian Fast Keno Paytable</h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-2">
              <p className="font-bold text-[#00E676]">Multipliers on Stake:</p>
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#1e283b] space-y-1 font-mono text-[11px]">
                <div>• Pick 1: Hit 1 = <strong>3.5x</strong></div>
                <div>• Pick 2: Hit 2 = <strong>12x</strong></div>
                <div>• Pick 3: Hit 2 = <strong>2.5x</strong>, Hit 3 = <strong>42x</strong></div>
                <div>• Pick 5: Hit 3 = <strong>3x</strong>, Hit 4 = <strong>25x</strong>, Hit 5 = <strong>500x</strong></div>
                <div>• Pick 10: Hit 5 = <strong>2x</strong>, Hit 6 = <strong>15x</strong>, Hit 7 = <strong>80x</strong>, Hit 8 = <strong>500x</strong>, Hit 9 = <strong>2,500x</strong>, Hit 10 = <strong>10,000x</strong></div>
              </div>
            </div>
            <button
              onClick={() => setShowPaytable(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E676] text-black font-extrabold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
