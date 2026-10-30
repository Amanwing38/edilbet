import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AviatorGame } from './components/AviatorGame';
import { FastKenoGame } from './components/FastKenoGame';
import { ChickenRoadGame } from './components/ChickenRoadGame';
import { SlotGame } from './components/SlotGame';
import { GamesLobby } from './components/GamesLobby';
import { WalletView } from './components/WalletView';
import { PromotionsView } from './components/PromotionsView';
import { AffiliateView } from './components/AffiliateView';
import { MoneyRainModal } from './components/MoneyRainModal';
import { AdminCashierModal } from './components/AdminCashierModal';
import { DepositModal } from './components/DepositModal';
import { LuckySpinModal } from './components/LuckySpinModal';
import { ShamoModal } from './components/ShamoModal';
import { CouponModal } from './components/CouponModal';
import { UserWallet, MoneyRainDrop } from './types';
import { Ticket, Phone, Globe, ShieldCheck, MessageSquare } from 'lucide-react';

interface CurrentUser {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  role: string;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('games');
  const [selectedGame, setSelectedGame] = useState<string>('lobby');
  const [language, setLanguage] = useState<'am' | 'en'>('am');

  // Active User State
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 'EB-741891',
    telegramId: 8148611275,
    username: 'DriveAddis',
    firstName: 'DriveAddis',
    role: 'admin'
  });

  // Wallet State
  const [wallet, setWallet] = useState<UserWallet>({
    availableBalance: 196.21,
    bonusBalance: 0.60,
    wagerRemaining: 54.00,
    totalDeposited: 500,
    totalWithdrawn: 0
  });

  // Modals & Real-time
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMoneyRainModal, setShowMoneyRainModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showLuckySpinModal, setShowLuckySpinModal] = useState(false);
  const [showShamoModal, setShowShamoModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [moneyRainDrop, setMoneyRainDrop] = useState<MoneyRainDrop | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Authenticate user from Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const urlParams = new URLSearchParams(window.location.search);
    const paramTgId = urlParams.get('tgId');
    const paramName = urlParams.get('name');

    const telegramId = tgUser?.id || (paramTgId ? Number(paramTgId) : 8148611275);
    const firstName = tgUser?.first_name || paramName || 'DriveAddis';
    const username = tgUser?.username || 'Driveaddis4A';

    fetch('/api/user/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        firstName,
        username
      })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCurrentUser(data.user);
          if (data.wallet) setWallet(data.wallet);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize Socket.io connection to backend
  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('wallet_updated', (data: { userId: string; wallet: UserWallet }) => {
      if (!data.userId || data.userId === currentUser.id) {
        setWallet(data.wallet);
      }
    });

    s.on('money_rain_drop', (drop: MoneyRainDrop) => {
      setMoneyRainDrop(drop);
      setShowMoneyRainModal(true);
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser.id]);

  // Fetch Wallet & Latest Rain on load
  const refreshWallet = async () => {
    try {
      const res = await fetch(`/api/wallet?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.wallet) {
        setWallet(data.wallet);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    refreshWallet();
    fetch('/api/promotions/money-rain')
      .then((r) => r.json())
      .then((data) => setMoneyRainDrop(data))
      .catch(() => {});
  }, [currentUser.id]);

  const isGameOpen = activeTab === 'games' && selectedGame !== 'lobby';

  return (
    <div className={`min-h-screen bg-[#0b0e14] text-white flex flex-col ${isGameOpen ? 'pb-2 md:pb-6' : 'pb-20 md:pb-6'} select-none`}>
      {/* Top Header */}
      <Header
        wallet={wallet}
        onOpenDeposit={() => setShowDepositModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        pendingDepositsCount={0}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'am' ? 'en' : 'am')}
        userId={currentUser.id}
        userName={currentUser.firstName}
        showBack={isGameOpen}
        onBack={() => setSelectedGame('lobby')}
      />

      <div className="flex flex-1">
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'games') setSelectedGame('lobby');
          }}
          language={language}
          hiddenOnMobile={isGameOpen}
        />

        {/* Main Content Viewport */}
        <main className={`flex-1 ${isGameOpen ? 'p-1 sm:p-4' : 'p-3 sm:p-5 md:p-6'} overflow-y-auto max-w-7xl mx-auto w-full`}>
          {/* TAB 1: ALL GAMES SUITE & MELA BET HOME SCREEN */}
          {activeTab === 'games' && (
            <div className="flex flex-col gap-2">
              {/* Home Screen: Full Mela Bet Lobby */}
              {selectedGame === 'lobby' && (
                <GamesLobby
                  onSelectGame={(gameId) => {
                    if (gameId === 'jet-x' || gameId === 'aviator') setSelectedGame('aviator');
                    else if (gameId === 'fast-keno') setSelectedGame('fast-keno');
                    else if (gameId === 'chicken-road') setSelectedGame('chicken-road');
                    else if (gameId === 'promotions') setActiveTab('promotions');
                    else setSelectedGame('crazy-777');
                  }}
                  language={language}
                  onOpenLuckySpin={() => setShowLuckySpinModal(true)}
                  onOpenShamo={() => setShowShamoModal(true)}
                  onOpenCoupon={() => setShowCouponModal(true)}
                />
              )}

              {/* Game View: Aviator */}
              {selectedGame === 'aviator' && (
                <AviatorGame
                  socket={socket}
                  wallet={wallet}
                  onRefreshWallet={refreshWallet}
                  language={language}
                  currentUser={currentUser}
                  onBack={() => setSelectedGame('lobby')}
                />
              )}

              {/* Game View: Fast Keno */}
              {selectedGame === 'fast-keno' && (
                <FastKenoGame
                  wallet={wallet}
                  onRefreshWallet={refreshWallet}
                  language={language}
                  currentUser={currentUser}
                  onBack={() => setSelectedGame('lobby')}
                />
              )}

              {/* Game View: Chicken Road */}
              {selectedGame === 'chicken-road' && (
                <ChickenRoadGame
                  wallet={wallet}
                  onRefreshWallet={refreshWallet}
                  language={language}
                  currentUser={currentUser}
                  onBack={() => setSelectedGame('lobby')}
                />
              )}

              {/* Game View: Crazy 777 Slots */}
              {(selectedGame === 'crazy-777' || selectedGame === 'slots') && (
                <SlotGame
                  wallet={wallet}
                  onRefreshWallet={refreshWallet}
                  language={language}
                />
              )}
            </div>
          )}

          {/* TAB 2: RAFFLE */}
          {activeTab === 'raffle' && (
            <div className="max-w-xl mx-auto bg-[#121824] border border-[#1e283b] rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Daily & Weekly Raffle</h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-md">
                Every deposit of 100 ETB automatically enters you into the 50,000 ETB Weekly Jackpot Draw!
              </p>
              <div className="p-4 rounded-2xl bg-[#0b0e14] border border-[#1e283b] w-full text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Current Prize Pool:</span>
                  <span className="font-black text-[#00E676] font-mono text-sm">50,000 ETB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Next Draw In:</span>
                  <span className="font-mono text-amber-400 font-bold">14h 22m 10s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Your Account ID:</span>
                  <span className="font-mono text-[#00E676] font-bold">#{currentUser.id}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('wallet')}
                className="w-full py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00c853] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00E676]/20"
              >
                Deposit to Get Tickets
              </button>
            </div>
          )}

          {/* TAB 3: PROMOTIONS */}
          {activeTab === 'promotions' && (
            <PromotionsView
              onOpenDeposit={() => setActiveTab('wallet')}
              onOpenMoneyRain={() => setShowMoneyRainModal(true)}
              onRefreshWallet={refreshWallet}
              language={language}
            />
          )}

          {/* TAB 4: WALLET */}
          {activeTab === 'wallet' && (
            <WalletView
              wallet={wallet}
              onRefreshWallet={refreshWallet}
              language={language}
              currentUser={currentUser}
            />
          )}

          {/* TAB 5: AFFILIATE */}
          {activeTab === 'affiliate' && (
            <AffiliateView language={language} />
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-md mx-auto bg-[#121824] border border-[#1e283b] rounded-3xl p-6 shadow-xl flex flex-col gap-5">
              <div className="flex items-center gap-4 border-b border-[#1f2a3e] pb-4">
                <div className="w-14 h-14 rounded-full bg-[#00E676] text-black font-black text-2xl flex items-center justify-center">
                  {currentUser.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">{currentUser.firstName}</h3>
                  <span className="text-xs text-[#00E676] font-mono font-bold">Account: #{currentUser.id}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#0b0e14] border border-[#1e283b]">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#00E676]" /> Telebirr Number
                  </span>
                  <span className="font-mono font-bold text-white">0938749239</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#0b0e14] border border-[#1e283b]">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00E676]" /> Language
                  </span>
                  <span className="font-bold text-white">{language === 'am' ? 'አማርኛ (Amharic)' : 'English'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#0b0e14] border border-[#1e283b]">
                  <span className="text-gray-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00E676]" /> Account Status
                  </span>
                  <span className="font-bold text-[#00E676]">Verified Player ({currentUser.role})</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="https://t.me/EdilBetSupport"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-[#182130] hover:bg-[#202c40] border border-[#25334a] text-center text-xs font-bold text-white flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-[#00E676]" />
                  <span>Contact 24/7 Telegram Support</span>
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Money Rain Winners Modal */}
      {showMoneyRainModal && moneyRainDrop && (
        <MoneyRainModal
          drop={moneyRainDrop}
          onClose={() => setShowMoneyRainModal(false)}
          language={language}
        />
      )}

      {/* Fast In-Game Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        wallet={wallet}
        onRefreshWallet={refreshWallet}
        currentUser={currentUser}
        language={language}
      />

      {/* Lucky Spin Wheel Modal */}
      <LuckySpinModal
        isOpen={showLuckySpinModal}
        onClose={() => setShowLuckySpinModal(false)}
        wallet={wallet}
        onRefreshWallet={refreshWallet}
        currentUser={currentUser}
        language={language}
      />

      {/* Shamo Mystery Chests Modal */}
      <ShamoModal
        isOpen={showShamoModal}
        onClose={() => setShowShamoModal(false)}
        wallet={wallet}
        onRefreshWallet={refreshWallet}
        currentUser={currentUser}
        language={language}
      />

      {/* Coupon Promo Code Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        wallet={wallet}
        onRefreshWallet={refreshWallet}
        currentUser={currentUser}
        language={language}
      />

      {/* Cashier Admin Approval Console */}
      {showAdminModal && (
        <AdminCashierModal
          onClose={() => setShowAdminModal(false)}
          onRefreshWallet={refreshWallet}
          onOpenMoneyRain={() => setShowMoneyRainModal(true)}
        />
      )}
    </div>
  );
};
