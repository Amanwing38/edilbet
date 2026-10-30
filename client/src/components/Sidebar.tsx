import React from 'react';
import { Gamepad2, Ticket, Gift, Wallet, Users, User } from 'lucide-react';

export type NavTab = 'games' | 'raffle' | 'promotions' | 'wallet' | 'affiliate' | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: 'am' | 'en';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, language }) => {
  const menuItems: { id: NavTab; labelEn: string; labelAm: string; icon: React.ReactNode }[] = [
    { id: 'games', labelEn: 'Games', labelAm: 'ጨዋታዎች', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'raffle', labelEn: 'Raffle', labelAm: 'ዕጣ / ሎተሪ', icon: <Ticket className="w-5 h-5" /> },
    { id: 'promotions', labelEn: 'Promotions', labelAm: 'ቦነሶች', icon: <Gift className="w-5 h-5" /> },
    { id: 'wallet', labelEn: 'Wallet', labelAm: 'ዋሌት', icon: <Wallet className="w-5 h-5" /> },
    { id: 'affiliate', labelEn: 'Affiliate', labelAm: 'አጋርነት', icon: <Users className="w-5 h-5" /> },
    { id: 'profile', labelEn: 'Profile', labelAm: 'መገለጫ', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#0f141c] border-r border-[#1a2333] p-4 shrink-0 min-h-[calc(100vh-61px)]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">
          MENU
        </span>
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-left ${
                  isActive
                    ? 'bg-[#00E676] text-black shadow-lg shadow-[#00E676]/20 font-extrabold translate-x-1'
                    : 'text-gray-300 hover:text-white hover:bg-[#161d2a]'
                }`}
              >
                <span className={isActive ? 'text-black' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{language === 'am' ? item.labelAm : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Support & Community Footer in Sidebar */}
        <div className="mt-auto pt-6 border-t border-[#1a2333] flex flex-col gap-2">
          <a
            href="https://t.me/EdilBetET"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#161e2b] hover:bg-[#1f2b3d] text-xs font-semibold text-gray-300 transition-colors"
          >
            <span>📢 Channel</span>
            <span className="text-[10px] text-[#00E676] font-bold">@EdilBetET</span>
          </a>
          <a
            href="https://t.me/EdilBetSupport"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#161e2b] hover:bg-[#1f2b3d] text-xs font-semibold text-gray-300 transition-colors"
          >
            <span>💬 Support</span>
            <span className="text-[10px] text-[#00E676] font-bold">Online</span>
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f141c]/95 backdrop-blur-md border-t border-[#1e2638] flex items-center justify-around py-2 px-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-[#00E676]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#00E676]/15' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold tracking-tight">
                {language === 'am' ? item.labelAm : item.labelEn}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
