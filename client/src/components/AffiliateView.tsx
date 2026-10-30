import React, { useState } from 'react';
import { Copy, Check, Share2, Users, FileText, ArrowUpRight, CheckCircle2, Phone, AlertCircle } from 'lucide-react';

interface AffiliateViewProps {
  language: 'am' | 'en';
}

export const AffiliateView: React.FC<AffiliateViewProps> = ({ language }) => {
  const [copied, setCopied] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [payoutPhone, setPayoutPhone] = useState('0938749239');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'statements' | 'players' | 'how'>('players');

  const affiliateId = 'AFF-000106';
  const referralLink = `https://t.me/EdilBetET_bot?startapp=ref_${affiliateId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Edil Bet (ዕድል ቤት)',
        text: 'Join me on Edil Bet — play Aviator & Keno with instant Telebirr payouts!',
        url: referralLink
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">
      {/* Header Profile Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00E676] text-black font-black text-xl flex items-center justify-center shadow-lg shadow-[#00E676]/30">
            A
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400">Affiliate</span>
            <h3 className="text-lg font-black text-white">Hi, Aman</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-[#00E676] font-extrabold px-2 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/30">
            Active • ID: {affiliateId}
          </span>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 shadow-xl flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Total Affiliate Balance
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-gray-400">ETB</span>
          <span className="text-4xl font-black text-white font-mono tracking-tight">0.00</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 pt-1 border-t border-[#1d273a] w-full justify-center">
          <span>Available: <strong className="text-[#00E676] font-mono">0.00 ETB</strong></span>
          <span>•</span>
          <span>On hold: <strong className="text-amber-400 font-mono">0.00 ETB</strong> (7d)</span>
        </div>
      </div>

      {/* 4 Square Quick Actions (Matching Image 1) */}
      <div className="grid grid-cols-4 gap-2.5">
        <button
          onClick={() => alert('Withdrawal unlocks at ETB 500 with at least 3 active players.')}
          className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#161f2e] hover:bg-[#1f2b3e] border border-[#233147] transition-all text-xs font-bold text-gray-300"
        >
          <div className="w-9 h-9 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span>Withdraw</span>
        </button>
        <button
          onClick={handleNativeShare}
          className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#161f2e] hover:bg-[#1f2b3e] border border-[#233147] transition-all text-xs font-bold text-gray-300"
        >
          <div className="w-9 h-9 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <span>Share</span>
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#161f2e] hover:bg-[#1f2b3e] border border-[#233147] transition-all text-xs font-bold text-gray-300"
        >
          <div className="w-9 h-9 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span>Players</span>
        </button>
        <button
          onClick={() => setShowTermsModal(true)}
          className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#161f2e] hover:bg-[#1f2b3e] border border-[#233147] transition-all text-xs font-bold text-gray-300"
        >
          <div className="w-9 h-9 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <span>Terms</span>
        </button>
      </div>

      {/* Commission Promo Card (Matching Image 1) */}
      <div className="bg-[#b9f6ca] rounded-3xl p-5 text-black shadow-xl flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-black/70">
          YOUR COMMISSION
        </span>
        <h3 className="text-xl font-black tracking-tight leading-tight">
          Earn 10% of your players' losses
        </h3>
        <span className="text-xs font-bold text-black/80">
          25% from next Monday
        </span>
        <p className="text-[11px] font-medium text-black/75 leading-normal">
          Paid weekly from what they lose of their own deposits. Bonus money never counts.
        </p>
        {/* Referral Deep-Link with Copy button */}
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full h-11 rounded-xl bg-white/90 border border-black/10 px-3 text-xs font-mono font-bold text-black select-all"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 h-11 rounded-xl bg-black text-[#00E676] font-black text-xs uppercase flex items-center gap-1.5 shrink-0 shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Chips */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#121824] border border-[#1e283b] p-3 rounded-2xl">
          <div className="text-base font-black text-white font-mono">7d</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold">Holding</div>
        </div>
        <div className="bg-[#121824] border border-[#1e283b] p-3 rounded-2xl">
          <div className="text-base font-black text-[#00E676] font-mono">ETB 500</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold">Min payout</div>
        </div>
        <div className="bg-[#121824] border border-[#1e283b] p-3 rounded-2xl">
          <div className="text-base font-black text-amber-400 font-mono">3</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold">Players to cash out</div>
        </div>
      </div>

      {/* Requirements Checklist Card */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <span className="font-extrabold text-xs text-white uppercase tracking-wider">
          Requirements
        </span>
        <div className="flex flex-col gap-2.5 text-xs font-semibold text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
            <span>The program is open</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
            <span>A player account in good standing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
            <span>Deposited at least ETB 50</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
            <span>Not inside the rejoin wait</span>
          </div>
        </div>
      </div>

      {/* Telebirr Payout Destination */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-2">
        <span className="font-extrabold text-xs text-white uppercase tracking-wider">
          Telebirr payout number
        </span>
        <p className="text-[11px] text-gray-400">
          Your default for payouts. You can choose another number when you withdraw.
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={payoutPhone}
              onChange={(e) => setPayoutPhone(e.target.value)}
              className="w-full h-11 rounded-xl bg-[#0b0e14] border border-[#1f2a3e] pl-9 pr-3 font-mono font-bold text-white text-xs"
            />
          </div>
          <button
            onClick={() => {
              setIsUpdatingPhone(true);
              setTimeout(() => {
                setIsUpdatingPhone(false);
                alert('Telebirr payout number saved!');
              }, 600);
            }}
            className="px-4 h-11 rounded-xl bg-[#1b2537] hover:bg-[#233147] border border-[#273854] text-xs font-bold text-[#00E676]"
          >
            {isUpdatingPhone ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Your Players Section (Matching Image 2) */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs text-white uppercase tracking-wider">
            Your Players
          </span>
          <button className="text-xs font-bold text-[#00E676] hover:underline">
            See all
          </button>
        </div>

        {/* Horizontal Quick Invite Bar */}
        <div className="flex items-center gap-4 border-b border-[#1f2a3e] pb-3">
          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#00E676] flex items-center justify-center text-[#00E676] group-hover:bg-[#00E676]/10 transition-colors">
              +
            </div>
            <span className="text-[10px] text-gray-400 font-bold">Invite</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-[#00E676] text-black font-black text-lg flex items-center justify-center">
              D
            </div>
            <span className="text-[10px] text-white font-bold">DriveAddis</span>
          </div>
        </div>

        {/* Sub-tabs: Overview / Statements / Players / How it works */}
        <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
          {['Overview', 'Statements', 'Players', 'How it works'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t.toLowerCase().replace(' ', '') as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === t.toLowerCase().replace(' ', '')
                  ? 'bg-[#00E676] text-black font-extrabold'
                  : 'hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Players List Item */}
        <div className="p-3.5 rounded-2xl bg-[#161f2e] border border-[#233147] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00E676] text-black font-black flex items-center justify-center text-base">
              D
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">DriveAddis</div>
              <div className="text-[10px] text-gray-400 font-mono">Joined 10/29/2026</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#1e2a3f] text-gray-300 text-[10px] font-bold border border-[#2e405f]">
            Joined
          </span>
        </div>
      </div>

      {/* Terms & Conditions v2 Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <h3 className="font-black text-base text-white">Terms & Conditions v2</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
              <h4 className="font-bold text-[#00E676] uppercase">1. Definitions</h4>
              <p>• <strong>Company</strong>: Refers to the operator of the መላ / Edil Bet platform.</p>
              <p>• <strong>Net Gaming Revenue (NGR)</strong>: Total Bets minus Total Wins, minus Claimed Bonuses, minus Platform Deductions.</p>
              <h4 className="font-bold text-[#00E676] uppercase">2. Tracking & Attribution</h4>
              <p>• <strong>Permanent Linking</strong>: Players registering via your link are permanently attributed to your affiliate ID.</p>
              <p>• <strong>Last-Click Attribution</strong>: Attribution is given to the final link clicked prior to registration.</p>
              <h4 className="font-bold text-[#00E676] uppercase">3. Commission & Negative Carryover</h4>
              <p>• <strong>Revenue Share</strong>: 10%–25% RevShare based on Net Gaming Revenue.</p>
              <p>• <strong>Negative Carryover</strong>: If referred players win more than they bet, the deficit rolls over until recovered from future positive NGR.</p>
              <h4 className="font-bold text-[#00E676] uppercase">4. Payout Terms</h4>
              <p>• Minimum threshold: <strong>500 ETB</strong>.</p>
              <p>• Minimum active players: <strong>3 Active Players</strong> in the current cycle.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E676] text-black font-extrabold text-xs"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
