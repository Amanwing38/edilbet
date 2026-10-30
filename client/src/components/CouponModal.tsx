import React, { useState } from 'react';
import { Tag, Check, Sparkles, X } from 'lucide-react';
import { UserWallet } from '../types';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  onRefreshWallet: () => void;
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
  };
  language: 'am' | 'en';
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onRefreshWallet,
  currentUser,
  language
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successBonus, setSuccessBonus] = useState<number | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      alert('Please enter a coupon code.');
      return;
    }

    setIsRedeeming(true);

    // Valid bonus codes
    const validCodes: Record<string, number> = {
      EDILBET: 50,
      WELCOME100: 100,
      FREE25: 25,
      MELABET: 50,
      VIPBONUS: 200
    };

    const bonusAmount = validCodes[trimmed] || 25;

    try {
      await fetch('/api/promotions/claim-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'EB-741891'
        },
        body: JSON.stringify({ amount: bonusAmount, reason: `Coupon Code: ${trimmed}` })
      });

      setIsRedeeming(false);
      setSuccessBonus(bonusAmount);
      onRefreshWallet();
    } catch {
      setIsRedeeming(false);
      setSuccessBonus(bonusAmount);
      onRefreshWallet();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#10141d] border border-[#1f283a] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
        <div className="w-full flex items-center justify-between border-b border-[#1c2434] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00E676] flex items-center justify-center text-lg">
              🏷️
            </div>
            <div className="text-left">
              <h3 className="font-black text-base text-white">Redeem Coupon (ኩፖን)</h3>
              <span className="text-[10px] text-gray-400">Enter promo code for free bonus</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#171d2b] hover:bg-[#20293d] border border-[#232f45] flex items-center justify-center text-gray-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {successBonus ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-[#00E676]/20 border border-[#00E676] flex items-center justify-center text-2xl text-[#00E676]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-black text-white text-base">Coupon Redeemed!</h4>
              <p className="text-xs text-gray-400 mt-1">
                You received <span className="font-bold text-[#00E676]">+{successBonus} ETB</span> in bonus balance!
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessBonus(null);
                setCode('');
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-[#00E676] text-black font-black text-xs uppercase"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-gray-400">Enter Promo Code:</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EDILBET or WELCOME100"
                className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-black text-white text-sm focus:outline-none focus:border-[#00E676] uppercase tracking-wider"
              />
              <p className="text-[10px] text-gray-500">Hint: Try code EDILBET or WELCOME100</p>
            </div>

            <button
              onClick={handleRedeem}
              disabled={isRedeeming || !code.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00E676]/25 disabled:opacity-40 transition-all"
            >
              {isRedeeming ? 'Checking...' : 'Redeem Coupon'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
