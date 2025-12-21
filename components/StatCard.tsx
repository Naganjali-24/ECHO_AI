
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  theme?: 'DARK' | 'LIGHT';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, theme = 'DARK' }) => {
  return (
    <div className={`border rounded-[1.5rem] p-5 shadow-xl transition-all duration-500 group hover:translate-y-[-4px] ${
      theme === 'DARK' 
        ? 'bg-slate-900 border-slate-800 hover:border-tactical/40 hover:shadow-[0_15px_30px_-10px_rgba(4,150,199,0.2)]' 
        : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-blue-900/5 hover:border-blue-300 hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.1)]'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${
            theme === 'DARK' ? 'text-slate-500 group-hover:text-slate-400' : 'text-blue-400 group-hover:text-blue-600'
          }`}>{title}</p>
          <h3 className={`text-3xl font-black italic tracking-tighter transition-colors ${
            theme === 'DARK' ? 'text-white group-hover:text-tactical' : 'text-slate-900 group-hover:text-tactical'
          }`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
          theme === 'DARK' ? 'bg-slate-800 border border-slate-700/50' : 'bg-blue-100/50 border border-blue-100'
        }`}>
          <div className={`${colorClass} transition-transform`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
