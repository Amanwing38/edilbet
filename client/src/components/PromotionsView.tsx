import React, { useState } from 'react';
import { Gift, Zap, DollarSign, CloudRain, Clock, Sparkles } from 'lucide-react';

interface PromotionsViewProps {
  onOpenDeposit: () => void;
  onOpenMoneyRain: () => void;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({
  onOpenDeposit,
  onOpenMoneyRain,
  onRefreshWallet,
  language
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'offers' | 'cashback' | 'rain' | 'history'>('offers');
  const [couponCode, setCouponCode] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/promotions/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (!data.success) {
        setCouponStatus(data.error);
      } else {
        setCouponStatus(data.message);
        onRefreshWallet();
        setTimeout(() => {
          setShowCouponModal(false);
          setCouponStatus(null);
          setCouponCode('');
        }, 1500);
      }
    } catch (err: any) {
      setCouponStatus('Redeem failed: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Top Coupon Code Banner (Matching Image 1) */}
      <div className="bg-[#131b28] border border-[#1f2b3e] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Have a coupon code?</h4>
            <p className="text-xs text-gray-400">Redeem it for cash or free rounds.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCouponModal(true)}
          className="px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-md shadow-[#00E676]/20 transition-all"
        >
          Redeem
        </button>
      </div>

      {/* Sub Tabs: Offers / Cashback / Rain / History */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-md">
        <button
          onClick={() => setActiveSubTab('offers')}
          className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'offers'
              ? 'bg-[#1b2537] text-white border border-[#2d3e58] shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4 text-[#00E676]" />
          <span>Offers</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cashback')}
          className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'cashback'
              ? 'bg-[#1b2537] text-white border border-[#2d3e58] shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>Cashback</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rain')}
          className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'rain'
              ? 'bg-[#1b2537] text-white border border-[#2d3e58] shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <span>Rain</span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'history'
              ? 'bg-[#1b2537] text-white border border-[#2d3e58] shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-400" />
          <span>History</span>
        </button>
      </div>

      {/* OFFERS TAB CARDS */}
      {activeSubTab === 'offers' && (
        <div className="flex flex-col gap-4">
          {/* Card 1: MORNING DEPOSIT BOOST (Matching Screenshot 1) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#111926] via-[#162235] to-[#121926] border border-[#22314a] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-2 max-w-lg z-10">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#1e2a3f] text-gray-300 w-fit border border-[#2f4262]">
                SCHEDULED
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MORNING DEPOSIT BOOST
              </h3>
              <p className="text-xs text-gray-300">
                Get 10.00% reward on your next eligible action.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#202c40] text-[11px] font-bold text-gray-300">
                  Min Br 50
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#00E676]/15 border border-[#00E676]/40 text-[11px] font-bold text-[#00E676] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 06:00 - 12:00
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#202c40] text-[11px] font-bold text-gray-300">
                  Until Dec 31
                </span>
              </div>
              <button
                onClick={onOpenDeposit}
                className="mt-3 px-6 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider w-fit shadow-lg shadow-[#00E676]/20 transition-all"
              >
                Play Games
              </button>
            </div>
            {/* 3D Visual Accent */}
            <div className="text-right z-10 shrink-0">
              <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-[#00E676] to-amber-300 drop-shadow-lg">
                10%
              </span>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Bonus Boost
              </div>
            </div>
          </div>

          {/* Card 2: 100% FIRST DEPOSIT MATCH (Matching Screenshot 2) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#111926] via-[#1a2333] to-[#121926] border border-[#22314a] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-2 max-w-lg z-10">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#00E676]/20 text-[#00E676] w-fit border border-[#00E676]/40">
                ACTIVE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                100% MATCH ON YOUR FIRST DEPOSIT UP TO 500 BIRR
              </h3>
              <p className="text-xs text-gray-300">
                Claim your 500 Birr Bonus! Get a 100% match on your first deposit. Claim your bonus now and get right into the game.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#202c40] text-[11px] font-bold text-gray-300">
                  Min Br 49
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#202c40] text-[11px] font-bold text-gray-300">
                  Until Dec 31
                </span>
              </div>
              <button
                onClick={onOpenDeposit}
                className="mt-3 px-6 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider w-fit shadow-lg shadow-[#00E676]/20 transition-all"
              >
                Deposit
              </button>
            </div>
            <div className="text-right z-10 shrink-0">
              <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-amber-200 drop-shadow-lg">
                100%
              </span>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Up to 500 Br
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASHBACK TAB (Matching Screenshot 2) */}
      {activeSubTab === 'cashback' && (
        <div className="bg-[#111926] border border-[#22314a] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-lg">
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#00E676]/20 text-[#00E676] w-fit border border-[#00E676]/40">
              ACTIVE
            </span>
            <h3 className="text-2xl font-black text-white">DAILY CASHBACK</h3>
            <p className="text-xs text-gray-300">
              Get 15% cashback on your losses every day. Credited automatically at midnight!
            </p>
            <span className="px-2.5 py-1 rounded-lg bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 text-xs font-bold w-fit mt-1">
              15% cashback on daily cash losses
            </span>
            <button
              onClick={onOpenDeposit}
              className="mt-3 px-6 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider w-fit shadow-lg"
            >
              Play Games
            </button>
          </div>
          <div className="text-right shrink-0">
            <span className="text-6xl font-black text-[#00E676] font-mono">15%</span>
            <div className="text-xs font-bold text-gray-400">Automated Daily Rebate</div>
          </div>
        </div>
      )}

      {/* RAIN TAB */}
      {activeSubTab === 'rain' && (
        <div className="bg-[#111926] border border-[#22314a] rounded-3xl p-6 shadow-xl flex flex-col items-center text-center gap-3">
          <CloudRain className="w-12 h-12 text-[#00E676] animate-bounce" />
          <h3 className="text-xl font-black text-white">Money Rain Airdrops</h3>
          <p className="text-xs text-gray-300 max-w-md">
            Active players receive random free ETB cash drops in their wallet while playing Aviator, Keno, or slots!
          </p>
          <button
            onClick={onOpenMoneyRain}
            className="px-6 py-2.5 rounded-xl bg-[#00E676] text-black font-black text-xs uppercase tracking-wider shadow-md shadow-[#00E676]/20"
          >
            View Recent Winners
          </button>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="bg-[#111926] border border-[#22314a] rounded-3xl p-6 shadow-xl flex flex-col gap-2 text-center py-10">
          <p className="text-xs text-gray-400">No expired bonus history.</p>
        </div>
      )}

      {/* Coupon Redeem Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <h3 className="font-extrabold text-sm text-white">Redeem Coupon Code</h3>
              <button
                onClick={() => { setShowCouponModal(false); setCouponStatus(null); }}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">Promo Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. EDIL2026"
                className="w-full h-11 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-3 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#00E676] uppercase"
              />
              <span className="text-[10px] text-gray-500">Try demo codes: <code>EDIL2026</code>, <code>TELEBIRR</code></span>
            </div>
            {couponStatus && (
              <div className="p-2.5 rounded-xl bg-[#172233] border border-[#24344d] text-xs font-bold text-amber-300 text-center">
                {couponStatus}
              </div>
            )}
            <button
              onClick={handleRedeemCoupon}
              className="w-full py-3 rounded-xl bg-[#00E676] text-black font-extrabold text-xs shadow-lg shadow-[#00E676]/25"
            >
              Confirm Redeem
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
