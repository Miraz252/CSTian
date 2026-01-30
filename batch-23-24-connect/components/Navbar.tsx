
import React from 'react';
import { AppView } from '../types';

interface NavbarProps {
  activeView: AppView;
  setView: (view: AppView) => void;
  unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, setView, unreadCount = 0 }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 md:bg-white/80 md:backdrop-blur-md">
      <div className="max-w-xl mx-auto flex justify-between px-4">
        <NavButton 
          active={activeView === 'dashboard'} 
          onClick={() => setView('dashboard')} 
          label="Home"
          icon={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>}
        />
        <NavButton 
          active={activeView === 'notices'} 
          onClick={() => setView('notices')} 
          label="Notices"
          icon={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>}
        />
        <NavButton 
          active={activeView === 'chat'} 
          onClick={() => setView('chat')} 
          label="Chat"
          badge={unreadCount > 0 ? unreadCount : undefined}
          icon={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.4 8.38 8.38 0 0 1 3.8.9L21 4.5z"/>}
        />
        <NavButton 
          active={activeView === 'results'} 
          onClick={() => setView('results')} 
          label="Result"
          icon={<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>}
        />
        <NavButton 
          active={activeView === 'profile'} 
          onClick={() => setView('profile')} 
          label="Profile"
          icon={<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>}
        />
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center py-3 px-2 flex-1 transition-all relative ${active ? 'text-blue-600' : 'text-gray-400'}`}
  >
    <div className="relative">
      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {icon}
      </svg>
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm animate-bounce">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-semibold">{label}</span>
    {active && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
  </button>
);

export default Navbar;
