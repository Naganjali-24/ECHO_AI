
import React from 'react';
import { Home, List, UserIcon, ShieldAlert, Globe } from './Icons';

// Simplified view modes matching the 5-item navigation bar in the mockup
export type ViewMode = 'DASHBOARD' | 'FEED' | 'ADMIN' | 'PROFILE' | 'DISASTERS' | 'GEO';

interface StickyFooterProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  translations: any;
  theme: 'DARK' | 'LIGHT';
}

const StickyFooter: React.FC<StickyFooterProps> = ({ currentView, setView, translations: t, theme }) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: t.dashboard, icon: <Home className="w-5 h-5" /> },
    { id: 'FEED', label: t.intel, icon: <List className="w-5 h-5" /> },
    { id: 'GEO', label: t.geo, icon: <Globe className="w-5 h-5" /> },
    { id: 'DISASTERS', label: t.hub, icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'PROFILE', label: t.unit, icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center px-4 pb-4 pt-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none">
      <div className={`w-full max-w-lg border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex justify-around items-stretch h-18 backdrop-blur-3xl transition-all pointer-events-auto overflow-hidden ${
        theme === 'DARK' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xl shadow-slate-200/50'
      }`}>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-all duration-300 relative group outline-none ${
                isActive ? 'text-tactical' : (theme === 'DARK' ? 'text-slate-500 hover:text-slate-100' : 'text-slate-400 hover:text-slate-950')
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-tactical shadow-[0_0_20px_#0496c7]" />
              )}
              
              <div className={`transition-all duration-300 transform group-hover:scale-110 group-active:scale-90 ${isActive ? 'scale-110 translate-y-[-2px]' : 'scale-100 opacity-60 group-hover:opacity-100 group-hover:translate-y-[-2px]'}`}>
                {item.icon}
              </div>
              
              <span className={`text-[7px] font-black uppercase tracking-tighter mt-1.5 transition-all text-center leading-[1.1] ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`}>
                {item.label}
              </span>

              {/* Hover Indicator */}
              {!isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-tactical/50 group-hover:w-1/2 transition-all duration-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StickyFooter;
