import React, { useState } from 'react';
import { Search, Crown, Ticket, RotateCcw, Coins, Sparkles, ChevronRight } from 'lucide-react';

interface GamesLobbyProps {
  onSelectGame: (gameId: string) => void;
  language: 'am' | 'en';
  onOpenLuckySpin?: () => void;
  onOpenShamo?: () => void;
  onOpenCoupon?: () => void;
}

export const GamesLobby: React.FC<GamesLobbyProps> = ({
  onSelectGame,
  language,
  onOpenLuckySpin,
  onOpenShamo,
  onOpenCoupon
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Recent Big Wins Mock/Live Data
  const recentBigWins = [
    { game: 'Jet-X', icon: '🚀', bg: 'from-amber-600 to-yellow-500', user: 'Meron...', avatar: 'M', avatarColor: 'bg-rose-500', win: 'Br4421' },
    { game: 'Fast Keno', icon: '🎱', bg: 'from-emerald-600 to-teal-500', user: 'Aster*...', avatar: 'A', avatarColor: 'bg-emerald-500', win: 'Br4711' },
    { game: 'Safari Simba', icon: '🦁', bg: 'from-yellow-600 to-amber-700', user: 'Dawit...', avatar: 'D', avatarColor: 'bg-pink-500', win: 'Br3923' },
    { game: 'Power Tiger', icon: '🐯', bg: 'from-orange-600 to-amber-600', user: 'Hanna...', avatar: 'H', avatarColor: 'bg-cyan-500', win: 'Br3059' },
    { game: '888 Dragons', icon: '🐉', bg: 'from-purple-600 to-indigo-600', user: 'Kebed...', avatar: 'K', avatarColor: 'bg-fuchsia-500', win: 'Br1254' },
    { game: 'Aviator', icon: '✈️', bg: 'from-red-600 to-rose-600', user: 'Solom...', avatar: 'S', avatarColor: 'bg-blue-500', win: 'Br6820' },
  ];

  // Featured Main Games
  const featuredGames = [
    {
      id: 'fast-keno',
      title: 'FAST KENO',
      tag: 'NEW',
      subtitle: '20 Balls Live Draw',
      bgGradient: 'from-[#0e2a22] via-[#091b16] to-[#0c1117]',
      accentColor: '#00E676',
      iconVisual: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex items-center justify-center text-white font-black text-xl border-2 border-emerald-300 absolute -top-1 left-2">
            10
          </div>
          <div className="w-16 h-16 rounded-full bg-teal-500 shadow-xl shadow-teal-500/50 flex items-center justify-center text-white font-black text-2xl border-2 border-teal-200 z-10">
            20
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/50 flex items-center justify-center text-white font-black text-xl border-2 border-emerald-300 absolute -bottom-1 right-2">
            80
          </div>
        </div>
      )
    },
    {
      id: 'aviator',
      title: 'AVIA',
      tag: 'NEW',
      subtitle: 'Crash Multiplier 500x',
      bgGradient: 'from-[#0a2540] via-[#0b1a30] to-[#0c1117]',
      accentColor: '#FF3366',
      iconVisual: (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="text-5xl animate-bounce drop-shadow-[0_0_20px_rgba(255,51,102,0.8)]">
            ✈️
          </div>
          <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 mt-1">
            AVIA
          </span>
        </div>
      )
    },
    {
      id: 'crazy-777',
      title: 'GATES OF OLYMPUS',
      tag: 'TOP',
      subtitle: 'Pragmatic Slots & Jackpots',
      bgGradient: 'from-[#2e1a47] via-[#1b102e] to-[#0c1117]',
      accentColor: '#F59E0B',
      iconVisual: (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="text-5xl drop-shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-pulse">
            ⚡
          </div>
          <span className="text-lg font-black tracking-wider text-amber-300">
            ZEUS 777
          </span>
        </div>
      )
    }
  ];

  // All Games List
  const allGames = [
    { id: 'aviator', name: 'Aviator', provider: 'Spribe', category: 'crash', icon: '✈️', color: 'from-red-600 to-rose-700' },
    { id: 'fast-keno', name: 'Fast Keno (80 Balls)', provider: 'In-House', category: 'keno', icon: '🎱', color: 'from-emerald-600 to-teal-800' },
    { id: 'chicken-road', name: 'Chicken Road 2.0', provider: 'InOut', category: 'crash', icon: '🐔', color: 'from-amber-600 to-orange-700' },
    { id: 'crazy-777', name: 'Crazy 777 2', provider: 'Jili', category: 'slots', icon: '🎰', color: 'from-purple-700 to-indigo-900' },
    { id: 'jet-x', name: 'Jet-X', provider: 'SmartSoft', category: 'crash', icon: '🚀', color: 'from-blue-600 to-cyan-800' },
    { id: 'gates-of-olympus', name: 'Gates of Olympus', provider: 'Pragmatic', category: 'slots', icon: '⚡', color: 'from-amber-500 to-yellow-700' },
    { id: 'sweet-bonanza', name: 'Sweet Bonanza', provider: 'Pragmatic', category: 'slots', icon: '🍬', color: 'from-pink-500 to-rose-700' },
    { id: 'sugar-rush', name: 'Sugar Rush', provider: 'Pragmatic', category: 'slots', icon: '🍭', color: 'from-fuchsia-600 to-purple-800' },
  ];

  const filtered = allGames.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-4">
      {/* 1. Hero Promotional Cashback Banner (Exact match to Mela Bet) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1f14] via-[#09150d] to-[#0c1117] border border-[#1b3823] p-4 sm:p-6 shadow-2xl flex items-center justify-between min-h-[150px]">
        {/* Subtle Green Decorative Grid & Neon Angles */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00E676]/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00E676]/60 rounded-br-xl pointer-events-none" />

        {/* Left Banner Text */}
        <div className="flex flex-col gap-1 z-10 max-w-[65%]">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[#00E676] text-black font-black text-[10px] tracking-wider uppercase">
              EDIL BET
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
            UP TO 15% CASHBACK
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-wide">
            ON ALL YOUR LOSSES
          </p>
        </div>

        {/* Right Banner Visual (Stacks of ETB Cash & Safe) */}
        <div className="relative z-10 flex items-center gap-1">
          <div className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(0,230,118,0.4)]">
            💸
          </div>
          <div className="text-4xl sm:text-5xl">
            🏦
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <div className="w-4 h-1.5 rounded-full bg-[#00E676]" />
        </div>
      </div>

      {/* 2. Quick Action Grid (4 Cards: Lucky Spin, Shamo, Coupon, VIP) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Lucky Spin */}
        <div
          onClick={() => onOpenLuckySpin ? onOpenLuckySpin() : onSelectGame('crazy-777')}
          className="bg-[#121924] hover:bg-[#182333] border border-[#1e293b] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transform active:scale-95 shadow-md relative"
        >
          <div className="w-10 h-10 rounded-full bg-[#1b2638] flex items-center justify-center text-xl shadow-inner border border-emerald-500/30">
            🎡
          </div>
          <span className="text-[11px] font-bold text-gray-200 text-center truncate w-full">
            Lucky Spin
          </span>
        </div>

        {/* Card 2: Shamo (With Red NEW Badge) */}
        <div
          onClick={() => onOpenShamo ? onOpenShamo() : onSelectGame('fast-keno')}
          className="bg-[#121924] hover:bg-[#182333] border border-[#1e293b] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transform active:scale-95 shadow-md relative"
        >
          <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-red-600 text-[8px] font-black text-white uppercase">
            NEW
          </span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20">
            ሻሞ
          </div>
          <span className="text-[11px] font-bold text-gray-200 text-center truncate w-full">
            Shamo
          </span>
        </div>

        {/* Card 3: Coupon */}
        <div
          onClick={() => onOpenCoupon ? onOpenCoupon() : onSelectGame('promotions')}
          className="bg-[#121924] hover:bg-[#182333] border border-[#1e293b] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transform active:scale-95 shadow-md relative"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00E676] flex items-center justify-center text-xl">
            🏷️
          </div>
          <span className="text-[11px] font-bold text-gray-200 text-center truncate w-full">
            Coupon
          </span>
        </div>

        {/* Card 4: VIP (With Red NEW Badge) */}
        <div
          onClick={() => onSelectGame('promotions')}
          className="bg-[#121924] hover:bg-[#182333] border border-[#1e293b] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transform active:scale-95 shadow-md relative"
        >
          <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-red-600 text-[8px] font-black text-white uppercase">
            NEW
          </span>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
            👑
          </div>
          <span className="text-[11px] font-bold text-gray-200 text-center truncate w-full">
            VIP
          </span>
        </div>
      </div>

      {/* 3. RECENT BIG WINS Ticker */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shadow-sm shadow-[#00E676]" />
          <h3 className="text-xs font-black tracking-wider text-white uppercase">
            RECENT BIG WINS
          </h3>
        </div>

        {/* Horizontal Scrolling Win Cards */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {recentBigWins.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#121924] border border-[#1f2b3e] rounded-xl p-2 flex flex-col gap-1.5 shrink-0 w-24 sm:w-28 shadow-md"
            >
              {/* Game Thumbnail */}
              <div
                className={`w-full h-12 rounded-lg bg-gradient-to-tr ${item.bg} flex items-center justify-center text-xl shadow-inner`}
              >
                {item.icon}
              </div>

              {/* User row */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-4 h-4 rounded-full ${item.avatarColor} text-white font-black text-[9px] flex items-center justify-center`}
                >
                  {item.avatar}
                </div>
                <span className="text-[10px] text-gray-300 font-semibold truncate">
                  {item.user}
                </span>
              </div>

              {/* Green Win Amount */}
              <span className="text-xs font-black text-[#00E676] font-mono leading-none">
                {item.win}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Search Bar: "Find a Game" */}
      <div className="relative mt-1">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a Game"
          className="w-full h-11 bg-[#121924] border border-[#1f2b3e] rounded-xl pl-10 pr-4 text-xs font-medium text-white placeholder-gray-400 focus:outline-none focus:border-[#00E676] transition-colors"
        />
      </div>

      {/* 5. FEATURED Games Section (Exact Cards: FAST KENO, AVIA, GATES OF OLYMPUS) */}
      <div className="flex flex-col gap-2.5 mt-1">
        <h3 className="text-xs font-black tracking-wider text-white uppercase">
          FEATURED
        </h3>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {featuredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b ${game.bgGradient} border border-[#1f2b3e] hover:border-[#00E676]/60 p-2 sm:p-3 flex flex-col justify-between h-36 sm:h-44 transition-all duration-200 transform active:scale-95 shadow-lg group`}
            >
              {/* Green NEW / TOP Badge */}
              <div className="flex justify-end z-10">
                <span className="px-1.5 py-0.5 rounded bg-[#00E676] text-black font-black text-[8px] uppercase tracking-wider">
                  {game.tag}
                </span>
              </div>

              {/* Game Visual / 3D Icon */}
              <div className="flex-1 flex items-center justify-center my-auto group-hover:scale-105 transition-transform">
                {game.iconVisual}
              </div>

              {/* Game Title */}
              <div className="text-center z-10 mt-1">
                <h4 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase truncate">
                  {game.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. All Other Popular Games (Chicken Road, Jet-X, Slots, etc.) */}
      <div className="flex flex-col gap-2.5 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black tracking-wider text-white uppercase">
            ALL GAMES ({filtered.length})
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">24/7 Verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {filtered.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="bg-[#121924] hover:bg-[#182333] border border-[#1f2b3e] hover:border-[#00E676]/50 rounded-2xl p-3 flex flex-col justify-between h-32 cursor-pointer transition-all transform active:scale-95 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 font-mono">
                  {game.provider}
                </span>
                <span className="text-xs text-[#00E676]">● Live</span>
              </div>

              <div className="flex items-center justify-center my-auto">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${game.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {game.icon}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-black text-white truncate group-hover:text-[#00E676] transition-colors">
                  {game.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
