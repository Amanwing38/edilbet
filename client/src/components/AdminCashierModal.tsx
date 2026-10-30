import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, RefreshCw, CloudRain, Bell } from 'lucide-react';

interface AdminCashierModalProps {
  onClose: () => void;
  onRefreshWallet: () => void;
  onOpenMoneyRain: () => void;
}

export const AdminCashierModal: React.FC<AdminCashierModalProps> = ({
  onClose,
  onRefreshWallet,
  onOpenMoneyRain
}) => {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/deposits');
      const data = await res.json();
      setPendingDeposits(data.pending || []);
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/deposits/${orderId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✓ Deposit approved! ${data.order.amount} ETB credited.`);
        loadPending();
        onRefreshWallet();
        setTimeout(() => setActionMessage(null), 2500);
      }
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/deposits/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'SMS transaction ID does not match receiver account.' })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Deposit rejected.');
        loadPending();
        setTimeout(() => setActionMessage(null), 2000);
      }
    } catch (err: any) {
      alert('Reject failed: ' + err.message);
    }
  };

  const handleTriggerRain = async () => {
    try {
      const res = await fetch('/api/promotions/money-rain/trigger', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        onOpenMoneyRain();
      }
    } catch (err: any) {
      alert('Failed to trigger rain: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121824] border border-[#1e283b] rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">Cashier Operator Console</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold">
            ✕
          </button>
        </div>

        {/* Action message */}
        {actionMessage && (
          <div className="p-3 rounded-xl bg-[#00E676]/15 border border-[#00E676]/40 text-xs font-bold text-[#00E676] text-center">
            {actionMessage}
          </div>
        )}

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadPending}
            className="flex-1 py-2 px-3 rounded-xl bg-[#182130] hover:bg-[#202c40] border border-[#243147] text-xs font-bold text-gray-300 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
          <button
            onClick={handleTriggerRain}
            className="flex-1 py-2 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Drop Money Rain</span>
          </button>
        </div>

        {/* Pending Orders List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Pending Customer Deposits ({pendingDeposits.length}):
          </span>

          {pendingDeposits.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0b0e14] border border-[#1b2536] text-center text-xs text-gray-400">
              No pending deposit requests. Customer orders will appear here for verification!
            </div>
          ) : (
            pendingDeposits.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-2xl bg-[#161f2e] border border-[#233147] flex flex-col gap-2.5 text-xs shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{order.username}</span>
                    <span className="text-[10px] font-mono text-gray-400">({order.senderPhone})</span>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-sm">{order.amount} ETB</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0e14] border border-[#1f2b3d] text-[11px] font-mono">
                  <span className="text-gray-400">Trans ID / Proof:</span>
                  <span className="text-[#00E676] font-bold">{order.referenceCode || 'Awaiting input'}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleReject(order.id)}
                    className="flex-1 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="flex-1 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-[#00E676]/20"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve & Credit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#1b2536] text-gray-300 font-bold text-xs"
        >
          Close Console
        </button>
      </div>
    </div>
  );
};
