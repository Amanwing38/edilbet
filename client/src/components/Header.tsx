import React, { useState } from 'react';
import { Eye, EyeOff, PlusCircle, ShieldAlert, Globe } from 'lucide-react';
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
  onToggleLanguage,
  userId,
  userName
}) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-[#0f141c]/95 backdrop-blur-md border-b border-[#1e2638] px-3 sm:px-4 py-2.5 flex items-center justify-between">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00c853] to-[#00E676] flex items-center justify-center font-black text-black text-xl shadow-lg shadow-[#00E676]/20">
          ዕ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white">
              {language === 'am' ? 'ዕድል ቤት' : 'Edil Bet'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30">
              ET
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {userId && (
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                {userId}
              </span>
            )}
            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px] sm:max-w-none">
              {userName || (language === 'am' ? 'የእርስዎ ዕድል፣ የእርስዎ ድል' : 'Your chance, your number')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Balance, Language, Deposit, Admin */}
      <div className="flex items-center gap-2.5">
        {/* Language Toggle */}
        <button
          onClick={onToggleLanguage}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161d29] hover:bg-[#1e2638] border border-[#232e42] text-xs font-semibold text-gray-300 transition-all"
          title="Switch Language (English / አማርኛ)"
        >
          <Globe className="w-3.5 h-3.5 text-[#00E676]" />
          <span>{language === 'am' ? 'EN' : 'አማ'}</span>
        </button>

        {/* Admin Cashier Console Button */}
        <button
          onClick={onOpenAdmin}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a2333] hover:bg-[#222e44] border border-[#2d3d5a] text-xs font-bold text-amber-400 transition-all shadow-sm"
          title="Open Cashier Console (Approve Telebirr Deposits)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Cashier</span>
          {pendingDepositsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
              {pendingDepositsCount}
            </span>
          )}
        </button>

        {/* Balance Display */}
        <div className="flex items-center bg-[#151c28] border border-[#202b3d] rounded-xl px-3 py-1.5 gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-bold text-[10px] text-amber-400">
            Br
          </div>
          <span className="text-sm font-bold tracking-tight text-white font-mono min-w-[70px]">
            {showBalance ? `${wallet.availableBalance.toFixed(2)}` : '••••••'}
          </span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-400 hover:text-white transition-colors"
            title={showBalance ? 'Hide Balance' : 'Show Balance'}
          >
            {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Deposit Button */}
        <button
          onClick={onOpenDeposit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-extrabold text-xs tracking-wide shadow-lg shadow-[#00E676]/25 transition-all transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'am' ? 'ገንዘብ ያስገቡ' : 'Deposit'}</span>
        </button>
      </div>
    </header>
  );
};
