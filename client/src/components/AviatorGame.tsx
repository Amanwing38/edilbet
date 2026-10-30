import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Minus, Plus, Menu, ChevronLeft, ShieldCheck, Check } from 'lucide-react';
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
  onBack?: () => void;
}

interface BetPanelState {
  stake: number;
  mode: 'bet' | 'auto';
  autoCashout: string;
  isAutoCashout: boolean;
  status: 'idle' | 'waiting' | 'in_flight' | 'cashed_out';
  betId: string | null;
  cashoutWin: number | null;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  socket,
  wallet,
  onRefreshWallet,
  language,
  currentUser,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State
  const [gameState, setGameState] = useState<'BETTING' | 'FLYING' | 'CRASHED'>('BETTING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>([
    1.62, 3.29, 1.05, 14.60, 8.66, 1.79, 1.21, 1.00, 9.42, 2.15, 1.03, 5.40, 1.82, 12.50
  ]);
  const [liveBets, setLiveBets] = useState<AviatorLiveBet[]>([]);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [serverSeedHash, setServerSeedHash] = useState('a9b8c7d6e5f4...sha256');

  // Bottom table tab
  const [bottomTab, setBottomTab] = useState<'all' | 'previous' | 'top'>('all');
  const [panel2Visible, setPanel2Visible] = useState(true);

  // Panel 1 State
  const [p1, setP1] = useState<BetPanelState>({
    stake: 4.00,
    mode: 'bet',
    autoCashout: '2.00',
    isAutoCashout: false,
    status: 'idle',
    betId: null,
    cashoutWin: null
  });

  // Panel 2 State
  const [p2, setP2] = useState<BetPanelState>({
    stake: 4.00,
    mode: 'bet',
    autoCashout: '2.00',
    isAutoCashout: false,
    status: 'idle',
    betId: null,
    cashoutWin: null
  });

  // Ref for access inside animation / socket callbacks
  const stateRef = useRef({
    p1,
    p2,
    gameState,
    multiplier,
    wallet
  });

  useEffect(() => {
    stateRef.current = { p1, p2, gameState, multiplier, wallet };
  });

  // Socket listener setup
  useEffect(() => {
    if (!socket) return;

    const handleAviatorState = (data: any) => {
      if (data.round) {
        setGameState(data.round.state);
        setMultiplier(data.round.currentMultiplier || 1.00);
        setCountdown(data.round.bettingCountdownSec ?? 5);
        if (data.round.serverSeedHash) setServerSeedHash(data.round.serverSeedHash);
      }
      if (data.history && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    };

    const handleCountdown = (data: { seconds: number }) => {
      setGameState('BETTING');
      setCountdown(data.seconds);

      // When new countdown starts, transition queued/waiting bets to confirmed
      setP1((prev) => {
        if (prev.status === 'cashed_out') return { ...prev, status: 'idle', betId: null, cashoutWin: null };
        return prev;
      });
      setP2((prev) => {
        if (prev.status === 'cashed_out') return { ...prev, status: 'idle', betId: null, cashoutWin: null };
        return prev;
      });
    };

    const handleFlightStart = () => {
      setGameState('FLYING');
      setMultiplier(1.00);

      // Transition waiting bets into active in-flight bets
      setP1((prev) => {
        if (prev.status === 'waiting') {
          return { ...prev, status: 'in_flight' };
        }
        return prev;
      });
      setP2((prev) => {
        if (prev.status === 'waiting') {
          return { ...prev, status: 'in_flight' };
        }
        return prev;
      });
    };

    const handleTick = (data: { multiplier: number }) => {
      setMultiplier(data.multiplier);

      // Check client-side auto cashout
      const s = stateRef.current;
      if (s.p1.status === 'in_flight' && s.p1.isAutoCashout) {
        const target = parseFloat(s.p1.autoCashout);
        if (target && data.multiplier >= target) {
          executeCashOut(1);
        }
      }
      if (s.p2.status === 'in_flight' && s.p2.isAutoCashout) {
        const target = parseFloat(s.p2.autoCashout);
        if (target && data.multiplier >= target) {
          executeCashOut(2);
        }
      }
    };

    const handleCrashed = (data: { crashMultiplier: number; history?: number[] }) => {
      setGameState('CRASHED');
      setMultiplier(data.crashMultiplier);

      if (data.history) {
        setHistory(data.history);
      } else {
        setHistory((prev) => [data.crashMultiplier, ...prev.slice(0, 19)]);
      }

      // Reset bets that failed to cash out
      setP1((prev) => {
        if (prev.status === 'in_flight') {
          return { ...prev, status: 'idle', betId: null };
        }
        return prev;
      });
      setP2((prev) => {
        if (prev.status === 'in_flight') {
          return { ...prev, status: 'idle', betId: null };
        }
        return prev;
      });

      onRefreshWallet();
    };

    const handleBetConfirmed = (data: any) => {
      const slot = data.slot || 1;
      if (slot === 1) {
        setP1((prev) => ({
          ...prev,
          betId: data.id || 'b1',
          status: stateRef.current.gameState === 'FLYING' ? 'waiting' : 'waiting'
        }));
      } else {
        setP2((prev) => ({
          ...prev,
          betId: data.id || 'b2',
          status: stateRef.current.gameState === 'FLYING' ? 'waiting' : 'waiting'
        }));
      }
      onRefreshWallet();
    };

    const handleBetCancelled = (data: any) => {
      const slot = data.slot || 1;
      if (slot === 1) {
        setP1((prev) => ({ ...prev, status: 'idle', betId: null }));
      } else {
        setP2((prev) => ({ ...prev, status: 'idle', betId: null }));
      }
      onRefreshWallet();
    };

    const handleCashoutSuccess = (data: any) => {
      const slot = data.slot || 1;
      if (slot === 1) {
        setP1((prev) => ({
          ...prev,
          status: 'cashed_out',
          cashoutWin: data.payout
        }));
      } else {
        setP2((prev) => ({
          ...prev,
          status: 'cashed_out',
          cashoutWin: data.payout
        }));
      }
      onRefreshWallet();
    };

    const handleLiveBets = (bets: AviatorLiveBet[]) => {
      setLiveBets(bets);
    };

    socket.on('aviator_state', handleAviatorState);
    socket.on('aviator_countdown', handleCountdown);
    socket.on('aviator_flight_start', handleFlightStart);
    socket.on('aviator_tick', handleTick);
    socket.on('aviator_crashed', handleCrashed);
    socket.on('aviator_bet_confirmed', handleBetConfirmed);
    socket.on('aviator_bet_cancelled_success', handleBetCancelled);
    socket.on('aviator_cashout_success', handleCashoutSuccess);
    socket.on('aviator_live_bets', handleLiveBets);

    return () => {
      socket.off('aviator_state', handleAviatorState);
      socket.off('aviator_countdown', handleCountdown);
      socket.off('aviator_flight_start', handleFlightStart);
      socket.off('aviator_tick', handleTick);
      socket.off('aviator_crashed', handleCrashed);
      socket.off('aviator_bet_confirmed', handleBetConfirmed);
      socket.off('aviator_bet_cancelled_success', handleBetCancelled);
      socket.off('aviator_cashout_success', handleCashoutSuccess);
      socket.off('aviator_live_bets', handleLiveBets);
    };
  }, [socket, onRefreshWallet]);

  // Actions
  const handleBetClick = (panelNum: 1 | 2) => {
    const p = panelNum === 1 ? p1 : p2;

    if (p.status === 'idle') {
      // Place bet (or queue for next round)
      if (wallet.availableBalance < p.stake) {
        alert(language === 'am' ? 'በቂ ሂሳብ የለም። እባክዎ ገንዘብ ያስገቡ!' : 'Insufficient balance! Please deposit.');
        return;
      }

      // Optimistically update status to waiting (red cancel button)
      if (panelNum === 1) {
        setP1((prev) => ({ ...prev, status: 'waiting' }));
      } else {
        setP2((prev) => ({ ...prev, status: 'waiting' }));
      }

      socket?.emit('aviator_place_bet', {
        userId: currentUser?.id,
        username: currentUser?.username,
        stake: p.stake,
        autoCashout: p.isAutoCashout ? parseFloat(p.autoCashout) : undefined,
        slot: panelNum
      });
    } else if (p.status === 'waiting') {
      // Cancel bet
      socket?.emit('aviator_cancel_bet', {
        betId: p.betId,
        userId: currentUser?.id,
        slot: panelNum
      });
      if (panelNum === 1) {
        setP1((prev) => ({ ...prev, status: 'idle', betId: null }));
      } else {
        setP2((prev) => ({ ...prev, status: 'idle', betId: null }));
      }
    } else if (p.status === 'in_flight') {
      // Cash out
      executeCashOut(panelNum);
    }
  };

  const executeCashOut = (panelNum: 1 | 2) => {
    const p = panelNum === 1 ? stateRef.current.p1 : stateRef.current.p2;
    if (p.status !== 'in_flight') return;

    const currentMult = stateRef.current.multiplier;
    const winAmount = p.stake * currentMult;

    if (panelNum === 1) {
      setP1((prev) => ({ ...prev, status: 'cashed_out', cashoutWin: winAmount }));
    } else {
      setP2((prev) => ({ ...prev, status: 'cashed_out', cashoutWin: winAmount }));
    }

    socket?.emit('aviator_cash_out', {
      betId: p.betId || `bet_${panelNum}`,
      multiplier: currentMult,
      userId: currentUser?.id,
      slot: panelNum
    });

    onRefreshWallet();
  };

  // Stepper stake adjusters
  const changeStake = (panelNum: 1 | 2, delta: number) => {
    const updater = (prev: BetPanelState) => {
      const nextStake = Math.max(1, Math.min(10000, Number((prev.stake + delta).toFixed(2))));
      return { ...prev, stake: nextStake };
    };
    if (panelNum === 1) setP1(updater);
    else setP2(updater);
  };

  const setExactStake = (panelNum: 1 | 2, val: number) => {
    const updater = (prev: BetPanelState) => ({ ...prev, stake: val });
    if (panelNum === 1) setP1(updater);
    else setP2(updater);
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Dark Sunburst radiating beams background
      ctx.save();
      const cx = w / 2;
      const cy = h / 2;
      const numRays = 32;
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < numRays; i++) {
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          const angle1 = (i * 2 * Math.PI) / numRays;
          const angle2 = ((i + 1) * 2 * Math.PI) / numRays;
          ctx.arc(cx, cy, Math.max(w, h) * 1.2, angle1, angle2);
          ctx.closePath();
          ctx.fillStyle = '#060709';
          ctx.fill();
        }
      }

      // Radial blue glow in center during flight
      if (gameState === 'FLYING') {
        const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.55);
        glow.addColorStop(0, 'rgba(14, 116, 144, 0.40)');
        glow.addColorStop(0.5, 'rgba(6, 78, 110, 0.15)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();

      // 2. Flight Trajectory or Waiting state
      if (gameState === 'FLYING') {
        const startX = 25;
        const startY = h - 25;
        const maxProgress = Math.min(1, (multiplier - 1) / 7.5);

        // Target coordinates of plane
        const planeX = startX + maxProgress * (w - 110);
        const planeY = startY - Math.pow(maxProgress, 0.72) * (h - 80);

        // Control point for smooth curve
        const cpX = startX + (planeX - startX) * 0.45;
        const cpY = startY;

        // Area under curve (Red translucent polygon)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
        ctx.lineTo(planeX, startY);
        ctx.lineTo(startX, startY);
        ctx.closePath();

        const areaGrad = ctx.createLinearGradient(0, planeY, 0, startY);
        areaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.40)');
        areaGrad.addColorStop(1, 'rgba(225, 29, 72, 0.02)');
        ctx.fillStyle = areaGrad;
        ctx.fill();
        ctx.restore();

        // Glowing red stroke line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // Red Airplane at (planeX, planeY)
        ctx.save();
        ctx.translate(planeX, planeY);
        const pitch = -0.25 + Math.sin(frame * 0.1) * 0.03;
        ctx.rotate(pitch);

        // Fuselage
        ctx.fillStyle = '#e11d48';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.quadraticCurveTo(8, -6, -18, -4);
        ctx.lineTo(-24, -12);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-24, 12);
        ctx.lineTo(-18, 4);
        ctx.quadraticCurveTo(8, 6, 18, 0);
        ctx.closePath();
        ctx.fill();

        // Main Wing
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.moveTo(2, -18);
        ctx.lineTo(10, 0);
        ctx.lineTo(2, 18);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();

        // Cockpit window
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(4, -2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spinning Propeller
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        const propAngle = frame * 0.8;
        ctx.beginPath();
        ctx.moveTo(18 + Math.cos(propAngle) * 8, Math.sin(propAngle) * 8);
        ctx.lineTo(18 - Math.cos(propAngle) * 8, -Math.sin(propAngle) * 8);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, multiplier]);

  // Color helper for history multipliers
  const getBadgeStyle = (val: number) => {
    if (val < 2.00) {
      return 'bg-[#121c2b] text-[#38bdf8] border-[#1e3452]';
    } else if (val < 10.00) {
      return 'bg-[#221633] text-[#c084fc] border-[#3f2560]';
    } else {
      return 'bg-[#331124] text-[#f43f5e] border-[#591d3e] font-black';
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto text-white select-none pb-4">
      {/* 1. Aviator Sub-Header */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#0e1017]">
        {/* Aviator Logo */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black italic tracking-tighter text-[#e50914] drop-shadow-sm font-sans">
            Aviator
          </span>
        </div>

        {/* Balance Display & Menu */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-tight text-[#00E676] font-mono">
            {wallet.availableBalance.toFixed(2)} ETB
          </span>
          <button
            onClick={() => setShowProvablyFair(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* 2. Multiplier History Row */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#090b0f] overflow-x-auto no-scrollbar border-y border-[#181a24]">
        {history.slice(0, 15).map((val, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border whitespace-nowrap transition-transform ${getBadgeStyle(
              val
            )}`}
          >
            {val.toFixed(2)}x
          </span>
        ))}
        <button
          onClick={() => setShowProvablyFair(true)}
          className="px-2 py-0.5 rounded-full bg-[#161822] text-gray-400 text-xs font-bold border border-[#242738] shrink-0"
        >
          ...
        </button>
      </div>

      {/* 3. Game Stage (Canvas Area) */}
      <div className="relative w-full aspect-[16/10] bg-black rounded-2xl overflow-hidden border border-[#1b1e2a] my-2 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={400}
          height={250}
          className="w-full h-full block"
        />

        {/* State A: WAITING / BETTING (Countdown / Idle Banner) */}
        {gameState === 'BETTING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
            {/* UFC & Aviator Official Partners */}
            <div className="flex flex-col items-center gap-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black italic tracking-wider text-[#e50914]">
                  UFC
                </span>
                <span className="text-gray-500 font-bold">|</span>
                <span className="text-sm font-black italic text-[#e50914] tracking-tight">
                  Aviator
                </span>
              </div>
              <div className="h-0.5 w-24 bg-[#e50914] rounded-full" />
              <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                Official Partners
              </span>
            </div>

            {/* Spribe Official Game Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#142318]/80 border border-[#22c55e]/50 backdrop-blur-sm mt-1 shadow-md">
              <div className="w-5 h-5 rounded-full bg-[#22c55e] text-black font-black text-[10px] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#22c55e] leading-tight">
                  SPRIBE Official Game
                </span>
                <span className="text-[8px] text-gray-400 leading-tight">
                  Since 2018
                </span>
              </div>
            </div>

            {/* Progress Countdown Bar */}
            <div className="absolute bottom-4 left-6 right-6 flex flex-col items-center gap-1">
              <div className="w-full h-1.5 bg-[#181a24] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 font-mono">
                {countdown}s
              </span>
            </div>
          </div>
        )}

        {/* State B: FLYING (Active Multiplier HUD) */}
        {gameState === 'FLYING' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {multiplier.toFixed(2)}x
            </span>
          </div>
        )}

        {/* State C: CRASHED (Flew Away HUD) */}
        {gameState === 'CRASHED' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[1px]">
            <span className="text-base font-black tracking-widest text-[#ef4444] uppercase mb-1">
              FLEW AWAY!
            </span>
            <span className="text-5xl font-black text-[#ef4444] font-mono">
              {multiplier.toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* 4. Dual Bet Control Cards */}
      <div className="flex flex-col gap-2 w-full">
        {/* PANEL 1 */}
        <div className="bg-[#13151b] border border-[#202430] rounded-2xl p-2.5 flex flex-col gap-2 shadow-lg">
          {/* Top Switcher: Bet | Auto */}
          <div className="flex items-center justify-between">
            <div className="flex bg-[#1b1d26] rounded-full p-0.5 border border-[#252838]">
              <button
                onClick={() => setP1((prev) => ({ ...prev, mode: 'bet' }))}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  p1.mode === 'bet' ? 'bg-[#2b2e3b] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bet
              </button>
              <button
                onClick={() => setP1((prev) => ({ ...prev, mode: 'auto' }))}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  p1.mode === 'auto' ? 'bg-[#2b2e3b] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Controls + Big Action Button */}
          <div className="flex items-stretch gap-2.5">
            {/* Left Column: Stepper & 2x2 Chips */}
            <div className="flex flex-col gap-2 w-[46%] shrink-0">
              {/* Stepper */}
              <div className="flex items-center justify-between bg-[#191b24] border border-[#252836] rounded-xl px-2 py-1.5">
                <button
                  onClick={() => changeStake(1, -2)}
                  className="w-7 h-7 rounded-full bg-[#202330] hover:bg-[#2b2f40] flex items-center justify-center text-gray-300 font-bold active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-black text-white text-base">
                  {p1.stake.toFixed(2)}
                </span>
                <button
                  onClick={() => changeStake(1, 2)}
                  className="w-7 h-7 rounded-full bg-[#202330] hover:bg-[#2b2f40] flex items-center justify-center text-gray-300 font-bold active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2x2 Quick Chips */}
              <div className="grid grid-cols-2 gap-1.5">
                {[4, 10, 40, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => setExactStake(1, val)}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                      p1.stake === val
                        ? 'bg-[#262938] text-white border-[#383d52]'
                        : 'bg-[#181a24] text-gray-400 border-[#222432] hover:bg-[#202330]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Action Button */}
            <div className="flex-1 flex">
              {/* STATE A: NOT BET (GREEN) */}
              {p1.status === 'idle' && (
                <button
                  onClick={() => handleBetClick(1)}
                  className="w-full rounded-2xl bg-[#28a745] hover:bg-[#218838] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-[#28a745]/20 p-2"
                >
                  <span className="text-xl font-black text-white tracking-tight">Bet</span>
                  <span className="text-sm font-bold text-white/90 font-mono mt-0.5">
                    {p1.stake.toFixed(2)} ETB
                  </span>
                </button>
              )}

              {/* STATE B: WAITING / CANCEL (RED) */}
              {p1.status === 'waiting' && (
                <button
                  onClick={() => handleBetClick(1)}
                  className="w-full rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-red-600/25 p-2"
                >
                  <span className="text-xl font-black text-white tracking-tight">Cancel</span>
                  <span className="text-[11px] font-semibold text-white/95 mt-0.5">
                    Waiting for next round
                  </span>
                </button>
              )}

              {/* STATE C: IN FLIGHT / CASHOUT (GOLD/AMBER) */}
              {p1.status === 'in_flight' && (
                <button
                  onClick={() => handleBetClick(1)}
                  className="w-full rounded-2xl bg-[#d97706] hover:bg-[#b45309] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 p-2"
                >
                  <span className="text-xl font-black text-white tracking-tight">Cash Out</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 tracking-wide">
                    {(p1.stake * multiplier).toFixed(2)} ETB
                  </span>
                </button>
              )}

              {/* STATE D: CASHED OUT SUCCESS */}
              {p1.status === 'cashed_out' && (
                <div className="w-full rounded-2xl bg-[#14291e] border border-[#22c55e]/40 flex flex-col items-center justify-center p-2">
                  <span className="text-xs font-bold text-[#22c55e]">Cashed Out</span>
                  <span className="text-lg font-black text-white font-mono">
                    +{p1.cashoutWin?.toFixed(2)} ETB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Auto Mode Controls */}
          {p1.mode === 'auto' && (
            <div className="flex items-center justify-between pt-2 border-t border-[#1c1f2b] text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={p1.isAutoCashout}
                  onChange={(e) => setP1((prev) => ({ ...prev, isAutoCashout: e.target.checked }))}
                  className="rounded text-[#28a745] focus:ring-0 w-4 h-4 bg-[#1e202a]"
                />
                <span>Auto Cash Out</span>
              </label>
              <div className="flex items-center gap-1 bg-[#191b24] px-2 py-1 rounded-lg border border-[#252836]">
                <input
                  type="text"
                  value={p1.autoCashout}
                  onChange={(e) => setP1((prev) => ({ ...prev, autoCashout: e.target.value }))}
                  className="w-12 bg-transparent text-right font-mono font-bold text-white outline-none"
                />
                <span className="text-gray-400 font-bold">x</span>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2 (Dual Order Support with Collapse Toggle) */}
        {panel2Visible ? (
          <div className="bg-[#13151b] border border-[#202430] rounded-2xl p-2.5 flex flex-col gap-2 shadow-lg">
            {/* Top Switcher: Bet | Auto + Collapse Button */}
            <div className="flex items-center justify-between">
              <div className="flex bg-[#1b1d26] rounded-full p-0.5 border border-[#252838]">
                <button
                  onClick={() => setP2((prev) => ({ ...prev, mode: 'bet' }))}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    p2.mode === 'bet' ? 'bg-[#2b2e3b] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Bet
                </button>
                <button
                  onClick={() => setP2((prev) => ({ ...prev, mode: 'auto' }))}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    p2.mode === 'auto' ? 'bg-[#2b2e3b] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Collapse/Hide Panel 2 Button */}
              <button
                onClick={() => setPanel2Visible(false)}
                className="w-7 h-7 rounded-lg bg-[#1a1c26] hover:bg-[#252838] border border-[#272a3a] flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title="Close Second Bet Panel"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Controls + Big Action Button */}
            <div className="flex items-stretch gap-2.5">
              {/* Left Column: Stepper & 2x2 Chips */}
              <div className="flex flex-col gap-2 w-[46%] shrink-0">
                {/* Stepper */}
                <div className="flex items-center justify-between bg-[#191b24] border border-[#252836] rounded-xl px-2 py-1.5">
                  <button
                    onClick={() => changeStake(2, -2)}
                    className="w-7 h-7 rounded-full bg-[#202330] hover:bg-[#2b2f40] flex items-center justify-center text-gray-300 font-bold active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-black text-white text-base">
                    {p2.stake.toFixed(2)}
                  </span>
                  <button
                    onClick={() => changeStake(2, 2)}
                    className="w-7 h-7 rounded-full bg-[#202330] hover:bg-[#2b2f40] flex items-center justify-center text-gray-300 font-bold active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2x2 Quick Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[4, 10, 40, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setExactStake(2, val)}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                        p2.stake === val
                          ? 'bg-[#262938] text-white border-[#383d52]'
                          : 'bg-[#181a24] text-gray-400 border-[#222432] hover:bg-[#202330]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Dynamic Action Button */}
              <div className="flex-1 flex">
                {/* STATE A: NOT BET (GREEN) */}
                {p2.status === 'idle' && (
                  <button
                    onClick={() => handleBetClick(2)}
                    className="w-full rounded-2xl bg-[#28a745] hover:bg-[#218838] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-[#28a745]/20 p-2"
                  >
                    <span className="text-xl font-black text-white tracking-tight">Bet</span>
                    <span className="text-sm font-bold text-white/90 font-mono mt-0.5">
                      {p2.stake.toFixed(2)} ETB
                    </span>
                  </button>
                )}

                {/* STATE B: WAITING / CANCEL (RED) */}
                {p2.status === 'waiting' && (
                  <button
                    onClick={() => handleBetClick(2)}
                    className="w-full rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-red-600/25 p-2"
                  >
                    <span className="text-xl font-black text-white tracking-tight">Cancel</span>
                    <span className="text-[11px] font-semibold text-white/95 mt-0.5">
                      Waiting for next round
                    </span>
                  </button>
                )}

                {/* STATE C: IN FLIGHT / CASHOUT (GOLD/AMBER) */}
                {p2.status === 'in_flight' && (
                  <button
                    onClick={() => handleBetClick(2)}
                    className="w-full rounded-2xl bg-[#d97706] hover:bg-[#b45309] active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 p-2"
                  >
                    <span className="text-xl font-black text-white tracking-tight">Cash Out</span>
                    <span className="text-sm font-black text-white font-mono mt-0.5 tracking-wide">
                      {(p2.stake * multiplier).toFixed(2)} ETB
                    </span>
                  </button>
                )}

                {/* STATE D: CASHED OUT SUCCESS */}
                {p2.status === 'cashed_out' && (
                  <div className="w-full rounded-2xl bg-[#14291e] border border-[#22c55e]/40 flex flex-col items-center justify-center p-2">
                    <span className="text-xs font-bold text-[#22c55e]">Cashed Out</span>
                    <span className="text-lg font-black text-white font-mono">
                      +{p2.cashoutWin?.toFixed(2)} ETB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Auto Mode Controls */}
            {p2.mode === 'auto' && (
              <div className="flex items-center justify-between pt-2 border-t border-[#1c1f2b] text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={p2.isAutoCashout}
                    onChange={(e) => setP2((prev) => ({ ...prev, isAutoCashout: e.target.checked }))}
                    className="rounded text-[#28a745] focus:ring-0 w-4 h-4 bg-[#1e202a]"
                  />
                  <span>Auto Cash Out</span>
                </label>
                <div className="flex items-center gap-1 bg-[#191b24] px-2 py-1 rounded-lg border border-[#252836]">
                  <input
                    type="text"
                    value={p2.autoCashout}
                    onChange={(e) => setP2((prev) => ({ ...prev, autoCashout: e.target.value }))}
                    className="w-12 bg-transparent text-right font-mono font-bold text-white outline-none"
                  />
                  <span className="text-gray-400 font-bold">x</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setPanel2Visible(true)}
            className="w-full py-2 rounded-xl bg-[#13151b] hover:bg-[#1a1c26] border border-dashed border-[#282c3c] text-xs font-bold text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#28a745]" />
            <span>Add Second Bet Panel</span>
          </button>
        )}
      </div>

      {/* 5. Bottom Social Feed: All Bets Table */}
      <div className="bg-[#101217] border border-[#1b1e28] rounded-2xl p-3 mt-2 flex flex-col gap-2.5">
        {/* Table Tabs */}
        <div className="flex items-center justify-between border-b border-[#1b1d28] pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBottomTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                bottomTab === 'all' ? 'bg-[#222533] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Bets
            </button>
            <button
              onClick={() => setBottomTab('previous')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                bottomTab === 'previous' ? 'bg-[#222533] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setBottomTab('top')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                bottomTab === 'top' ? 'bg-[#222533] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Top
            </button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider">ALL BETS</span>
            <span className="text-xs font-mono font-black text-gray-200">
              {920 + liveBets.length * 3}
            </span>
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="grid grid-cols-4 text-[10px] font-bold text-gray-500 uppercase px-1">
          <span>Player</span>
          <span className="text-center">Bet ETB</span>
          <span className="text-center">X</span>
          <span className="text-right">Win ETB</span>
        </div>

        {/* Bets Feed Rows */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
          {/* Active Player's Bet (if placed) */}
          {(p1.status !== 'idle' || p2.status !== 'idle') && (
            <div className="grid grid-cols-4 items-center p-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-xs">
              <span className="font-bold text-[#22c55e] truncate">
                {currentUser?.firstName || 'You'}
              </span>
              <span className="text-center font-mono font-bold text-white">
                {((p1.status !== 'idle' ? p1.stake : 0) + (p2.status !== 'idle' ? p2.stake : 0)).toFixed(2)}
              </span>
              <span className="text-center font-mono font-bold text-[#22c55e]">
                {gameState === 'FLYING' ? `${multiplier.toFixed(2)}x` : '-'}
              </span>
              <span className="text-right font-mono font-black text-[#22c55e]">
                {p1.status === 'cashed_out' || p2.status === 'cashed_out'
                  ? `${((p1.cashoutWin || 0) + (p2.cashoutWin || 0)).toFixed(2)}`
                  : gameState === 'FLYING'
                  ? `${(
                      (p1.status === 'in_flight' ? p1.stake * multiplier : 0) +
                      (p2.status === 'in_flight' ? p2.stake * multiplier : 0)
                    ).toFixed(2)}`
                  : '-'}
              </span>
            </div>
          )}

          {/* Real community bets from server */}
          {liveBets.map((bet) => (
            <div
              key={bet.id}
              className={`grid grid-cols-4 items-center p-2 rounded-xl text-xs transition-all border ${
                bet.cashedOut
                  ? 'bg-[#15241b] border-[#22c55e]/30'
                  : 'bg-[#14161e] border-[#1d202c]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-5 h-5 rounded-full bg-[#202330] text-gray-300 font-bold flex items-center justify-center text-[9px] shrink-0">
                  {bet.avatarLetter}
                </div>
                <span className="text-gray-300 truncate">{bet.username}</span>
              </div>
              <span className="text-center font-mono text-gray-300">
                {bet.stake.toFixed(2)}
              </span>
              <span className="text-center font-mono">
                {bet.cashedOut ? (
                  <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-bold text-[10px]">
                    {(bet.cashedOutAt || bet.multiplier || 1.0).toFixed(2)}x
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </span>
              <span className="text-right font-mono font-bold">
                {bet.cashedOut ? (
                  <span className="text-[#22c55e]">{bet.payout.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </span>
            </div>
          ))}

          {/* Realistic Community Simulated Stream */}
          {[
            { name: 'Besu**', stake: 50, cashoutAt: 1.45 },
            { name: 'dave**', stake: 100, cashoutAt: 1.85 },
            { name: 'Abebe**', stake: 25, cashoutAt: 2.30 },
            { name: 'Gezah**', stake: 200, cashoutAt: 1.25 },
            { name: 'Kalki**', stake: 40, cashoutAt: 3.10 },
            { name: 'Tedy**', stake: 10, cashoutAt: 1.15 }
          ].map((sim, i) => {
            const hasCashed = gameState === 'FLYING' && multiplier >= sim.cashoutAt;
            return (
              <div
                key={i}
                className={`grid grid-cols-4 items-center p-2 rounded-xl text-xs border ${
                  hasCashed
                    ? 'bg-[#142319] border-[#22c55e]/25 text-[#22c55e]'
                    : 'bg-[#14161e] border-[#1d202c] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-5 h-5 rounded-full bg-[#1e202c] text-gray-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                    {sim.name.charAt(0)}
                  </div>
                  <span className="truncate">{sim.name}</span>
                </div>
                <span className="text-center font-mono text-gray-300">
                  {sim.stake.toFixed(2)}
                </span>
                <span className="text-center font-mono">
                  {hasCashed ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-bold text-[10px]">
                      {sim.cashoutAt.toFixed(2)}x
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
                <span className="text-right font-mono font-bold">
                  {hasCashed ? (
                    <span className="text-[#22c55e]">
                      {(sim.stake * sim.cashoutAt).toFixed(2)}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Provably Fair Modal */}
      {showProvablyFair && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232738] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#232738] pb-3">
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
              Every round crash multiplier is predetermined with cryptographic SHA-256 before the round takes off. No player or administrator can modify the outcome.
            </p>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-400">Current Server Seed Hash (SHA-256):</span>
              <div className="p-2.5 rounded-xl bg-[#090a0f] border border-[#202434] text-[11px] font-mono text-[#00E676] break-all select-all">
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
