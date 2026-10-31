import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, HelpCircle, Eye, EyeOff, ChevronDown, RefreshCw } from 'lucide-react';
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
  onOpenDeposit?: () => void;
}

type Difficulty = 'low' | 'medium' | 'high';

interface LaneConfig {
  id: number;
  multiplier: number;
}

// 3 Difficulty tiers matching InOut Chicken 2 Road
const DIFFICULTY_DATA: Record<Difficulty, { label: { en: string; am: string }; multipliers: number[] }> = {
  low: {
    label: { en: 'Low (Easy)', am: 'Low (ቀላል)' },
    multipliers: [1.01, 1.03, 1.06, 1.10, 1.15, 1.21, 1.28, 1.36, 1.45, 1.56, 1.70, 1.88, 2.10, 2.40, 2.80, 3.40, 4.20, 5.50, 7.50, 10.00]
  },
  medium: {
    label: { en: 'Medium', am: 'Medium (መካከለኛ)' },
    multipliers: [1.05, 1.12, 1.25, 1.42, 1.65, 1.95, 2.35, 2.90, 3.65, 4.70, 6.20, 8.50, 12.00, 18.00, 30.00]
  },
  high: {
    label: { en: 'High (Hard)', am: 'High (ከባድ)' },
    multipliers: [1.20, 1.50, 2.00, 2.80, 4.00, 6.00, 9.50, 16.00, 28.00, 50.00]
  }
};

// Web Audio API Sound Synthesizer (Instant response, zero external files)
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playBarrier() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  playCarScreech() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch {}
  }

  playCarCrash() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      // White noise blast for explosion/impact
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.4);

      // Low bass impact
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      oscGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  playCashout() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.26);
      });
    } catch {}
  }
}

const sounds = new SoundFX();

export const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({
  wallet,
  onRefreshWallet,
  language,
  currentUser,
  onBack,
  onOpenDeposit
}) => {
  const [stake, setStake] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<Difficulty>('low');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLane, setCurrentLane] = useState(0); // 0 = Sidewalk, 1..N = Road lanes
  const [multiplier, setMultiplier] = useState(1.00);
  const [isStepping, setIsStepping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  // Crash animation state: car speeding in to hit the chicken
  const [isCrashAnimating, setIsCrashAnimating] = useState(false);
  const [crashCarType, setCrashCarType] = useState<'truck' | 'sport' | 'sedan' | 'van'>('sport');
  const [crashCarColor, setCrashCarColor] = useState('#f44336');

  // Road camera scroll container
  const roadScrollRef = useRef<HTMLDivElement>(null);

  // Active difficulty multipliers
  const activeMultipliers = DIFFICULTY_DATA[difficulty].multipliers;

  // Toggle sound
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Scroll camera to follow chicken horizontally
  useEffect(() => {
    if (roadScrollRef.current) {
      const laneWidth = 110;
      const targetScroll = Math.max(0, (currentLane - 1) * laneWidth - 30);
      roadScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [currentLane]);

  // Handle Play / Start Game
  const handleStartGame = async () => {
    if (wallet.availableBalance < stake) {
      alert(language === 'am' ? 'በቂ ሂሳብ የለም። እባክዎ ገንዘብ ያስገቡ!' : `Insufficient balance! You need ${stake} ETB.`);
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741892'
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
      setCurrentLane(1);
      setMultiplier(activeMultipliers[0]);
      setIsGameOver(false);
      setHasWon(false);
      setPayoutAmount(0);
      setIsCrashAnimating(false);
      sounds.playHop();
      setTimeout(() => sounds.playBarrier(), 200);
      onRefreshWallet();
    } catch (err: any) {
      alert('Error starting Chicken Road: ' + err.message);
    }
  };

  // Handle Step Forward (GO)
  const handleStep = async () => {
    if (!isPlaying || isGameOver || isStepping || isCrashAnimating) return;

    setIsStepping(true);
    const nextLane = currentLane + 1;

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741892'
        },
        body: JSON.stringify({
          stepIndex: nextLane,
          currentMultiplier: multiplier,
          isCashingOut: false,
          stake,
          difficulty
        })
      });
      const data = await res.json();

      if (data.crashed) {
        // Crash sequence: Chicken hops into lane -> Sudden car rushes down -> CRASH!
        setCurrentLane(nextLane);
        sounds.playHop();
        setIsCrashAnimating(true);
        setCrashCarType(data.carType || 'sport');
        setCrashCarColor(data.carColor || '#f44336');

        // Sounds: tire screech then heavy collision
        setTimeout(() => sounds.playCarScreech(), 150);
        setTimeout(() => {
          sounds.playCarCrash();
          setIsGameOver(true);
          setIsPlaying(false);
          setIsStepping(false);
          setIsCrashAnimating(false);
          onRefreshWallet();
        }, 650);
      } else {
        // Safe: Hop forward, drop barrier, update multiplier
        setCurrentLane(nextLane);
        sounds.playHop();
        setTimeout(() => sounds.playBarrier(), 220);
        setMultiplier(data.nextMultiplier);
        setIsStepping(false);

        // If completed final lane -> auto cashout
        if (data.isFinalLane || nextLane >= activeMultipliers.length) {
          handleCashout(data.nextMultiplier);
        }
      }
    } catch (err: any) {
      setIsStepping(false);
      alert('Step error: ' + err.message);
    }
  };

  // Handle Cashout
  const handleCashout = async (multOverride?: number) => {
    if (!isPlaying || isGameOver || isCrashAnimating) return;
    const finalMult = multOverride || multiplier;

    try {
      const res = await fetch('/api/games/chicken-road/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741892'
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
        sounds.playCashout();
        onRefreshWallet();
      }
    } catch (err: any) {
      alert('Cashout error: ' + err.message);
    }
  };

  // Render SVG Vehicle
  const renderVehicle = (type: string, color: string, isSpeedingCrash = false) => {
    if (type === 'truck') {
      return (
        <svg viewBox="0 0 70 120" className="w-[62px] h-[106px] drop-shadow-xl">
          {/* Truck Body */}
          <rect x="8" y="32" width="54" height="84" rx="4" fill="#2c3038" />
          <rect x="12" y="36" width="46" height="76" rx="2" fill="#1e222a" />
          {/* Logo on top of truck cargo */}
          <text x="35" y="80" textAnchor="middle" fill="#ffb300" fontSize="13" fontWeight="900" fontStyle="italic" letterSpacing="0.5">
            inOut
          </text>
          {/* Truck Cab */}
          <rect x="10" y="2" width="50" height="34" rx="6" fill={color} />
          {/* Windshield */}
          <rect x="14" y="8" width="42" height="12" rx="2" fill="#78909c" />
          {/* Headlights */}
          <rect x="13" y="2" width="9" height="4" rx="1" fill="#fff59d" />
          <rect x="48" y="2" width="9" height="4" rx="1" fill="#fff59d" />
          {/* Side mirrors */}
          <rect x="5" y="10" width="5" height="4" rx="1" fill="#455a64" />
          <rect x="60" y="10" width="5" height="4" rx="1" fill="#455a64" />
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg viewBox="0 0 60 95" className="w-[52px] h-[84px] drop-shadow-lg">
          <rect x="6" y="4" width="48" height="88" rx="8" fill={color} />
          <rect x="10" y="12" width="40" height="15" rx="3" fill="#607d8b" />
          <rect x="10" y="34" width="40" height="10" rx="2" fill="#455a64" />
          <circle cx="14" cy="7" r="3" fill="#fff" />
          <circle cx="46" cy="7" r="3" fill="#fff" />
        </svg>
      );
    }

    // Default: Sleek Sport Sedan / Car
    return (
      <svg viewBox="0 0 60 95" className={`w-[54px] h-[85px] drop-shadow-2xl ${isSpeedingCrash ? 'animate-pulse' : ''}`}>
        {/* Car Chassis */}
        <rect x="7" y="5" width="46" height="85" rx="10" fill={color} stroke="#1f242e" strokeWidth="2" />
        {/* Hood lines */}
        <path d="M12 18 Q30 22 48 18" stroke="#1f242e" strokeWidth="1.5" fill="none" opacity="0.6" />
        {/* Front Windshield */}
        <path d="M11 26 L14 44 L46 44 L49 26 Z" fill="#37474f" />
        {/* Car Roof */}
        <rect x="14" y="44" width="32" height="22" rx="4" fill={color} filter="brightness(0.85)" />
        {/* Rear Windshield */}
        <path d="M14 66 L12 78 L48 78 L46 66 Z" fill="#37474f" />
        {/* Blazing Headlights */}
        <rect x="10" y="6" width="9" height="5" rx="2" fill="#fff59d" />
        <rect x="41" y="6" width="9" height="5" rx="2" fill="#fff59d" />
        {/* Headlight beams if speeding */}
        {isSpeedingCrash && (
          <>
            <polygon points="10,0 5,6 19,6 24,0" fill="#fff9c4" opacity="0.8" />
            <polygon points="41,0 36,6 50,6 55,0" fill="#fff9c4" opacity="0.8" />
          </>
        )}
      </svg>
    );
  };

  // Render Cute Plump Chicken (Matches Screenshot)
  const renderChicken = (state: 'idle' | 'safe' | 'crashed') => {
    if (state === 'crashed') {
      return (
        <div className="relative flex flex-col items-center justify-center animate-bounce">
          {/* Feathers Flying */}
          <div className="absolute -top-6 -left-6 text-xl animate-ping">🪶</div>
          <div className="absolute -top-4 -right-6 text-xl animate-ping delay-75">🪶</div>
          <div className="absolute -bottom-4 text-2xl animate-spin">💥</div>

          {/* Flattened / Roasted Chicken Graphic */}
          <svg viewBox="0 0 70 65" className="w-[66px] h-[60px] drop-shadow-xl transform rotate-12">
            {/* Roasted Body */}
            <ellipse cx="35" cy="38" rx="28" ry="18" fill="#d97706" />
            <ellipse cx="44" cy="28" rx="14" ry="14" fill="#b45309" />
            {/* Roasted Wing */}
            <ellipse cx="28" cy="38" rx="14" ry="9" fill="#92400e" />
            {/* Drumstick bone */}
            <circle cx="10" cy="38" r="4" fill="#fef3c7" />
            {/* Dizzy X eyes */}
            <text x="44" y="28" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">✕‿✕</text>
            {/* Stars */}
            <text x="36" y="12" fill="#fbbf24" fontSize="14">✨</text>
          </svg>
        </div>
      );
    }

    // Happy Cute White Chicken
    return (
      <div className={`relative flex items-center justify-center transition-transform ${isStepping ? 'scale-110 -translate-y-3' : 'animate-pulse'}`}>
        <svg viewBox="0 0 65 65" className="w-[64px] h-[64px] drop-shadow-lg">
          {/* Chicken Body */}
          <ellipse cx="32" cy="38" rx="23" ry="19" fill="#ffffff" />
          {/* Fluffy tail feathers */}
          <path d="M10 36 C6 30 11 24 16 30 Z" fill="#f1f5f9" />
          {/* Wing */}
          <path d="M22 38 Q32 45 38 36 Q32 32 22 38 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Cute Little Yellow Feet */}
          <path d="M26 55 L26 60 L21 62" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M36 55 L36 60 L31 62" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Red Comb on Head */}
          <path d="M38 12 Q42 6 46 12 Q50 6 53 14 Z" fill="#ef4444" />
          {/* Red Wattle under beak */}
          <ellipse cx="53" cy="36" rx="4" ry="6" fill="#ef4444" />
          {/* Cute Big Googly Eyes */}
          <circle cx="47" cy="24" r="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="49" cy="24" r="4.5" fill="#1e293b" />
          <circle cx="51" cy="22" r="1.8" fill="#ffffff" />
          {/* Yellow Beak */}
          <polygon points="53,26 62,30 53,34" fill="#fbbf24" />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-md mx-auto text-white select-none pb-4 font-sans">
      {/* 1. TOP CASINO NAVIGATION BAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#171920] border-b border-[#262935] shadow-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-[#232634] hover:bg-[#2d3143] flex items-center justify-center text-gray-300 transition-all active:scale-95"
          title="Back to Lobby"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Brand Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#202433] border border-[#2e3447]">
          <span className="text-sm">🎲</span>
          <span className="text-xs font-black tracking-wide text-white">EDIL BET</span>
        </div>

        {/* Balance Display Pill */}
        <div className="flex items-center gap-1.5 bg-[#101218] border border-[#272b3c] rounded-xl px-2.5 py-1">
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-black shadow-inner">
            Br
          </div>
          <span className="text-xs font-black font-mono text-white">
            {hideBalance ? '••••••' : wallet.availableBalance.toFixed(2)}
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="text-gray-400 hover:text-white"
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Green Deposit Button */}
        <button
          onClick={onOpenDeposit}
          className="px-3 py-1.5 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-md shadow-[#00E676]/20 active:scale-95 transition-all"
        >
          Deposit
        </button>
      </div>

      {/* 2. CHICKEN 2 ROAD TITLE BAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1b1e28] border border-[#2b3042] rounded-2xl shadow-sm">
        {/* Title Logo */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-wider text-white">CHICKEN</span>
          <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-red-600 text-white font-black text-xs shadow-md">
            2
            <span className="absolute -top-1 -right-1 text-[10px]">🐥</span>
          </div>
          <span className="text-sm font-black tracking-wider text-white">ROAD</span>
        </div>

        {/* Active Bet / Round Value */}
        <div className="px-3 py-1 rounded-xl bg-[#11131a] border border-[#232736] flex items-center gap-1.5">
          <span className="text-xs font-mono font-black text-amber-400">
            {(stake * multiplier).toFixed(2)}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase">ETB</span>
        </div>

        {/* Sound & Info Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-xl bg-[#232738] hover:bg-[#2d3247] flex items-center justify-center text-gray-300"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00E676]" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="w-8 h-8 rounded-xl bg-[#232738] hover:bg-[#2d3247] flex items-center justify-center text-gray-300"
            title="Game Info"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. THE HIGHWAY ARENA (CANVAS / ROAD VIEWPORT) */}
      <div
        ref={roadScrollRef}
        className="relative h-[370px] bg-[#42444c] border-2 border-[#2b3040] rounded-3xl overflow-x-auto overflow-y-hidden shadow-2xl flex select-none no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* SIDEWALK (LANE 0: STARTING POINT) */}
        <div className="relative w-[130px] min-w-[130px] h-full bg-[#9e9e9e] border-r-[8px] border-[#bdbdbd] flex flex-col justify-between p-2 z-10 shadow-lg">
          {/* Top Lush Green Trees / Hedges */}
          <div className="relative">
            <div className="w-20 h-16 rounded-full bg-[#388e3c] border-2 border-[#2e7d32] shadow-md flex items-center justify-center text-2xl">
              🌳
            </div>
          </div>

          {/* Streetlamp Pole with Warm Light Cast */}
          <div className="relative my-auto flex flex-col items-center">
            {/* Lamp Head */}
            <div className="w-12 h-6 rounded-t-xl bg-[#455a64] border border-[#37474f] relative shadow-md">
              <div className="absolute inset-x-2 bottom-0 h-2 bg-amber-200 rounded-b-md shadow-[0_0_15px_#fde68a]" />
            </div>
            {/* Light Cone Glow on Sidewalk */}
            <div className="absolute top-4 w-28 h-28 rounded-full bg-amber-100/20 blur-md pointer-events-none" />
            {/* Metal Pole */}
            <div className="w-2.5 h-20 bg-[#607d8b] shadow-inner" />
            {/* Pole Base */}
            <div className="w-6 h-3 rounded-full bg-[#37474f]" />
          </div>

          {/* Chicken on Sidewalk (When not playing or before lane 1) */}
          {currentLane === 0 && (
            <div className="absolute bottom-20 left-8 z-20">
              {renderChicken('idle')}
            </div>
          )}

          {/* Sidewalk curb stone markings */}
          <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest text-center mt-auto pb-1">
            START
          </div>
        </div>

        {/* ROAD LANES (LANE 1 .. N) */}
        <div className="flex h-full">
          {activeMultipliers.map((mult, idx) => {
            const laneNum = idx + 1;
            const isChickenHere = currentLane === laneNum;
            const isPassed = currentLane > laneNum;
            const isNext = currentLane === idx && isPlaying;

            // Generate ambient traffic car if chicken is not on this lane
            const showAmbientTraffic = !isChickenHere && laneNum > currentLane;
            const carStyle = idx % 3 === 0 ? 'truck' : idx % 3 === 1 ? 'sport' : 'van';
            const carColor = idx % 2 === 0 ? '#ffb300' : '#03a9f4';

            return (
              <div
                key={laneNum}
                className="relative w-[110px] min-w-[110px] h-full bg-[#33353b] border-r-2 border-dashed border-gray-300/40 flex flex-col items-center justify-between py-3 overflow-hidden"
              >
                {/* Traffic Car passing down the lane (Ambient or Crashed) */}
                {showAmbientTraffic && (
                  <div
                    className="absolute top-4 z-10 transition-all duration-1000 opacity-90"
                    style={{
                      transform: `translateY(${((idx * 37) % 180)}px)`
                    }}
                  >
                    {renderVehicle(carStyle, carColor)}
                  </div>
                )}

                {/* CRASH CAR RUSHING IN (When crash triggers) */}
                {isChickenHere && isCrashAnimating && (
                  <div className="absolute -top-10 z-30 animate-[slideDown_0.35s_ease-in_forwards]">
                    {renderVehicle(crashCarType, crashCarColor, true)}
                  </div>
                )}

                {/* YELLOW/BLACK CONSTRUCTION BARRIER (When chicken safely occupies lane) */}
                {isChickenHere && !isCrashAnimating && !isGameOver && (
                  <div className="absolute top-16 z-20 flex flex-col items-center animate-bounce">
                    {/* Stopped traffic car behind barrier */}
                    <div className="mb-1 opacity-80">
                      {renderVehicle('truck', '#1e88e5')}
                    </div>
                    {/* The Striped Barrier 🚧 */}
                    <div className="w-[82px] h-6 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center overflow-hidden shadow-lg">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, #fbc02d, #fbc02d 10px, #212121 10px, #212121 20px)'
                        }}
                      />
                    </div>
                    {/* Barrier legs */}
                    <div className="flex justify-between w-[70px] -mt-1">
                      <div className="w-2.5 h-4 bg-gray-400 rounded-b" />
                      <div className="w-2.5 h-4 bg-gray-400 rounded-b" />
                    </div>
                  </div>
                )}

                {/* THE CHICKEN ITSELF (When on this lane) */}
                {isChickenHere && (
                  <div className="absolute top-[200px] z-20 flex flex-col items-center">
                    {renderChicken(isGameOver ? 'crashed' : 'safe')}

                    {/* Blue Multiplier Tooltip Bubble under Chicken */}
                    {!isGameOver && (
                      <div className="relative mt-1 px-2.5 py-1 rounded-xl bg-[#2b4c7e] border border-[#4870ad] shadow-lg flex items-center justify-center animate-pulse">
                        {/* Triangle arrow pointing up */}
                        <div className="absolute -top-1.5 w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-[#2b4c7e]" />
                        <span className="text-xs font-black font-mono text-white tracking-wide">
                          {mult.toFixed(2)}x
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* MANHOLE COVER (የፍሳሽ ክዳን) WITH STAMPED MULTIPLIER */}
                <div className="my-auto mt-[210px] z-0">
                  <div
                    className={`relative w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-xl transition-all ${
                      isPassed
                        ? 'border-[#00E676]/80 bg-[#1e2e28] shadow-[#00E676]/20'
                        : isChickenHere
                        ? 'border-amber-400 bg-[#2d281e] shadow-amber-400/30'
                        : isNext
                        ? 'border-gray-400 bg-[#252830] animate-pulse'
                        : 'border-[#4a4d56] bg-[#22242a]'
                    }`}
                  >
                    {/* Circular Cast Iron Inner Grille Lines */}
                    <div className="absolute inset-1.5 rounded-full border border-gray-600/40 flex items-center justify-center opacity-60">
                      <div className="w-full h-0.5 bg-gray-700/60 rotate-45" />
                      <div className="w-full h-0.5 bg-gray-700/60 -rotate-45" />
                    </div>

                    {/* Stamped Multiplier Text */}
                    <span
                      className={`relative z-10 font-black font-mono tracking-tight text-center ${
                        isPassed
                          ? 'text-[#00E676] text-sm drop-shadow'
                          : isChickenHere
                          ? 'text-amber-300 text-sm drop-shadow'
                          : 'text-gray-300 text-xs'
                      }`}
                    >
                      {mult.toFixed(2)}x
                    </span>

                    {/* Passed checkmark or indicator */}
                    {isPassed && (
                      <span className="absolute bottom-1 text-[9px] font-black text-[#00E676] uppercase">
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Lane Number at Bottom */}
                <div className="mt-auto pb-1 text-[10px] font-mono font-bold text-gray-500">
                  #{laneNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* CRASHED / ROASTED OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3 p-4 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-4xl animate-bounce shadow-xl">
              💥
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-red-500 tracking-wider">
                {language === 'am' ? 'ተገጨች! (CRASHED)' : 'CAR CRASH! YOU LOST!'}
              </span>
              <p className="text-xs text-gray-300 max-w-xs">
                {language === 'am'
                  ? 'ዶሮዋ መንገድ ስትሻገር በመኪና ተገጭታ ተጠበሰች!'
                  : 'The chicken got hit by a speeding vehicle! Try again.'}
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/40 active:scale-95 transition-all"
            >
              {language === 'am' ? 'እንደገና ሞክር' : 'Play Again'}
            </button>
          </div>
        )}

        {/* CASHED OUT / VICTORY OVERLAY */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3 p-4 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#00E676]/20 border-2 border-[#00E676] flex items-center justify-center text-4xl animate-bounce shadow-xl">
              🏆
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black text-[#00E676] tracking-wider uppercase">
                {language === 'am' ? 'እንኳን ደስ አለዎት! ተቀብለዋል!' : 'SUCCESSFULLY CASHED OUT!'}
              </span>
              <span className="text-3xl font-black text-white font-mono drop-shadow-lg">
                +{payoutAmount.toFixed(2)} ETB
              </span>
            </div>
            <button
              onClick={handleStartGame}
              className="px-8 py-3 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-[#00E676]/40 active:scale-95 transition-all"
            >
              {language === 'am' ? 'ቀጣይ ዙር' : 'Next Round'}
            </button>
          </div>
        )}
      </div>

      {/* 4. BOTTOM BETTING CONTROLS (PIXEL-PERFECT MATCH TO SCREENSHOTS) */}
      <div className="bg-[#212328] border border-[#2e323b] rounded-3xl p-3.5 shadow-xl flex flex-col gap-3">
        {/* Row 1: Stepper (MIN, input, MAX) */}
        <div className="flex items-center justify-between bg-[#2a2d34] border border-[#373b45] rounded-2xl p-1.5 shadow-inner">
          <button
            onClick={() => setStake(4)}
            disabled={isPlaying}
            className="px-4 py-2 rounded-xl bg-[#343842] hover:bg-[#3f4450] text-gray-300 font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95"
          >
            MIN
          </button>

          <input
            type="number"
            value={stake}
            disabled={isPlaying}
            onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 text-center bg-transparent font-black font-mono text-base text-white focus:outline-none disabled:opacity-75"
          />

          <button
            onClick={() => setStake(Math.min(500, Math.floor(wallet.availableBalance)))}
            disabled={isPlaying}
            className="px-4 py-2 rounded-xl bg-[#343842] hover:bg-[#3f4450] text-gray-300 font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95"
          >
            MAX
          </button>
        </div>

        {/* Row 2: Preset Bet Chips ([ 4 ETB ] [ 8 ETB ] [ 12 ETB ] [ 20 ETB ]) */}
        <div className="grid grid-cols-4 gap-2">
          {[4, 8, 12, 20].map((chipVal) => (
            <button
              key={chipVal}
              onClick={() => setStake(chipVal)}
              disabled={isPlaying}
              className={`py-2.5 rounded-2xl text-xs font-black font-mono transition-all border flex items-center justify-center gap-1 ${
                stake === chipVal
                  ? 'bg-[#3b404d] text-white border-gray-400 shadow-md'
                  : 'bg-[#2a2d34] text-gray-300 border-[#373b45] hover:bg-[#323640]'
              } disabled:opacity-50`}
            >
              <span>{chipVal}</span>
              <span className="text-[10px] text-gray-400 uppercase">ETB</span>
            </button>
          ))}
        </div>

        {/* Row 3: Difficulty Dropdown (Low, Medium, High) */}
        <div className="relative">
          <select
            value={difficulty}
            disabled={isPlaying}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full py-3 px-4 rounded-2xl bg-[#2a2d34] border border-[#373b45] text-white text-xs font-black capitalize tracking-wide appearance-none focus:outline-none focus:border-gray-400 disabled:opacity-60 cursor-pointer"
          >
            <option value="low">Low (Easy / ቀላል)</option>
            <option value="medium">Medium (መካከለኛ)</option>
            <option value="high">High (Hard / ከባድ)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Row 4: ACTION BUTTONS (PLAY vs CASH OUT + GO) */}
        {!isPlaying ? (
          /* Initial State: Giant Green Play Button */
          <button
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-lg tracking-wider shadow-lg shadow-[#00E676]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Play</span>
          </button>
        ) : (
          /* Active Playing State: Dual Buttons (Yellow CASH OUT + Green GO) */
          <div className="grid grid-cols-2 gap-3">
            {/* CASH OUT Button */}
            <button
              onClick={() => handleCashout()}
              disabled={isStepping || isCrashAnimating}
              className="py-3 rounded-2xl bg-[#ffca28] hover:bg-[#ffb300] text-black font-black shadow-lg shadow-[#ffca28]/30 active:scale-98 transition-all flex flex-col items-center justify-center leading-tight disabled:opacity-50"
            >
              <span className="text-xs font-black uppercase tracking-wider text-black/90">
                CASH OUT
              </span>
              <span className="text-base font-black font-mono">
                {(stake * multiplier).toFixed(2)} ETB
              </span>
            </button>

            {/* GO Button */}
            <button
              onClick={handleStep}
              disabled={isStepping || isCrashAnimating}
              className="py-3 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-lg uppercase tracking-wider shadow-lg shadow-[#00E676]/30 active:scale-98 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isStepping ? 'HOPPING...' : 'GO'}
            </button>
          </div>
        )}
      </div>

      {/* Rules / Provably Fair Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1e28] border border-[#2e3447] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#2e3447] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                <h3 className="font-extrabold text-sm text-white">Chicken Road Rules</h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-300 leading-relaxed flex flex-col gap-2">
              <p>
                <strong>3 Difficulty Levels:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-400">
                <li><strong className="text-white">Low:</strong> Low car traffic, steady multipliers starting at 1.01x up to 10.00x.</li>
                <li><strong className="text-white">Medium:</strong> Faster pace, starting at 1.05x up to 30.00x.</li>
                <li><strong className="text-white">High:</strong> Heavy high-speed cars, starting at 1.20x up to 50.00x!</li>
              </ul>
              <p>
                Press <strong>GO</strong> to hop to the next manhole cover. Cash out anytime before a speeding car crashes into the chicken!
              </p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E676] text-black font-black text-xs uppercase"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};