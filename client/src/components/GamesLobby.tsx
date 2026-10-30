import React, { useState } from 'react';
import { Flame, Star, Sparkles, Plane, CircleDot, Bomb, Dices } from 'lucide-react';

interface GamesLobbyProps {
  onSelectGame: (gameId: string) => void;
  language: 'am' | 'en';
}

export const GamesLobby: React.FC<GamesLobbyProps> = ({ onSelectGame, language }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const games = [
    {
      id: 'aviator',
      name: 'Aviator',
      provider: 'Spribe',
      category: 'crash',
      tag: 'HOT',
      isPlayable: true,
      color: 'from-red-600 to-rose-700',
      icon: '✈️'
    },
    {
      id: 'fast-keno',
      name: 'Fast Keno (80 Balls)',
      provider: 'In-House',
      category: 'keno',
      tag: 'NEW',
      isPlayable: true,
      color: 'from-emerald-600 to-teal-800',
      icon: '🎱'
    },
    {
      id: 'chicken-road',
      name: 'Chicken Road 2.0',
      provider: 'InOut',
      category: 'crash',
      tag: 'POPULAR',
      isPlayable: true,
      color: 'from-amber-600 to-orange-700',
      icon: '🐔'
    },
    {
      id: 'crazy-777',
      name: 'Crazy 777 2',
      provider: 'Jili',
      category: 'slots',
      tag: 'JACKPOT',
      isPlayable: true,
      color: 'from-purple-700 to-indigo-900',
      icon: '🎰'
    },
    {
      id: 'jet-x',
      name: 'Jet-X',
      provider: 'SmartSoft',
      category: 'crash',
      tag: 'NEW',
      isPlayable: true,
      color: 'from-blue-600 to-cyan-800',
      icon: '🚀'
    },
    {
      id: 'gates-of-olympus',
      name: 'Gates of Olympus',
      provider: 'Pragmatic Play',
      category: 'slots',
      tag: 'TOP',
      isPlayable: true,
      color: 'from-amber-500 to-yellow-700',
      icon: '⚡'
    },
    {
      id: 'sweet-bonanza',
      name: 'Sweet Bonanza 1000',
      provider: 'Pragmatic Play',
      category: 'slots',
      tag: 'HOT',
      isPlayable: true,
      color: 'from-pink-500 to-rose-700',
      icon: '🍬'
    },
    {
      id: 'sugar-rush',
      name: 'Sugar Rush',
      provider: 'Pragmatic Play',
      category: 'slots',
      tag: 'NEW',
      isPlayable: true,
      color: 'from-fuchsia-600 to-purple-800',
      icon: '🍭'
    },
    {
      id: 'coin-strike',
      name: 'Coin Strike: Hold & Win',
      provider: 'Playson',
      category: 'slots',
      tag: 'NEW',
      isPlayable: true,
      color: 'from-yellow-600 to-amber-800',
      icon: '🪙'
    },
    {
      id: 'big-bass',
      name: 'Big Bass Bonanza',
      provider: 'Pragmatic Play',
      category: 'slots',
      tag: 'CLASSIC',
      isPlayable: true,
      color: 'from-blue-500 to-teal-700',
      icon: '🎣'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Games', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'crash', label: 'Crash / Multiplier', icon: <Flame className="w-4 h-4" /> },
    { id: 'keno', label: 'Keno & Lottery', icon: <CircleDot className="w-4 h-4" /> },
    { id: 'slots', label: 'Slots', icon: <Dices className="w-4 h-4" /> }
  ];

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter((g) => g.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeCategory === cat.id
                ? 'bg-[#00E676] text-black shadow-lg shadow-[#00E676]/25'
                : 'bg-[#151c28] hover:bg-[#1c2637] text-gray-300 border border-[#212c3f]'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Featured Banner Showcase (Aviator & Keno) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aviator Featured Card */}
        <div
          onClick={() => onSelectGame('aviator')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-rose-900 to-[#121824] border border-red-500/30 p-6 shadow-2xl transition-all transform hover:-translate-y-1 hover:border-red-400"
        >
          <div className="flex flex-col gap-2 relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-black font-black text-[10px] tracking-wider uppercase w-fit">
              #1 POPULAR
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AVIATOR
            </h3>
            <p className="text-xs text-gray-300 max-w-xs">
              Watch the plane soar and cash out before it flies away! Multipliers up to 500x.
            </p>
            <button className="mt-3 px-5 py-2 rounded-xl bg-red-600 group-hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider w-fit shadow-lg shadow-red-600/30 transition-all">
              Play Aviator
            </button>
          </div>
          <div className="absolute right-4 bottom-2 text-7xl select-none opacity-80 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            ✈️
          </div>
        </div>

        {/* Fast Keno Featured Card */}
        <div
          onClick={() => onSelectGame('fast-keno')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-[#121824] border border-[#00E676]/30 p-6 shadow-2xl transition-all transform hover:-translate-y-1 hover:border-[#00E676]"
        >
          <div className="flex flex-col gap-2 relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-[#00E676] text-black font-black text-[10px] tracking-wider uppercase w-fit">
              INSTANT WIN
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              FAST KENO
            </h3>
            <p className="text-xs text-gray-300 max-w-xs">
              Pick 1 to 10 numbers. 20 winning balls drawn live every round! Up to 10,000x jackpot.
            </p>
            <button className="mt-3 px-5 py-2 rounded-xl bg-[#00E676] group-hover:bg-[#00c853] text-black font-extrabold text-xs uppercase tracking-wider w-fit shadow-lg shadow-[#00E676]/30 transition-all">
              Play Keno
            </button>
          </div>
          <div className="absolute right-4 bottom-2 text-7xl select-none opacity-80 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
            🎱
          </div>
        </div>
      </div>

      {/* Grid of All Games (Matching Screenshots 2, 3, 4, 5) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#1c2637] pb-2">
          <span className="text-sm font-black text-white uppercase tracking-wider">
            ALL GAMES ({filteredGames.length})
          </span>
          <span className="text-xs font-bold text-gray-400 font-mono">Real-time ETB</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#141b26] hover:bg-[#1a2333] border border-[#1f2b3e] hover:border-[#00E676]/60 p-3 flex flex-col justify-between h-48 transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
            >
              {/* Badge */}
              <div className="flex items-center justify-between z-10">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    game.tag === 'HOT'
                      ? 'bg-red-500 text-white'
                      : game.tag === 'NEW'
                      ? 'bg-[#00E676] text-black'
                      : 'bg-amber-400 text-black'
                  }`}
                >
                  {game.tag}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">{game.provider}</span>
              </div>

              {/* Game Icon & Visual */}
              <div className="flex items-center justify-center my-auto">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${game.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {game.icon}
                </div>
              </div>

              {/* Title & Play Button */}
              <div className="flex flex-col gap-1 z-10">
                <h4 className="text-xs font-extrabold text-white truncate group-hover:text-[#00E676] transition-colors">
                  {game.name}
                </h4>
                <div className="w-full py-1.5 rounded-lg bg-[#1f2b3e] group-hover:bg-[#00E676] text-gray-300 group-hover:text-black font-black text-[10px] text-center uppercase tracking-wider transition-all">
                  Play Now
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
