import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Plane, ShieldCheck, History, Users, ArrowUpRight } from 'lucide-react';
import { AviatorLiveBet, UserWallet } from '../types';

interface AviatorGameProps {
  socket: Socket | null;
  wallet: UserWallet;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
  };
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  socket,
  wallet,
  onRefreshWallet,
  language,
  currentUser
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<'BETTING' | 'FLYING' | 'CRASHED'>('BETTING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>([1.24, 2.15, 1.03, 5.40, 1.82, 12.50, 1.15, 3.42, 7.80, 2.90]);
  const [liveBets, setLiveBets] = useState<AviatorLiveBet[]>([]);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [serverSeedHash, setServerSeedHash] = useState('a9b8c7d6e5f4...sha256');

  // Player Bet Panel 1
  const [stake1, setStake1] = useState(20);
  const [autoCashout1, setAutoCashout1] = useState<string>('2.00');
  const [isAutoCashout1, setIsAutoCashout1] = useState(false);
  const [hasBet1, setHasBet1] = useState(false);
  const [myBetId1, setMyBetId1] = useState<string | null>(null);
  const [cashedOut1, setCashedOut1] = useState(false);
  const [cashoutWin1, setCashoutWin1] = useState<number | null>(null);

  // Canvas Animation Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = '#161e2b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (gameState === 'FLYING') {
        t += 0.03;
        const startX = 40;
        const startY = canvas.height - 30;

        // Parabolic Flight Curve
        const progress = Math.min(1, (multiplier - 1) / 8);
        const planeX = startX + progress * (canvas.width - 120);
        const planeY = startY - Math.pow(progress, 0.75) * (canvas.height - 90);

        // Glowing Flight Trail
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (planeX - startX) * 0.4, startY, planeX, planeY);
        ctx.strokeStyle = '#FF3366';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FF3366';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(planeX, startY);
        ctx.lineTo(startX, startY);
        const gradient = ctx.createLinearGradient(0, planeY, 0, startY);
        gradient.addColorStop(0, 'rgba(255, 51, 102, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 51, 102, 0.0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        // Draw Red Propeller Airplane
        ctx.save();
        ctx.translate(planeX, planeY);
        ctx.rotate(-0.15 - progress * 0.2);

        // Plane Body
        ctx.fillStyle = '#E50914';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#b80710';
        ctx.beginPath();
        ctx.moveTo(-6, -14);
        ctx.lineTo(6, -2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-10, -6);
        ctx.fill();

        // Propeller blur
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(24, 0, 3, 12, Math.sin(t * 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, multiplier]);

  // Socket IO Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('aviator_state', (data: any) => {
      setGameState(data.round.state);
      setMultiplier(data.round.currentMultiplier || 1.00);
      setHistory(data.history || []);
      setLiveBets(data.bets || []);
      if (data.round.serverSeedHash) setServerSeedHash(data.round.serverSeedHash);
    });

    socket.on('aviator_countdown', (data: { seconds: number }) => {
      setGameState('BETTING');
      setCountdown(data.seconds);
      setCashedOut1(false);
      setCashoutWin1(null);
      setHasBet1(false);
      setMyBetId1(null);
    });

    socket.on('aviator_flight_start', (data: any) => {
      setGameState('FLYING');
      setMultiplier(1.00);
      if (data.serverSeedHash) setServerSeedHash(data.serverSeedHash);
    });

    socket.on('aviator_tick', (data: { multiplier: number }) => {
      setGameState('FLYING');
      setMultiplier(data.multiplier);
    });

    socket.on('aviator_crashed', (data: { crashMultiplier: number; history: number[]; bets: any[] }) => {
      setGameState('CRASHED');
      setMultiplier(data.crashMultiplier);
      setHistory(data.history);
      setLiveBets(data.bets || []);
      setHasBet1(false);
      setMyBetId1(null);
      onRefreshWallet();
    });

    socket.on('aviator_bet_confirmed', (bet: AviatorLiveBet) => {
      setLiveBets((prev) => [bet, ...prev]);
      if (bet.id) {
        setMyBetId1(bet.id);
      }
    });

    socket.on('aviator_bet_cashed_out', (bet: AviatorLiveBet) => {
      setLiveBets((prev) => prev.map((b) => (b.id === bet.id ? bet : b)));
      if (bet.id === myBetId1 || (currentUser?.id && bet.userId === currentUser.id)) {
        setCashedOut1(true);
        setCashoutWin1(bet.payout);
        onRefreshWallet();
      }
    });

    socket.on('aviator_cashout_success', (bet: any) => {
      setCashedOut1(true);
      setCashoutWin1(bet.payout);
      onRefreshWallet();
    });

    socket.on('aviator_error', (data: { message: string }) => {
      console.warn('Aviator server notice:', data?.message);
    });

    return () => {
      socket.off('aviator_state');
      socket.off('aviator_countdown');
      socket.off('aviator_flight_start');
      socket.off('aviator_tick');
      socket.off('aviator_crashed');
      socket.off('aviator_bet_confirmed');
      socket.off('aviator_bet_cashed_out');
      socket.off('aviator_cashout_success');
      socket.off('aviator_error');
    };
  }, [socket, onRefreshWallet, myBetId1, currentUser?.id]);

  // Handle Bet 1 Placement
  const handlePlaceBet1 = () => {
    if (!socket || hasBet1) return;
    if (wallet.availableBalance < stake1) {
      alert(`Insufficient balance. You need ${stake1} ETB.`);
      return;
    }

    setHasBet1(true);
    setCashedOut1(false);
    setCashoutWin1(null);
    socket.emit('aviator_place_bet', {
      userId: currentUser?.id,
      username: currentUser?.username || currentUser?.firstName || 'Player',
      stake: stake1,
      autoCashout: isAutoCashout1 ? parseFloat(autoCashout1) : undefined
    });
  };

  // Handle Manual Cashout 1
  const handleCashout1 = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!socket || !hasBet1 || cashedOut1 || gameState !== 'FLYING') return;

    // Optimistically record cashout state
    setCashedOut1(true);
    setCashoutWin1(stake1 * multiplier);

    socket.emit('aviator_cash_out', {
      betId: myBetId1 || 'active',
      userId: currentUser?.id,
      multiplier
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto">
      {/* Top Recent Multipliers History Bar */}
      <div className="bg-[#121824] border border-[#1d273a] rounded-2xl p-2.5 flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 shrink-0 pl-1">
          <History className="w-3.5 h-3.5 text-[#00E676]" />
          <span>{language === 'am' ? 'የቅርብ ውጤቶች:' : 'Recent:'}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {history.map((val, idx) => {
            const isHigh = val >= 2.0;
            const isJackpot = val >= 10.0;
            return (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-tight shrink-0 transition-all ${
                  isJackpot
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-400/20'
                    : isHigh
                    ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                    : 'bg-[#1b2434] text-gray-300 border border-[#27344a]'
                }`}
              >
                {val.toFixed(2)}x
              </span>
            );
          })}
        </div>
        <button
          onClick={() => setShowProvablyFair(true)}
          className="text-gray-400 hover:text-[#00E676] shrink-0 pr-1 transition-colors"
          title="Provably Fair Cryptographic Verification"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Main Game Stage + Live Bets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas & Multiplier Screen (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative w-full h-[320px] sm:h-[400px] bg-gradient-to-b from-[#0b0e14] via-[#101622] to-[#0d131e] border border-[#1e283b] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {/* HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Central Multiplier / Status Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center select-none pointer-events-none">
              {gameState === 'BETTING' && (
                <div className="flex flex-col items-center gap-2 animate-soft-pulse">
                  <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                    <Plane className="w-8 h-8 animate-bounce" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {language === 'am' ? 'ቀጣዩ በረራ በ...' : 'WAITING FOR NEXT ROUND'}
                  </span>
                  <div className="w-48 h-2 bg-[#1c2637] rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-[#00E676] transition-all duration-1000"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-400">{countdown}s</span>
                </div>
              )}

              {gameState === 'FLYING' && (
                <div className="flex flex-col items-center">
                  <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
              )}

              {gameState === 'CRASHED' && (
                <div className="flex flex-col items-center animate-shake">
                  <span className="text-xl sm:text-2xl font-black text-red-500 tracking-wider uppercase mb-1">
                    FLEW AWAY!
                  </span>
                  <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
              )}
            </div>

            {/* In-game Win Toast */}
            {cashedOut1 && cashoutWin1 && (
              <div className="absolute top-6 z-20 px-6 py-2.5 rounded-2xl bg-[#00E676] text-black font-black text-sm tracking-wide shadow-xl shadow-[#00E676]/40 flex items-center gap-2 animate-bounce">
                <span>YOU WON! +{cashoutWin1.toFixed(2)} ETB</span>
              </div>
            )}
          </div>

          {/* Bet Controls (Responsive Grid) */}
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
            {/* Stake Quick Buttons */}
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">
                  {language === 'am' ? 'መወራረጃ (ብር):' : 'Bet Amount (ETB):'}
                </span>
                <span className="text-xs font-semibold text-gray-400 font-mono">
                  Balance: {wallet.availableBalance.toFixed(2)} ETB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStake1(Math.max(10, stake1 - 10))}
                  disabled={hasBet1}
                  className="w-10 h-10 rounded-xl bg-[#1a2333] hover:bg-[#232f45] border border-[#2b3a54] text-white font-black text-lg disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  value={stake1}
                  onChange={(e) => setStake1(Math.max(10, Number(e.target.value)))}
                  disabled={hasBet1}
                  className="w-full h-10 rounded-xl bg-[#0b0e14] border border-[#222e42] px-3 font-mono font-bold text-center text-white focus:outline-none focus:border-[#00E676] text-base"
                />
                <button
                  onClick={() => setStake1(stake1 + 10)}
                  disabled={hasBet1}
                  className="w-10 h-10 rounded-xl bg-[#1a2333] hover:bg-[#232f45] border border-[#2b3a54] text-white font-black text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
              {/* Quick Chips */}
              <div className="flex items-center gap-1.5 mt-1">
                {[10, 20, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => setStake1(val)}
                    disabled={hasBet1}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      stake1 === val
                        ? 'bg-[#00E676]/20 border border-[#00E676] text-[#00E676]'
                        : 'bg-[#182130] text-gray-300 hover:bg-[#202c40] border border-[#243147]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Cashout & Action Button */}
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoCashout1}
                    onChange={(e) => setIsAutoCashout1(e.target.checked)}
                    className="accent-[#00E676] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Auto Cash Out</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={autoCashout1}
                    onChange={(e) => setAutoCashout1(e.target.value)}
                    disabled={!isAutoCashout1 || hasBet1}
                    className="w-16 h-7 rounded-lg bg-[#0b0e14] border border-[#222e42] px-2 text-xs font-mono font-bold text-center text-white disabled:opacity-40"
                  />
                  <span className="text-xs text-gray-400 font-bold">x</span>
                </div>
              </div>

              {/* Main BET / CASH OUT Button */}
              {!hasBet1 ? (
                <button
                  onClick={handlePlaceBet1}
                  disabled={gameState !== 'BETTING'}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black text-lg tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <Plane className="w-5 h-5 fill-black" />
                  <span>BET {stake1} ETB</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCashout1}
                  onTouchEnd={handleCashout1}
                  disabled={cashedOut1 || gameState !== 'FLYING'}
                  className={`w-full h-14 rounded-2xl text-black font-black text-lg tracking-wider uppercase shadow-xl transition-all transform active:scale-95 flex flex-col items-center justify-center leading-tight ${
                    cashedOut1
                      ? 'bg-gradient-to-r from-emerald-500 to-[#00E676] shadow-[#00E676]/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 shadow-amber-400/30 active:brightness-110 cursor-pointer'
                  } disabled:opacity-50`}
                >
                  <span className="text-xs font-extrabold uppercase">
                    {cashedOut1 ? '✓ CASHED OUT' : 'CASH OUT'}
                  </span>
                  <span className="text-xl font-black">
                    {cashedOut1
                      ? `+${(cashoutWin1 || stake1 * multiplier).toFixed(2)} ETB`
                      : `${(stake1 * multiplier).toFixed(2)} ETB`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Multiplayer Bets Feed (1 Col) */}
        <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-4 flex flex-col h-[400px] lg:h-[500px]">
          <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00E676]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                All Bets ({liveBets.length + 14})
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {/* Live active bets */}
            {liveBets.map((bet) => (
              <div
                key={bet.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                  bet.cashedOut
                    ? 'bg-[#00E676]/10 border-[#00E676]/30'
                    : 'bg-[#161f2e] border-[#222e42]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#202c40] text-gray-300 font-bold flex items-center justify-center text-[10px]">
                    {bet.avatarLetter}
                  </div>
                  <span className="font-semibold text-gray-300">{bet.username}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-gray-400">{bet.stake} Br</span>
                  {bet.cashedOut ? (
                    <span className="font-extrabold text-[#00E676] flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {bet.payout.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">•</span>
                  )}
                </div>
              </div>
            ))}

            {/* Simulated Live Community Bets */}
            {[
              { name: 'Besu**', stake: 50, mult: 2.15, won: true },
              { name: 'dave**', stake: 100, mult: 1.55, won: true },
              { name: 'Abdu**', stake: 20, mult: 0, won: false },
              { name: 'Gez**', stake: 200, mult: 3.40, won: true },
              { name: 'Esma**', stake: 10, mult: 0, won: false }
            ].map((sim, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-[#161f2e] border border-[#222e42] text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#202c40] text-gray-400 font-bold flex items-center justify-center text-[10px]">
                    {sim.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-400">{sim.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-gray-400">{sim.stake} Br</span>
                  {sim.won && gameState !== 'BETTING' ? (
                    <span className="font-extrabold text-[#00E676]">
                      {(sim.stake * sim.mult).toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-500">•</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provably Fair Modal */}
      {showProvablyFair && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                <h3 className="font-extrabold text-base text-white">Provably Fair Verification</h3>
              </div>
              <button
                onClick={() => setShowProvablyFair(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every flight multiplier in Edil Bet is cryptographically predetermined using SHA-256 HMAC before the round takes off. No administrator or player can alter the crash point once the flight starts.
            </p>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-400">Current Round Server Seed (SHA-256):</span>
              <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-[#1e283b] text-[11px] font-mono text-[#00E676] break-all select-all">
                {serverSeedHash}
              </div>
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
