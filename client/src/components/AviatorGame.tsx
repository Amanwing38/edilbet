import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Plane, ShieldCheck, History, Users, ArrowUpRight, TrendingUp } from 'lucide-react';
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

  // Player Bet Panel 2 (Dual Order Support)
  const [stake2, setStake2] = useState(10);
  const [autoCashout2, setAutoCashout2] = useState<string>('1.50');
  const [isAutoCashout2, setIsAutoCashout2] = useState(false);
  const [hasBet2, setHasBet2] = useState(false);
  const [myBetId2, setMyBetId2] = useState<string | null>(null);
  const [cashedOut2, setCashedOut2] = useState(false);
  const [cashoutWin2, setCashoutWin2] = useState<number | null>(null);

  // Synchronized state ref for fast tick socket operations
  const stateRef = useRef({
    stake1,
    hasBet1,
    cashedOut1,
    isAutoCashout1,
    autoCashout1,
    myBetId1,
    stake2,
    hasBet2,
    cashedOut2,
    isAutoCashout2,
    autoCashout2,
    myBetId2,
    gameState,
    multiplier
  });

  useEffect(() => {
    stateRef.current = {
      stake1,
      hasBet1,
      cashedOut1,
      isAutoCashout1,
      autoCashout1,
      myBetId1,
      stake2,
      hasBet2,
      cashedOut2,
      isAutoCashout2,
      autoCashout2,
      myBetId2,
      gameState,
      multiplier
    };
  });

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

        // Animated Red Aviator Propeller Plane
        ctx.save();
        ctx.translate(planeX, planeY);
        const angle = -0.3 + Math.sin(t * 3) * 0.05;
        ctx.rotate(angle);

        // Plane Body
        ctx.fillStyle = '#E50914';
        ctx.shadowColor = '#FF3366';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(-20, -10);
        ctx.lineTo(-20, 10);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -22);
        ctx.lineTo(-2, -22);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fill();

        // Propeller blur
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(26, 0, 3, 14 + Math.sin(t * 20) * 3, 0, 0, Math.PI * 2);
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

      // Reset cashout statuses for new round
      setCashedOut1(false);
      setCashoutWin1(null);
      setHasBet1(false);
      setMyBetId1(null);

      setCashedOut2(false);
      setCashoutWin2(null);
      setHasBet2(false);
      setMyBetId2(null);
    });

    socket.on('aviator_flight_start', (data: any) => {
      setGameState('FLYING');
      setMultiplier(1.00);
      if (data.serverSeedHash) setServerSeedHash(data.serverSeedHash);
    });

    socket.on('aviator_tick', (data: { multiplier: number }) => {
      setGameState('FLYING');
      setMultiplier(data.multiplier);

      const st = stateRef.current;
      // Auto Cashout Panel 1
      if (
        st.isAutoCashout1 &&
        st.hasBet1 &&
        !st.cashedOut1 &&
        parseFloat(st.autoCashout1) > 1.0 &&
        data.multiplier >= parseFloat(st.autoCashout1)
      ) {
        handleCashout1();
      }

      // Auto Cashout Panel 2
      if (
        st.isAutoCashout2 &&
        st.hasBet2 &&
        !st.cashedOut2 &&
        parseFloat(st.autoCashout2) > 1.0 &&
        data.multiplier >= parseFloat(st.autoCashout2)
      ) {
        handleCashout2();
      }
    });

    socket.on('aviator_crashed', (data: { crashMultiplier: number; history: number[]; bets: any[] }) => {
      setGameState('CRASHED');
      setMultiplier(data.crashMultiplier);
      setHistory(data.history);
      setLiveBets(data.bets || []);
      setHasBet1(false);
      setMyBetId1(null);
      setHasBet2(false);
      setMyBetId2(null);
      onRefreshWallet();
    });

    socket.on('aviator_bet_confirmed', (bet: AviatorLiveBet) => {
      setLiveBets((prev) => [bet, ...prev]);
      if (bet.slot === 2) {
        setMyBetId2(bet.id);
      } else {
        setMyBetId1(bet.id);
      }
    });

    socket.on('aviator_bet_cancelled_success', (data: { betId: string; slot?: number }) => {
      if (data.slot === 2) {
        setHasBet2(false);
        setMyBetId2(null);
      } else {
        setHasBet1(false);
        setMyBetId1(null);
      }
      onRefreshWallet();
    });

    socket.on('aviator_bet_cashed_out', (bet: AviatorLiveBet) => {
      setLiveBets((prev) => prev.map((b) => (b.id === bet.id ? bet : b)));
      if (bet.id === myBetId1) {
        setCashedOut1(true);
        setCashoutWin1(bet.payout);
        onRefreshWallet();
      } else if (bet.id === myBetId2) {
        setCashedOut2(true);
        setCashoutWin2(bet.payout);
        onRefreshWallet();
      }
    });

    socket.on('aviator_cashout_success', (bet: any) => {
      if (bet.slot === 2 || bet.id === myBetId2) {
        setCashedOut2(true);
        setCashoutWin2(bet.payout);
      } else {
        setCashedOut1(true);
        setCashoutWin1(bet.payout);
      }
      onRefreshWallet();
    });

    socket.on('aviator_error', (data: { message: string; slot?: number }) => {
      console.warn('Aviator server notice:', data?.message);
      if (data.slot === 2) {
        setHasBet2(false);
      } else {
        setHasBet1(false);
      }
    });

    return () => {
      socket.off('aviator_state');
      socket.off('aviator_countdown');
      socket.off('aviator_flight_start');
      socket.off('aviator_tick');
      socket.off('aviator_crashed');
      socket.off('aviator_bet_confirmed');
      socket.off('aviator_bet_cancelled_success');
      socket.off('aviator_bet_cashed_out');
      socket.off('aviator_cashout_success');
      socket.off('aviator_error');
    };
  }, [socket, onRefreshWallet, myBetId1, myBetId2]);

  // Handle Bet 1 Actions
  const handlePlaceBet1 = () => {
    if (!socket || hasBet1 || gameState !== 'BETTING') return;
    if (wallet.availableBalance < stake1) {
      alert(`Insufficient balance. You need ${stake1} ETB.`);
      return;
    }
    setHasBet1(true);
    setCashedOut1(false);
    setCashoutWin1(null);
    socket.emit('aviator_place_bet', {
      slot: 1,
      userId: currentUser?.id,
      username: currentUser?.username || currentUser?.firstName || 'Player',
      stake: stake1,
      autoCashout: isAutoCashout1 ? parseFloat(autoCashout1) : undefined
    });
  };

  const handleCancelBet1 = () => {
    if (!socket || !hasBet1 || gameState !== 'BETTING') return;
    socket.emit('aviator_cancel_bet', {
      slot: 1,
      betId: myBetId1 || '',
      userId: currentUser?.id
    });
    setHasBet1(false);
    setMyBetId1(null);
  };

  const handleCashout1 = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!socket || !hasBet1 || cashedOut1 || gameState !== 'FLYING') return;

    setCashedOut1(true);
    const winAmt = stake1 * multiplier;
    setCashoutWin1(winAmt);

    socket.emit('aviator_cash_out', {
      slot: 1,
      betId: myBetId1 || 'active',
      userId: currentUser?.id,
      multiplier
    });
  };

  // Handle Bet 2 Actions (Dual Bet Panel)
  const handlePlaceBet2 = () => {
    if (!socket || hasBet2 || gameState !== 'BETTING') return;
    if (wallet.availableBalance < stake2) {
      alert(`Insufficient balance. You need ${stake2} ETB.`);
      return;
    }
    setHasBet2(true);
    setCashedOut2(false);
    setCashoutWin2(null);
    socket.emit('aviator_place_bet', {
      slot: 2,
      userId: currentUser?.id,
      username: currentUser?.username || currentUser?.firstName || 'Player',
      stake: stake2,
      autoCashout: isAutoCashout2 ? parseFloat(autoCashout2) : undefined
    });
  };

  const handleCancelBet2 = () => {
    if (!socket || !hasBet2 || gameState !== 'BETTING') return;
    socket.emit('aviator_cancel_bet', {
      slot: 2,
      betId: myBetId2 || '',
      userId: currentUser?.id
    });
    setHasBet2(false);
    setMyBetId2(null);
  };

  const handleCashout2 = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!socket || !hasBet2 || cashedOut2 || gameState !== 'FLYING') return;

    setCashedOut2(true);
    const winAmt = stake2 * multiplier;
    setCashoutWin2(winAmt);

    socket.emit('aviator_cash_out', {
      slot: 2,
      betId: myBetId2 || 'active',
      userId: currentUser?.id,
      multiplier
    });
  };

  // Total Real-Time Gain Calculation across active bets
  const totalLivePayout =
    (hasBet1 && !cashedOut1 ? stake1 * multiplier : 0) +
    (hasBet2 && !cashedOut2 ? stake2 * multiplier : 0);

  const totalLiveProfit =
    (hasBet1 && !cashedOut1 ? stake1 * multiplier - stake1 : 0) +
    (hasBet2 && !cashedOut2 ? stake2 * multiplier - stake2 : 0);

  const isUserFlying = (hasBet1 && !cashedOut1) || (hasBet2 && !cashedOut2);

  // Render Individual Order Panel
  const renderBetPanel = (slot: 1 | 2) => {
    const stake = slot === 1 ? stake1 : stake2;
    const setStake = slot === 1 ? setStake1 : setStake2;
    const autoCashout = slot === 1 ? autoCashout1 : autoCashout2;
    const setAutoCashout = slot === 1 ? setAutoCashout1 : setAutoCashout2;
    const isAutoCashout = slot === 1 ? isAutoCashout1 : isAutoCashout2;
    const setIsAutoCashout = slot === 1 ? setIsAutoCashout1 : setIsAutoCashout2;
    const hasBet = slot === 1 ? hasBet1 : hasBet2;
    const cashedOut = slot === 1 ? cashedOut1 : cashedOut2;
    const cashoutWin = slot === 1 ? cashoutWin1 : cashoutWin2;
    const handlePlace = slot === 1 ? handlePlaceBet1 : handlePlaceBet2;
    const handleCancel = slot === 1 ? handleCancelBet1 : handleCancelBet2;
    const handleCash = slot === 1 ? handleCashout1 : handleCashout2;

    const liveGain = stake * multiplier;
    const liveProfit = liveGain - stake;

    return (
      <div className="bg-[#121824] border border-[#1e283b] rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-lg relative overflow-hidden transition-all">
        {/* Top bar: Order Title & Auto Cashout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasBet
                  ? gameState === 'FLYING'
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                  : 'bg-[#00E676]'
              } animate-pulse`}
            />
            <span className="text-xs font-black text-gray-200 uppercase tracking-wider">
              {language === 'am' ? `መወራረጃ ${slot}` : `Order ${slot}`}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              ({slot === 1 ? 'Main' : 'Dual'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoCashout}
                onChange={(e) => setIsAutoCashout(e.target.checked)}
                disabled={hasBet}
                className="accent-[#00E676] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Auto</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                disabled={!isAutoCashout || hasBet}
                className="w-14 h-6 rounded-lg bg-[#0b0e14] border border-[#222e42] px-1 text-xs font-mono font-bold text-center text-white disabled:opacity-40"
              />
              <span className="text-xs text-gray-400 font-bold">x</span>
            </div>
          </div>
        </div>

        {/* Controls Grid: Left is Stake adjustment, Right is Action Button */}
        <div className="grid grid-cols-2 gap-2.5 items-stretch">
          {/* Left Column: Stake +/- and Quick Chips */}
          <div className="flex flex-col justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStake(Math.max(10, stake - 10))}
                disabled={hasBet}
                className="w-9 h-9 rounded-xl bg-[#1a2333] hover:bg-[#232f45] border border-[#2b3a54] text-white font-black text-base disabled:opacity-40"
              >
                -
              </button>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                disabled={hasBet}
                className="w-full h-9 rounded-xl bg-[#0b0e14] border border-[#222e42] px-1 font-mono font-bold text-center text-white focus:outline-none focus:border-[#00E676] text-sm"
              />
              <button
                type="button"
                onClick={() => setStake(stake + 10)}
                disabled={hasBet}
                className="w-9 h-9 rounded-xl bg-[#1a2333] hover:bg-[#232f45] border border-[#2b3a54] text-white font-black text-base disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-4 gap-1">
              {[10, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStake(val)}
                  disabled={hasBet}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    stake === val
                      ? 'bg-[#00E676]/20 border border-[#00E676] text-[#00E676]'
                      : 'bg-[#182130] text-gray-300 hover:bg-[#202c40] border border-[#243147]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Action Button */}
          <div className="flex flex-col">
            {!hasBet ? (
              /* State 1: GREEN BET BUTTON (Default before placing order) */
              <button
                type="button"
                onClick={handlePlace}
                disabled={gameState !== 'BETTING'}
                className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 flex flex-col items-center justify-center gap-0.5 leading-tight"
              >
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 fill-black" />
                  <span className="text-base font-black">BET</span>
                </div>
                <span className="text-xs font-black">{stake} ETB</span>
              </button>
            ) : gameState === 'BETTING' ? (
              /* State 2: VIBRANT RED BUTTON (Immediately turns RED when order is placed during countdown!) */
              <button
                type="button"
                onClick={handleCancel}
                className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black tracking-wider uppercase shadow-xl shadow-red-600/40 border border-red-400/50 transition-all transform active:scale-95 flex flex-col items-center justify-center gap-0.5 leading-tight animate-pulse"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-100">
                  WAITING FOR TAKEOFF
                </span>
                <span className="text-sm font-black text-white">
                  ✕ CANCEL
                </span>
                <span className="text-[11px] font-extrabold text-red-200">
                  {stake} ETB REFUND
                </span>
              </button>
            ) : cashedOut ? (
              /* State 3: EMERALD GREEN WON BUTTON */
              <div className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-r from-emerald-500 to-[#00E676] text-black font-black tracking-wider uppercase shadow-xl shadow-[#00E676]/40 flex flex-col items-center justify-center leading-tight">
                <span className="text-[11px] font-black uppercase tracking-wider">✓ CASHED OUT</span>
                <span className="text-base font-black">
                  +{(cashoutWin || liveGain).toFixed(2)} ETB
                </span>
              </div>
            ) : gameState === 'FLYING' ? (
              /* State 4: GOLD/AMBER CASH OUT WITH REAL-TIME LIVE GAINS BEFORE PLANE IS DOWN */
              <button
                type="button"
                onClick={handleCash}
                onTouchEnd={handleCash}
                className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-black font-black tracking-wider uppercase shadow-xl shadow-amber-400/50 transition-all transform active:scale-95 flex flex-col items-center justify-center leading-tight ring-2 ring-yellow-300 animate-pulse cursor-pointer"
              >
                <span className="text-[10px] font-black tracking-wider uppercase text-amber-950">
                  CASH OUT
                </span>
                <span className="text-lg font-black text-black">
                  {liveGain.toFixed(2)} ETB
                </span>
                <span className="text-[10px] font-black text-emerald-950 bg-yellow-300/70 px-1.5 py-0.5 rounded-full">
                  +{liveProfit.toFixed(2)} ETB GAIN
                </span>
              </button>
            ) : (
              /* State 5: Plane Crashed */
              <div className="w-full h-full min-h-[72px] rounded-2xl bg-[#1b2332] text-gray-400 font-black tracking-wider uppercase flex flex-col items-center justify-center leading-tight opacity-60">
                <span className="text-xs font-black text-red-400">FLEW AWAY</span>
                <span className="text-[11px] font-bold text-gray-500">{stake} ETB</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
        {/* Aviator Flight Arena + Controls (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Flight Screen Canvas */}
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[360px] bg-[#0b0e14] border border-[#1e283b] rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={360}
              className="absolute inset-0 w-full h-full object-cover"
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

                  {/* Real-Time Live Gain Display Before Plane is Down */}
                  {isUserFlying && (
                    <div className="mt-3 px-4 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-amber-500/20 animate-pulse">
                      <TrendingUp className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        {language === 'am' ? 'የሚያገኙት ትርፍ:' : 'Current Win:'}
                      </span>
                      <span className="text-base font-black text-amber-300 font-mono">
                        {totalLivePayout.toFixed(2)} ETB
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        (+{totalLiveProfit.toFixed(2)} ETB)
                      </span>
                    </div>
                  )}
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
            {(cashedOut1 || cashedOut2) && (cashoutWin1 || cashoutWin2) && (
              <div className="absolute top-6 z-20 px-6 py-2.5 rounded-2xl bg-[#00E676] text-black font-black text-sm tracking-wide shadow-xl shadow-[#00E676]/40 flex items-center gap-2 animate-bounce">
                <span>
                  YOU WON! +{((cashoutWin1 || 0) + (cashoutWin2 || 0)).toFixed(2)} ETB
                </span>
              </div>
            )}
          </div>

          {/* Dual Order Panels: Order 1 & Order 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderBetPanel(1)}
            {renderBetPanel(2)}
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
