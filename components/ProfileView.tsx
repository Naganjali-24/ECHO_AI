
import React from 'react';
import { User } from '../types';
import { Award, LogOut, CheckCircle, ShieldAlert, BarChart, Globe, Zap, Moon, Sun, Clock } from './Icons';
import { Language } from '../services/i18nService';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  translations: any;
  theme: 'DARK' | 'LIGHT';
  onThemeChange: (theme: 'DARK' | 'LIGHT') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, language, onLanguageChange, translations: t, theme, onThemeChange }) => {
  const solvedCount = user.solvedIncidents.length;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono">
      {/* Profile Header */}
      <div className={`border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl transition-all duration-500 ${
        theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-br from-white via-white to-blue-50 border-blue-100 shadow-blue-900/5'
      }`}>
        <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 ${theme === 'DARK' ? 'bg-tactical' : 'bg-blue-400'}`}></div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-700 shadow-2xl ${
              theme === 'DARK' ? 'border-tactical/40 bg-slate-950 group-hover:border-tactical' : 'border-blue-100 bg-white group-hover:border-tactical'
            }`}>
                <ShieldAlert className="w-12 h-12 text-tactical mb-2" />
                <span className="text-[10px] font-black text-slate-500 tracking-[0.3em]">OPERATOR</span>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-emerald-500 p-2 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl">
                <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="space-y-2">
                <span className="text-[11px] font-black text-tactical uppercase tracking-[0.4em] italic">{t.authUnit}</span>
                <h2 className={`text-5xl font-black italic tracking-tighter uppercase ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{user.name}</h2>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className={`px-4 py-2 border rounded-xl text-[10px] font-black tracking-widest uppercase ${
                  theme === 'DARK' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-blue-100 text-slate-600 shadow-sm'
                }`}>{user.email}</div>
                <div className="px-4 py-2 bg-tactical/10 text-tactical border border-tactical/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{t.specialist}</div>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className={`px-8 py-5 border rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 shadow-xl active:scale-95 ${
              theme === 'DARK' ? 'bg-slate-950 hover:bg-red-900/10 border-slate-800 text-slate-500' : 'bg-white hover:bg-red-50 border-blue-100 text-slate-400'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {t.terminate}
          </button>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className={`border p-8 rounded-[2.5rem] space-y-6 shadow-xl transition-all ${
        theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-blue-900/5'
      }`}>
        <h3 className={`text-[11px] font-black flex items-center gap-3 uppercase tracking-[0.4em] italic ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
            <Globe className="w-4 h-4 text-tactical" />
            {t.language}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {(['EN', 'ES', 'FR', 'JP'] as Language[]).map((lang) => (
                <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${
                        language === lang 
                        ? 'bg-tactical text-white border-tactical shadow-lg shadow-tactical/20' 
                        : (theme === 'DARK' ? 'bg-slate-950 border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-blue-50 hover:text-tactical shadow-sm')
                    }`}
                >
                    {lang === 'EN' ? 'English' : lang === 'ES' ? 'Español' : lang === 'FR' ? 'Français' : '日本語'}
                </button>
            ))}
        </div>
      </div>

      {/* Performance Metrics 2x2 Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Metric 1 */}
        <div className={`border p-8 rounded-[2.5rem] group shadow-xl transition-all duration-500 hover:translate-y-[-8px] ${
          theme === 'DARK' 
            ? 'bg-slate-900 border-slate-800 hover:border-tactical/50 hover:shadow-[0_25px_50px_-12px_rgba(4,150,199,0.3)]' 
            : 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.15)] shadow-blue-900/5'
        }`}>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 transition-colors group-hover:text-tactical">{t.objectives}</h3>
            <p className={`text-6xl font-black italic tracking-tighter transition-all ${theme === 'DARK' ? 'text-white' : 'text-slate-900'} group-hover:scale-110 origin-left`}>
              {solvedCount}
            </p>
        </div>

        {/* Metric 2 */}
        <div className={`border p-8 rounded-[2.5rem] group shadow-xl transition-all duration-500 hover:translate-y-[-8px] ${
          theme === 'DARK' 
            ? 'bg-slate-900 border-slate-800 hover:border-red-500/50 hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.2)]' 
            : 'bg-white border-blue-100 hover:border-red-300 hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.15)] shadow-red-900/5'
        }`}>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 transition-colors group-hover:text-red-500">{t.riskMitigated}</h3>
            <p className={`text-6xl font-black italic tracking-tighter transition-all ${theme === 'DARK' ? 'text-white' : 'text-red-500'} group-hover:scale-110 origin-left`}>
              {user.totalRiskMitigated}
            </p>
        </div>

        {/* Metric 3 */}
        <div className={`border p-8 rounded-[2.5rem] group shadow-xl transition-all duration-500 hover:translate-y-[-8px] ${
          theme === 'DARK' 
            ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.2)]' 
            : 'bg-white border-blue-100 hover:border-emerald-300 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.15)] shadow-blue-900/5'
        }`}>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 transition-colors group-hover:text-emerald-500">{t.efficiency}</h3>
            <p className={`text-6xl font-black italic tracking-tighter transition-all ${theme === 'DARK' ? 'text-white' : 'text-slate-900'} group-hover:scale-110 origin-left`}>
              98<span className="text-tactical text-3xl">%</span>
            </p>
        </div>

        {/* Metric 4 - Added for 2x2 balance */}
        <div className={`border p-8 rounded-[2.5rem] group shadow-xl transition-all duration-500 hover:translate-y-[-8px] ${
          theme === 'DARK' 
            ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.2)]' 
            : 'bg-white border-blue-100 hover:border-indigo-300 hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.15)] shadow-blue-900/5'
        }`}>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 transition-colors group-hover:text-indigo-500">Response Speed</h3>
            <p className={`text-6xl font-black italic tracking-tighter transition-all ${theme === 'DARK' ? 'text-white' : 'text-slate-900'} group-hover:scale-110 origin-left`}>
              1.2<span className="text-indigo-400 text-3xl">s</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
