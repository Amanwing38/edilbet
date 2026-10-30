import React, { useState, useEffect } from 'react';
import { Copy, Check, Clock, AlertTriangle, ArrowDownLeft, ArrowUpRight, ShieldCheck, PlayCircle } from 'lucide-react';
import { UserWallet, Transaction, DepositOrder } from '../types';

interface WalletViewProps {
  wallet: UserWallet;
  onRefreshWallet: () => void;
  language: 'am' | 'en';
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
  };
}

export const WalletView: React.FC<WalletViewProps> = ({
  wallet,
  onRefreshWallet,
  language,
  currentUser
}) => {
  const [subTab, setSubTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CBE_BIRR'>('TELEBIRR');

  // Deposit Form State
  const [senderPhone, setSenderPhone] = useState('0938749239');
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [activeOrder, setActiveOrder] = useState<DepositOrder | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(30 * 60);
  const [copied, setCopied] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [transactionIdProof, setTransactionIdProof] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Withdrawal Form State
  const [withdrawMethod, setWithdrawMethod] = useState<'TELEBIRR' | 'CBE_BIRR'>('TELEBIRR');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(200);
  const [withdrawPhone, setWithdrawPhone] = useState('0938749239');
  const [withdrawCbeAccount, setWithdrawCbeAccount] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<Transaction[]>([]);

  // 30-Minute Countdown Timer for Active Deposit Order
  useEffect(() => {
    if (!activeOrder) return;
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveOrder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrder]);

  // Load Transactions History
  useEffect(() => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) setHistoryList(data.transactions);
      })
      .catch(() => {});
  }, [subTab]);

  // Copy to Clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Place Deposit Order
  const handlePlaceDepositOrder = async () => {
    if (depositAmount < 50 || depositAmount > 10000) {
      alert('Deposit amount must be between 50 and 10,000 ETB.');
      return;
    }
    if (!senderPhone || senderPhone.length < 9) {
      alert('Please enter a valid 10-digit phone number (e.g. 09xxxxxxxx).');
      return;
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.username || currentUser?.firstName,
          amount: depositAmount,
          paymentMethod,
          senderPhone
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
        return;
      }
      setActiveOrder(data.order);
      setTimeLeftSec(30 * 60);
    } catch (err: any) {
      alert('Failed to place deposit order: ' + err.message);
    }
  };

  // Submit Transaction ID Proof (I've Paid)
  const handleSubmitProof = async () => {
    if (!activeOrder || !transactionIdProof.trim()) {
      alert('Please enter your Telebirr Transaction ID from your SMS.');
      return;
    }

    setIsSubmittingProof(true);
    try {
      const res = await fetch('/api/wallet/deposit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          referenceCode: transactionIdProof
        })
      });
      const data = await res.json();
      setIsSubmittingProof(false);
      if (!data.success) {
        alert(data.error);
        return;
      }

      alert('✓ Payment submitted successfully! Awaiting cashier verification. Your balance will update in moments.');
      setShowProofModal(false);
      setActiveOrder(null);
      setTransactionIdProof('');
      onRefreshWallet();
    } catch (err: any) {
      setIsSubmittingProof(false);
      alert('Error: ' + err.message);
    }
  };

  // Submit Withdrawal Request
  const handleRequestWithdrawal = async () => {
    const fee = 50;
    const totalRequired = withdrawAmount + fee;

    if (withdrawAmount < 50) {
      alert(language === 'am' ? 'ዝቅተኛ የማውጣት መጠን 50 ብር ነው።' : 'Minimum withdrawal amount is 50 ETB.');
      return;
    }
    if (withdrawAmount > 10000) {
      alert(language === 'am' ? 'ከፍተኛ የማውጣት መጠን በአንድ ጊዜ 10,000 ብር ነው።' : 'Maximum withdrawal per request is 10,000 ETB.');
      return;
    }

    if (withdrawMethod === 'TELEBIRR') {
      if (!withdrawPhone || withdrawPhone.trim().length < 9) {
        alert(language === 'am' ? 'እባክዎ ትክክለኛ የቴሌብር ስልክ ቁጥር ያስገቡ (ለምሳሌ 09xxxxxxxx)!' : 'Please enter a valid Telebirr phone number!');
        return;
      }
    } else {
      if (!withdrawCbeAccount || withdrawCbeAccount.trim().length < 10) {
        alert(language === 'am' ? 'እባክዎ ትክክለኛ የንግድ ባንክ (CBE) 13 አሃዝ ሂሳብ ቁጥር ያስገቡ!' : 'Please enter a valid 13-digit CBE bank account number!');
        return;
      }
      if (!withdrawAccountName || withdrawAccountName.trim().length < 3) {
        alert(language === 'am' ? 'እባክዎ የሂሳብ ባለቤቱን ሙሉ ስም ያስገቡ!' : 'Please enter the bank account holder full name!');
        return;
      }
    }

    if (wallet.availableBalance < totalRequired) {
      alert(
        language === 'am'
          ? `ቀሪ ሂሳብዎ በቂ አይደለም! ${withdrawAmount} ብር ለማውጣት ከ 50 ብር የዝውውር ክፍያ ጋር ድምር ${totalRequired} ብር ያስፈልጋል። የአሁኑ ቀሪ ሂሳብዎ ${wallet.availableBalance.toFixed(2)} ብር ነው።`
          : `Insufficient balance! To withdraw ${withdrawAmount} ETB + 50 ETB transfer fee, you need ${totalRequired} ETB. Your balance is ${wallet.availableBalance.toFixed(2)} ETB.`
      );
      return;
    }

    setIsWithdrawing(true);
    setWithdrawSuccessMsg(null);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.username || currentUser?.firstName,
          amount: withdrawAmount,
          paymentMethod: withdrawMethod,
          phone: withdrawPhone,
          cbeAccount: withdrawCbeAccount,
          accountHolderName: withdrawAccountName
        })
      });
      const data = await res.json();
      setIsWithdrawing(false);
      if (!data.success) {
        alert(data.error);
        return;
      }

      setWithdrawSuccessMsg(
        language === 'am'
          ? `✓ የ ${withdrawAmount} ብር የማውጣት ጥያቄዎ በተሳካ ሁኔታ ተልኳል! ከሂሳብዎ ${totalRequired} ብር (50 ብር የዝውውር ክፍያ ጨምሮ) ተቀንሷል። ገንዘቡ በደቂቃዎች ውስጥ ወደ ${withdrawMethod === 'TELEBIRR' ? 'ቴሌብርዎ' : 'ንግድ ባንክዎ'} ይላካል።`
          : `✓ Withdrawal of ${withdrawAmount} ETB submitted! ${totalRequired} ETB deducted (includes 50 ETB transfer fee). Sent to your ${withdrawMethod === 'TELEBIRR' ? 'Telebirr' : 'CBE account'} shortly.`
      );
      onRefreshWallet();
    } catch (err: any) {
      setIsWithdrawing(false);
      alert('Withdrawal error: ' + err.message);
    }
  };

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Sub Tabs: Deposit / Withdraw / History */}
      <div className="bg-[#121824] border border-[#1e283b] rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-lg">
        <button
          onClick={() => { setSubTab('deposit'); setActiveOrder(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
            subTab === 'deposit'
              ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {language === 'am' ? 'ገንዘብ ያስገቡ (Deposit)' : 'Deposit'}
        </button>
        <button
          onClick={() => { setSubTab('withdraw'); setActiveOrder(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
            subTab === 'withdraw'
              ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {language === 'am' ? 'ገንዘብ ያውጡ (Withdraw)' : 'Withdraw'}
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
            subTab === 'history'
              ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {language === 'am' ? 'ታሪክ (History)' : 'History'}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DEPOSIT VIEW                                                  */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'deposit' && (
        <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          {!activeOrder ? (
            <>
              {/* Video Help Header */}
              <div className="flex items-center justify-between bg-[#182130] border border-[#243247] rounded-2xl p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <PlayCircle className="w-4 h-4 text-[#00E676]" />
                  <span>Watch How to Deposit</span>
                </div>
                <span className="text-[10px] text-[#00E676] font-bold">1 min tutorial</span>
              </div>

              {/* Payment Method Selector Pills */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('TELEBIRR')}
                  className={`flex-1 py-3 px-4 rounded-2xl border font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'TELEBIRR'
                      ? 'border-[#00E676] bg-[#00E676]/10 text-white shadow-md shadow-[#00E676]/20'
                      : 'border-[#1e283b] bg-[#161f2e] text-gray-400 hover:bg-[#1b273b]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                  <span>TELEBIRR</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('CBE_BIRR')}
                  className={`flex-1 py-3 px-4 rounded-2xl border font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'CBE_BIRR'
                      ? 'border-amber-400 bg-amber-400/10 text-white shadow-md shadow-amber-400/20'
                      : 'border-[#1e283b] bg-[#161f2e] text-gray-400 hover:bg-[#1b273b]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>CBE BIRR</span>
                </button>
              </div>

              {/* Sender Phone Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400">
                  {paymentMethod === 'TELEBIRR' ? 'Telebirr number you will pay from * (10 digits)' : 'CBE mobile phone number *'}
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-bold text-white focus:outline-none focus:border-[#00E676] text-sm"
                />
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400">
                    Amount (ETB) * (50 - 10,000 ETB)
                  </label>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {depositAmount} Br
                  </span>
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-black text-white text-lg focus:outline-none focus:border-[#00E676]"
                />
                {/* Quick Chips */}
                <div className="grid grid-cols-6 gap-1.5 mt-1">
                  {[50, 200, 500, 1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        depositAmount === amt
                          ? 'bg-[#00E676] text-black font-black'
                          : 'bg-[#182130] text-gray-300 hover:bg-[#202c40] border border-[#243147]'
                      }`}
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo code link */}
              <button
                onClick={() => alert('Enter coupon codes under the Promotions tab!')}
                className="text-xs font-bold text-[#00E676] hover:underline self-start"
              >
                Have a promo code?
              </button>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceDepositOrder}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black text-base tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all transform active:scale-98"
              >
                Place Order
              </button>
            </>
          ) : (
            /* PAYMENT DETAILS SCREEN (Matching Image 3) */
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
                <span className="text-sm font-extrabold text-white">← Payment Details</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold font-mono">
                  {activeOrder.orderNumber}
                </span>
              </div>

              {/* Big Gold Amount Banner */}
              <div className="bg-[#182130] border border-[#253347] rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Amount to Pay
                </span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {activeOrder.amount} ETB
                </span>
              </div>

              {/* Recipient Account Details (Hidden name, 1-click Copy) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400">
                  {paymentMethod === 'TELEBIRR' ? 'Send to Telebirr Account Number:' : 'Send to CBE Account Number:'}
                </span>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0e14] border border-[#202b3d]">
                  <span className="font-mono font-black text-lg text-white tracking-wider">
                    {paymentMethod === 'TELEBIRR' ? '0938749239' : '1000450457047'}
                  </span>
                  <button
                    onClick={() => handleCopy(paymentMethod === 'TELEBIRR' ? '0938749239' : '1000450457047')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#192333] hover:bg-[#233147] border border-[#283852] text-xs font-bold text-[#00E676] transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  *Open your Telebirr app or dial <code className="text-[#00E676] font-mono">*127#</code>. Transfer exact amount. The account holder name will be confirmed automatically inside your app.
                </p>
              </div>

              {/* 30-Minute Circular Expiration Timer */}
              <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-[#141b27] border border-[#1f2b3e]">
                <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-sm font-bold text-gray-300">Expiration time:</span>
                <span className="text-lg font-black font-mono text-amber-400 tracking-wider">
                  {timeFormatted}
                </span>
              </div>

              {/* I've Paid CTA */}
              <button
                onClick={() => setShowProofModal(true)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black text-base tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>✓ I've Paid</span>
              </button>

              {/* Footer controls: Cancel / Dispute */}
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <button
                  onClick={() => setActiveOrder(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  Cancel deposit
                </button>
                <button
                  onClick={() => alert('Support hotline: +251 989 414 202 or Telegram @EdilBetSupport')}
                  className="text-amber-400 hover:text-amber-300"
                >
                  Raise a dispute
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* WITHDRAWAL VIEW (Telebirr or CBE Bank with 50 ETB Fee)         */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'withdraw' && (
        <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          {/* Success Banner */}
          {withdrawSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-bold text-emerald-300 leading-relaxed flex items-center gap-2">
              <Check className="w-5 h-5 text-[#00E676] shrink-0" />
              <span>{withdrawSuccessMsg}</span>
            </div>
          )}

          {/* Available to Withdraw Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0b0e14] border border-[#1b2436]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {language === 'am' ? 'የሚወጣ ቀሪ ሂሳብ' : 'Available Balance'}
              </span>
              <span className="text-2xl font-black text-[#00E676] font-mono">
                {wallet.availableBalance.toFixed(2)} ETB
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block">የዝውውር ክፍያ (Fee)</span>
              <span className="text-xs font-mono font-black text-amber-400">50.00 ETB</span>
            </div>
          </div>

          {/* Payment Method Switcher: Telebirr vs CBE Bank */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-300 uppercase tracking-wider">
              {language === 'am' ? 'የክፍያ ዘዴ ይምረጡ (Choose Payout Method) *' : 'Payout Method *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWithdrawMethod('TELEBIRR')}
                className={`py-3.5 px-4 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all ${
                  withdrawMethod === 'TELEBIRR'
                    ? 'border-[#00E676] bg-[#00E676]/15 text-white shadow-lg shadow-[#00E676]/20'
                    : 'border-[#1e283b] bg-[#161f2e] text-gray-400 hover:bg-[#1b273b]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                <span>📱 TELEBIRR (ቴሌብር)</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod('CBE_BIRR')}
                className={`py-3.5 px-4 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all ${
                  withdrawMethod === 'CBE_BIRR'
                    ? 'border-amber-400 bg-amber-400/15 text-white shadow-lg shadow-amber-400/20'
                    : 'border-[#1e283b] bg-[#161f2e] text-gray-400 hover:bg-[#1b273b]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>🏦 CBE (ንግድ ባንክ)</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs based on Method */}
          {withdrawMethod === 'TELEBIRR' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-300">
                {language === 'am' ? 'ገንዘቡ የሚላክበት የቴሌብር ስልክ ቁጥር *' : 'Telebirr Phone Number *'}
              </label>
              <input
                type="text"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="09xxxxxxxx ወይም 07xxxxxxxx"
                className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-bold text-white focus:outline-none focus:border-[#00E676] text-sm"
              />
              <span className="text-[10px] text-gray-400">
                {language === 'am' ? 'ገንዘቡ በቀጥታ ወደዚህ የቴሌብር ቁጥር ይላካል።' : 'Funds will be transferred directly to this Telebirr number.'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">
                  {language === 'am' ? 'የኢትዮጵያ ንግድ ባንክ (CBE) ሂሳብ ቁጥር *' : 'CBE Bank Account Number (13 digits) *'}
                </label>
                <input
                  type="text"
                  value={withdrawCbeAccount}
                  onChange={(e) => setWithdrawCbeAccount(e.target.value)}
                  placeholder="1000xxxxxxxxxx"
                  className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-bold text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">
                  {language === 'am' ? 'የሂሳብ ባለቤቱ ሙሉ ስም *' : 'Account Holder Full Name *'}
                </label>
                <input
                  type="text"
                  value={withdrawAccountName}
                  onChange={(e) => setWithdrawAccountName(e.target.value)}
                  placeholder="ለምሳሌ፡ አበበ ከበደ / Abebe Kebede"
                  className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-bold text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">
                {language === 'am' ? 'የማውጣት መጠን (ETB) *' : 'Withdrawal Amount (ETB) *'}
              </label>
              <span className="text-xs font-mono font-black text-amber-400">
                {withdrawAmount} Br
              </span>
            </div>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Math.max(0, Number(e.target.value)))}
              className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-black text-white text-lg focus:outline-none focus:border-[#00E676]"
            />
            {/* Quick Chips */}
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {[100, 200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWithdrawAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    withdrawAmount === amt
                      ? 'border-[#00E676] bg-[#00E676]/20 text-[#00E676]'
                      : 'border-[#1e283b] bg-[#161f2e] text-gray-400 hover:bg-[#1b273b]'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Fee & Balance Deduction Breakdown */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-[#1b2436] flex flex-col gap-2.5 text-xs">
            <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">
              {language === 'am' ? 'የክፍያና የዝውውር ዝርዝር (Payout Breakdown)' : 'Payout Breakdown'}
            </span>
            <div className="flex justify-between text-gray-300">
              <span>{language === 'am' ? 'ወደ እርስዎ የሚላከው' : 'Payout to You'}</span>
              <strong className="text-white font-mono">{withdrawAmount.toFixed(2)} ETB</strong>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>{language === 'am' ? 'የዝውውር ክፍያ (Transfer Fee)' : 'Transfer Fee'}</span>
              <strong className="text-amber-400 font-mono">50.00 ETB</strong>
            </div>
            <div className="h-px bg-[#1e283b] my-0.5" />
            <div className="flex justify-between text-white font-bold">
              <span>{language === 'am' ? 'ከአካውንትዎ የሚቀነሰው ድምር' : 'Total Debited from Balance'}</span>
              <strong className="text-[#00E676] font-mono text-sm">
                {(withdrawAmount + 50).toFixed(2)} ETB
              </strong>
            </div>

            {wallet.availableBalance < withdrawAmount + 50 ? (
              <div className="mt-1 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-bold text-red-400 text-center">
                ⚠️ {language === 'am'
                  ? `ቀሪ ሂሳብዎ በቂ አይደለም! ${(withdrawAmount + 50).toFixed(2)} ብር ያስፈልጋል (ያልዎት፡ ${wallet.availableBalance.toFixed(2)} ብር)`
                  : `Insufficient balance! You need ${(withdrawAmount + 50).toFixed(2)} ETB (Available: ${wallet.availableBalance.toFixed(2)} ETB)`}
              </div>
            ) : (
              <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                <span>{language === 'am' ? 'ከማውጣት በኋላ የሚቀር' : 'Remaining Balance'}:</span>
                <span className="font-mono font-bold text-gray-300">
                  {(wallet.availableBalance - (withdrawAmount + 50)).toFixed(2)} ETB
                </span>
              </div>
            )}
          </div>

          {/* Request Withdrawal CTA */}
          <button
            onClick={handleRequestWithdrawal}
            disabled={isWithdrawing || wallet.availableBalance < withdrawAmount + 50 || withdrawAmount < 50}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00E676] hover:from-[#00b248] hover:to-[#00d66c] text-black font-black text-base tracking-wider uppercase shadow-xl shadow-[#00E676]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isWithdrawing ? (
              <span>በማስተናገድ ላይ...</span>
            ) : (
              <span>
                {language === 'am'
                  ? `ገንዘብ አውጡ (${withdrawAmount} ብር + 50 ብር ክፍያ)`
                  : `Confirm Withdrawal (${withdrawAmount} ETB)`}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* HISTORY VIEW                                                  */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'history' && (
        <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">
            Transaction History ({historyList.length})
          </span>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {historyList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No transactions yet.</p>
            ) : (
              historyList.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#161f2e] border border-[#222e42] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        tx.amount > 0 ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-white">{tx.type}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} • {tx.orderNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-black ${tx.amount > 0 ? 'text-[#00E676]' : 'text-gray-300'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ETB
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Transaction ID Submission Modal (✓ I've Paid proof) */}
      {showProofModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                <h3 className="font-extrabold text-base text-white">Enter Transaction ID</h3>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Check your Telebirr SMS. Copy and paste the <strong>Transaction ID</strong> (e.g. <code className="text-amber-400 font-mono">FT2610...</code>) so the cashier can verify and credit your wallet.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">Telebirr Transaction ID / SMS Code *</label>
              <input
                type="text"
                value={transactionIdProof}
                onChange={(e) => setTransactionIdProof(e.target.value)}
                placeholder="e.g. FT2610298192"
                className="w-full h-12 rounded-xl bg-[#0b0e14] border border-[#202b3d] px-4 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#00E676] uppercase"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowProofModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#1b2536] hover:bg-[#223046] text-gray-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProof}
                disabled={isSubmittingProof || !transactionIdProof.trim()}
                className="flex-1 py-3 rounded-xl bg-[#00E676] text-black font-extrabold text-xs shadow-lg shadow-[#00E676]/25 disabled:opacity-40"
              >
                {isSubmittingProof ? 'Submitting...' : 'Submit & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
