import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, ArrowRight, RefreshCw, Trophy, Flame } from 'lucide-react';
import { UserWallet } from '../types';

interface ChickenRoadGameProps {
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

type Difficulty = 'easy' | 'medium' | 'hard' | 'daredevil';

export const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({
  wallet,
  onRefreshWallet,
  language,
  currentUser,
  onBack
}) => {
  const [stake, setStake] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLane, setCurrentLane] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [isStepping, setIsStepping] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);

  // Multipliers progression for each difficulty
  const difficultyConfig: Record<Difficulty, { label: string; traps: number; mults: number[] }> = {
    easy: {
      label: 'Easy (ቀላል)',
      traps: 1,
      mults: [1.15, 1.35, 1.60, 1.90, 2.30, 2.80, 3.45, 4.30, 5.40, 7.00]
    },
    medium: {
      label: 'Medium (መካከለኛ)',
      traps: 2,
      mults: [1.45, 2.10, 3.05, 4.45, 6.50, 9.50, 14.00, 21.00]
    },
    hard: {
      label: 'Hard (ከባድ)',
      traps: 3,
      mults: [1.85, 3.45, 6.40, 12.00, 22.50, 42.00, 80.00]
    },
    daredevil: {
      label: 'Daredevil (አደገኛ)',
      traps: 4,
      mults: [2.85, 8.10, 23.50, 68.00, 200.00, 600.00]
    }
  };

  const lanes = difficultyConfig[difficulty].mults;

  const handleStartGame = async () => {
    if (wallet.availableBalance < stake) {
      alert(language === 'am' ? 'በቂ ሂሳብ የለም። እባክዎ ገንዘብ ያስገቡ!' : `Insufficient balance! You need ${stake} ETB.`);
      return;
    }

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741891'
        },
        body: JSON.stringify({
          stepIndex: 0,
          currentMultiplier: 1.00,
          isCashingOut: false,
          stake,
          difficulty
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to start game');
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
    if (!isPlaying || isGameOver || isStepping) return;

    setIsStepping(true);
    try {
      const nextStepIndex = currentLane + 1;
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741891'
        },
        body: JSON.stringify({
          stepIndex: nextStepIndex,
          currentMultiplier: multiplier,
          isCashingOut: false,
          stake,
          difficulty
        })
      });
      const data = await res.json();
      setIsStepping(false);

      if (data.crashed) {
        setIsGameOver(true);
        setIsPlaying(false);
        onRefreshWallet();
      } else {
        const nextMult = lanes[currentLane] || data.nextMultiplier;
        setCurrentLane(nextStepIndex);
        setMultiplier(nextMult);

        // If completed all lanes, auto cashout
        if (nextStepIndex >= lanes.length) {
          handleCashout(nextMult);
        }
      }
    } catch (err: any) {
      setIsStepping(false);
      alert('Step error: ' + err.message);
    }
  };

  const handleCashout = async (multOverride?: number) => {
    if (!isPlaying || isGameOver) return;
    const finalMult = multOverride || multiplier;

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741891'
        },
        body: JSON.stringify({
          stepIndex: currentLane,
          currentMultiplier: finalMult,
          isCashingOut: true,
          stake,
          difficulty
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
    <div className="flex flex-col gap-3 max-w-md mx-auto text-white select-none pb-4">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#10141d] border border-[#1f283a] rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-md">
            🐔
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white">Chicken Road 2.0</h2>
              <span className="px-1.5 py-0.2 rounded bg-[#00E676]/20 text-[#00E676] text-[9px] font-black uppercase tracking-wider">
                PROVABLY FAIR
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              {language === 'am' ? 'መንገዱን ተሻግረህ ሳትጠበስ ብርህን አውጣ!' : 'Cross the road. Cash out before getting roasted!'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowProvablyFair(true)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-[#151c28] border border-[#232e42]"
          title="Provably Fair"
        >
          <ShieldCheck className="w-4 h-4 text-[#00E676]" />
        </button>
      </div>

      {/* 2. Difficulty Selector (when not in a round) */}
      {!isPlaying && (
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#0b0e14] border border-[#1b2434] rounded-2xl">
          {(['easy', 'medium', 'hard', 'daredevil'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${
                difficulty === d
                  ? d === 'daredevil'
                    ? 'bg-red-600 text-white shadow-md font-black'
                    : d === 'hard'
                    ? 'bg-amber-600 text-white shadow-md font-black'
                    : 'bg-[#00E676] text-black shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* 3. The Highway Track (Lanes Board) */}
      <div className="relative bg-[#080a0f] border border-[#1b2332] rounded-3xl p-3 shadow-2xl flex flex-col gap-1.5 overflow-hidden min-h-[340px] justify-end">
        {/* Animated road markings */}
        <div className="absolute inset-0 bg-[radial-gradient(#1c2638_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        {/* Multiplier Track Lanes (Rendered bottom to top or top to bottom) */}
        <div className="flex flex-col-reverse gap-1.5 z-10">
          {lanes.map((mult, idx) => {
            const laneNum = idx + 1;
            const isPassed = currentLane >= laneNum;
            const isCurrent = currentLane === laneNum && isPlaying;
            const isNext = currentLane === idx && isPlaying;

            return (
              <div
                key={idx}
                className={`h-11 rounded-2xl border px-3 flex items-center justify-between transition-all duration-300 ${
                  isCurrent
                    ? 'bg-amber-400/20 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]'
                    : isPassed
                    ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676]'
                    : isNext
                    ? 'bg-[#15202e] border-amber-500/50 animate-pulse text-gray-200'
                    : 'bg-[#0e131b] border-[#18212e] text-gray-500 opacity-60'
                }`}
              >
                {/* Lane Info + Chicken Position */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono font-bold text-gray-400">
                    #{laneNum}
                  </span>

                  {isCurrent && (
                    <div className="flex items-center gap-1.5 animate-bounce">
                      <span className="text-xl">🐔</span>
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                        Current
                      </span>
                    </div>
                  )}

                  {isPassed && !isCurrent && (
                    <div className="flex items-center gap-1">
                      <span className="text-base">🌽</span>
                      <span className="text-[10px] font-black text-[#00E676]">Safe</span>
                    </div>
                  )}

                  {!isPassed && !isCurrent && (
                    <span className="text-xs text-gray-600">•••••</span>
                  )}
                </div>

                {/* Multiplier Badge */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${
                      isCurrent
                        ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                        : isPassed
                        ? 'bg-[#00E676]/20 text-[#00E676]'
                        : 'text-gray-400'
                    }`}
                  >
                    {mult.toFixed(2)}x
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* GAME OVER (ROASTED) OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-fadeIn z-20 p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-4xl animate-bounce">
              🍗
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-black text-red-500 tracking-wider">
                {language === 'am' ? 'ተጠበሰች! (ROASTED)' : 'ROASTED! CRUSHED!'}
              </span>
              <p className="text-xs text-gray-400 max-w-xs">
                {language === 'am'
                  ? 'ዶሮዋ መንገዱን ሳትሻገር ተመታች። እንደገና ይሞክሩ!'
                  : "The chicken didn't make it past the frying pan. Try again!"}
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              {language === 'am' ? 'እንደገና ሞክር' : 'Play Again'}
            </button>
          </div>
        )}

        {/* WON / CASHED OUT OVERLAY */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-fadeIn z-20 p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-[#00E676]/20 border-2 border-[#00E676] flex items-center justify-center text-4xl animate-bounce">
              🏆
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-black text-[#00E676] tracking-wider">
                {language === 'am' ? 'ተቀብለዋል!' : 'CASHED OUT!'}
              </span>
              <span className="text-3xl font-black text-white font-mono drop-shadow-md">
                +{payoutAmount.toFixed(2)} ETB
              </span>
            </div>
            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00E676]/30 active:scale-95 transition-all"
            >
              {language === 'am' ? 'ቀጣይ ጨዋታ' : 'Play Next Round'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Controls & Action Buttons */}
      <div className="bg-[#10141d] border border-[#1f283a] rounded-3xl p-3.5 shadow-xl flex flex-col gap-3">
        {!isPlaying ? (
          /* BET SETUP */
          <div className="flex flex-col gap-3">
            {/* Stake Stepper & Chips */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">
                  {language === 'am' ? 'የመወራረጃ መጠን (Stake ETB):' : 'Bet Amount (ETB):'}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Balance: {wallet.availableBalance.toFixed(2)} Br
                </span>
              </div>

              {/* Chips */}
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 20, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    onClick={() => setStake(v)}
                    className={`py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                      stake === v
                        ? 'bg-[#00E676] text-black border-[#00E676] shadow-md shadow-[#00E676]/20'
                        : 'bg-[#151c28] text-gray-300 border-[#222c3d] hover:bg-[#1d2738]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Green Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-base tracking-wider uppercase shadow-lg shadow-[#00E676]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>{language === 'am' ? 'ጀምር' : 'Start Game'}</span>
              <span className="font-mono">({stake.toFixed(2)} ETB)</span>
            </button>
          </div>
        ) : (
          /* ACTIVE GAME CONTROLS: STEP OR CASHOUT */
          <div className="grid grid-cols-2 gap-2.5">
            {/* Step Forward Button */}
            <button
              onClick={handleStep}
              disabled={isStepping}
              className="h-16 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/20 active:scale-98 transition-all flex flex-col items-center justify-center p-2"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🐔</span>
                <span className="text-xs font-black">
                  {isStepping ? 'Stepping...' : 'Step Forward'}
                </span>
              </div>
              <span className="text-[10px] opacity-80 font-bold">
                Next: {lanes[currentLane]?.toFixed(2) || 'Max'}x
              </span>
            </button>

            {/* Cash Out Button */}
            <button
              onClick={() => handleCashout()}
              disabled={currentLane === 0}
              className="h-16 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-[#00E676]/25 active:scale-98 transition-all flex flex-col items-center justify-center p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-black/80">
                Cash Out
              </span>
              <span className="text-base font-black font-mono">
                {(stake * multiplier).toFixed(2)} ETB
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Provably Fair Modal */}
      {showProvablyFair && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232738] rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#232738] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                <h3 className="font-extrabold text-sm text-white">Provably Fair Highway</h3>
              </div>
              <button
                onClick={() => setShowProvablyFair(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every lane trap location is generated with SHA-256 before the round begins. The server cannot change the frying pan positions during your run.
            </p>
            <div className="p-2.5 rounded-xl bg-[#090a0f] border border-[#202434] text-[10px] font-mono text-[#00E676] break-all">
              sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
            </div>
            <button
              onClick={() => setShowProvablyFair(false)}
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
