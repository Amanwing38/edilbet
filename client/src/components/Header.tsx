import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { UserWallet } from '../types';

interface HeaderProps {
  wallet: UserWallet;
  onOpenDeposit: () => void;
  onOpenAdmin: () => void;
  pendingDepositsCount: number;
  language: 'am' | 'en';
  onToggleLanguage: () => void;
  userId?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  onOpenDeposit,
  onOpenAdmin,
  pendingDepositsCount,
  language,
  userId,
  userName
}) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-[#0c1117] border-b border-[#1b2332] px-3 sm:px-4 py-2.5 flex items-center justify-between">
      {/* Left: Brand Logo & Title (Matching Mela Bet / Edil Bet) */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-[#141d28] border border-[#233348] flex items-center justify-center shadow-md">
          <span className="text-[#00E676] font-black text-sm tracking-tighter">
            EB
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-black tracking-tight text-[#00E676]">
            Edil Bet
          </h1>
        </div>
      </div>

      {/* Right: Wallet Balance Pill + Deposit Button */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Balance Pill: Gold 'Br' Coin + Amount + Eye + Dropdown */}
        <div className="flex items-center bg-[#151d29] border border-[#212d40] rounded-xl px-2.5 py-1.5 gap-2">
          {/* Circular Gold Coin */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black text-[10px] flex items-center justify-center shadow-sm">
            Br
          </div>

          {/* Balance Amount */}
          <span className="text-sm font-black tracking-tight text-white font-mono">
            {showBalance ? `${wallet.availableBalance.toFixed(2)}` : '••••••'}
          </span>

          {/* Eye Toggle */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-400 hover:text-white transition-colors p-0.5"
            title={showBalance ? 'Hide Balance' : 'Show Balance'}
          >
            {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Dropdown Chevron */}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Solid Bright Green Deposit Button */}
        <button
          onClick={onOpenDeposit}
          className="px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-[#00E676]/25 transition-all transform active:scale-95"
        >
          {language === 'am' ? 'ገንዘብ አስገባ' : 'Deposit'}
        </button>
      </div>
    </header>
  );
};
