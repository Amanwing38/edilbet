import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Smartphone, Building2 } from 'lucide-react';
import { UserWallet } from '../types';

interface DepositModalProps {
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

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onRefreshWallet,
  currentUser,
  language
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CBE_BIRR'>('TELEBIRR');
  const [amount, setAmount] = useState<number>(500);
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [smsRawText, setSmsRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const telebirrNumber = '0938749239';
  const cbeAccount = '1000450457047';

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Smart SMS Receipt Parser: Extracts FT... from raw Telebirr SMS
  const handleSmsPaste = (text: string) => {
    setSmsRawText(text);
    // Regex for Telebirr transaction code: FT followed by digits/letters
    const match = text.match(/(FT[A-Z0-9]{8,14}|[A-Z0-9]{10,14})/i);
    if (match) {
      setTransactionId(match[0].toUpperCase());
    } else if (text.trim().length <= 20) {
      setTransactionId(text.trim().toUpperCase());
    }
  };

  const handleConfirmDeposit = async () => {
    const code = transactionId.trim().toUpperCase();
    if (!code) {
      alert(language === 'am' ? 'እባክዎ የቴሌብር ወይም የባንክ ግብይት መለያ (Transaction ID) ያስገቡ!' : 'Please enter your Transaction ID!');
      return;
    }

    if (amount < 50) {
      alert(language === 'am' ? 'ዝቅተኛ ተቀማጭ መጠን 50 ብር ነው!' : 'Minimum deposit is 50 ETB!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create deposit order
      const createRes = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.username || currentUser?.firstName,
          amount,
          paymentMethod,
          senderPhone: telebirrNumber
        })
      });
      const createData = await createRes.json();
      if (!createData.success) {
        throw new Error(createData.error || 'Failed to initialize deposit order');
      }

      // 2. Submit transaction ID confirmation
      const confirmRes = await fetch('/api/wallet/deposit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createData.order.id,
          referenceCode: code
        })
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) {
        throw new Error(confirmData.error || 'Failed to submit proof');
      }

      setIsSubmitting(false);
      setSuccessOrder({
        ...createData.order,
        referenceCode: code
      });
      onRefreshWallet();
    } catch (err: any) {
      setIsSubmitting(false);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#10141d] border border-[#1f283a] rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c2434] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00E676]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {language === 'am' ? 'ገንዘብ አስገባ (Deposit)' : 'Deposit Money'}
              </h2>
              <span className="text-[11px] text-[#00E676] font-bold">
                100% First Deposit Bonus Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#171d2b] hover:bg-[#20293d] border border-[#232f45] flex items-center justify-center text-gray-400 hover:text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* SUCCESS VIEW */}
        {successOrder ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00E676]/20 border-2 border-[#00E676] flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8 text-[#00E676] stroke-[3]" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-black text-white">
                {language === 'am' ? 'የተቀማጭ ጥያቄዎ ደርሷል!' : 'Deposit Submitted!'}
              </h3>
              <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                {language === 'am'
                  ? `የ${amount} ብር ክፍያዎ ተመዝግቧል። የካሸር ማረጋገጫ ሲጠናቀቅ ሂሳብዎ ወዲያውኑ ይሞላል።`
                  : `Your deposit of ${amount} ETB (TxID: ${successOrder.referenceCode}) has been registered and is being processed instantly.`}
              </p>
            </div>

            <div className="w-full p-3 rounded-2xl bg-[#141a26] border border-[#1f283a] text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-bold text-white">{successOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction ID:</span>
                <span className="font-bold text-[#00E676]">{successOrder.referenceCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="font-bold text-white">{amount} ETB</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessOrder(null);
                setTransactionId('');
                setSmsRawText('');
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm tracking-wide shadow-lg shadow-[#00E676]/20 active:scale-95 transition-all"
            >
              {language === 'am' ? 'ወደ ጨዋታው ተመለስ' : 'Back to Game'}
            </button>
          </div>
        ) : (
          /* DEPOSIT FORM */
          <>
            {/* 1. Payment Method Tabs: Telebirr & CBE */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('TELEBIRR')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                  paymentMethod === 'TELEBIRR'
                    ? 'bg-[#152336] border-[#00B4D8] text-white shadow-md'
                    : 'bg-[#131822] border-[#1d2536] text-gray-400 hover:text-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#00B4D8]" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black">Telebirr</span>
                  <span className="text-[9px] text-[#00B4D8] font-bold">ቴሌብር (Fast)</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('CBE_BIRR')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                  paymentMethod === 'CBE_BIRR'
                    ? 'bg-[#251833] border-[#9d4edd] text-white shadow-md'
                    : 'bg-[#131822] border-[#1d2536] text-gray-400 hover:text-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#9d4edd]" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black">CBE Bank</span>
                  <span className="text-[9px] text-[#9d4edd] font-bold">ንግድ ባንክ</span>
                </div>
              </button>
            </div>

            {/* 2. Official Receiver Account Card */}
            <div className="p-3.5 rounded-2xl bg-[#141b27] border border-[#212d40] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold">
                  {paymentMethod === 'TELEBIRR' ? 'የቴሌብር ቁጥር (Send to Telebirr):' : 'የCBE ሂሳብ ቁጥር (CBE Account):'}
                </span>
                <span className="text-[10px] text-[#00E676] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> የተረጋገጠ
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#0b0f16] border border-[#1b2536] rounded-xl px-3 py-2.5">
                <span className="font-mono text-base font-black tracking-wider text-white">
                  {paymentMethod === 'TELEBIRR' ? telebirrNumber : cbeAccount}
                </span>
                <button
                  onClick={() => handleCopy(paymentMethod === 'TELEBIRR' ? telebirrNumber : cbeAccount)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00E676] hover:bg-[#00c853] text-black text-xs font-black active:scale-95 transition-all shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{copied ? 'ኮፒ ተደርጓል' : 'ኮፒ (Copy)'}</span>
                </button>
              </div>

              <span className="text-[10px] text-gray-400 leading-tight">
                {paymentMethod === 'TELEBIRR'
                  ? '💡 በቴሌብር አፕሊኬሽን ወይም በ *127# ወደ ላይኛው ቁጥር ገንዘብ ያስተላልፉ።'
                  : '💡 በCBE Birr ወይም በሞባይል ባንኪንግ ወደ ላይኛው ሂሳብ ቁጥር ያስተላልፉ።'}
              </span>
            </div>

            {/* 3. Quick Deposit Amount Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-400">
                {language === 'am' ? 'የተቀማጭ መጠን (Amount ETB):' : 'Deposit Amount (ETB):'}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {quickAmounts.slice(0, 4).map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                      amount === val
                        ? 'bg-[#00E676] text-black border-[#00E676] shadow-md shadow-[#00E676]/20'
                        : 'bg-[#151c28] text-gray-300 border-[#222c3d] hover:bg-[#1d2738]'
                    }`}
                  >
                    {val} Br
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {quickAmounts.slice(4).map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                      amount === val
                        ? 'bg-[#00E676] text-black border-[#00E676] shadow-md shadow-[#00E676]/20'
                        : 'bg-[#151c28] text-gray-300 border-[#222c3d] hover:bg-[#1d2738]'
                    }`}
                  >
                    {val} Br
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Transaction ID or SMS Receipt Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-300">
                  {language === 'am' ? 'የግብይት መለያ (Transaction ID / SMS) *' : 'Transaction ID / SMS Receipt *'}
                </label>
                {transactionId && (
                  <span className="text-[10px] text-[#00E676] font-mono font-bold">
                    ✓ Found: {transactionId}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="e.g. FT2610298412"
                className="w-full h-11 rounded-xl bg-[#0c1017] border border-[#212d40] px-3 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#00E676] uppercase tracking-wider"
              />

              {/* Paste Full SMS Helper */}
              <div className="flex flex-col gap-1 pt-1">
                <textarea
                  rows={2}
                  value={smsRawText}
                  onChange={(e) => handleSmsPaste(e.target.value)}
                  placeholder="ወይም ከ 127 የደረሰዎትን ሙሉ SMS እዚህ ጋር ይለጥፉ (Or paste full SMS here)"
                  className="w-full rounded-xl bg-[#0b0e15] border border-[#1c2434] p-2 text-xs text-gray-300 placeholder:text-gray-500 focus:outline-none focus:border-[#00E676]/50 resize-none"
                />
              </div>
            </div>

            {/* 5. Submit Button */}
            <button
              onClick={handleConfirmDeposit}
              disabled={isSubmitting || !transactionId.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm tracking-wider shadow-lg shadow-[#00E676]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-98 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>እየተረጋገጠ ነው (Verifying)...</span>
              ) : (
                <>
                  <span>{language === 'am' ? 'ተቀማጭ አረጋግጥ (Confirm Deposit)' : 'Confirm Deposit'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
