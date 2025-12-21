import React from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { MapPin, Eye, Globe } from './Icons';

interface IncidentCardProps {
  incident: IncidentPost;
  onResolve?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  translations: any;
  theme: 'DARK' | 'LIGHT';
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick, translations: t, theme }) => {
  const getStatusColor = (status: TriageLevel) => {
    switch (status) {
      case TriageLevel.RED: return 'bg-tactical/10 border-tactical/40 text-tactical';
      case TriageLevel.YELLOW: return 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500';
      case TriageLevel.GREEN: return 'bg-green-500/10 border-green-500/40 text-green-500';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-tactical bg-tactical/10 border-tactical/30';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div 
      onClick={onClick}
      className={`backdrop-blur-md border rounded-[2rem] p-6 transition-all duration-500 cursor-pointer group hover:translate-y-[-10px] animate-in fade-in duration-300 relative overflow-hidden ${
        theme === 'DARK' 
          ? `bg-slate-900/60 border-slate-800 shadow-xl shadow-black/40 hover:border-tactical/50 hover:shadow-[0_30px_60px_-12px_rgba(4,150,199,0.3)]` 
          : `bg-gradient-to-br from-white via-white to-blue-50 border-blue-100 shadow-lg shadow-blue-900/5 hover:border-tactical hover:shadow-[0_30px_60px_-12px_rgba(59,130,246,0.2)]`
      } ${incident.status === TriageLevel.RED && theme === 'DARK' ? 'hover:border-tactical/50 hover:shadow-[0_30px_60px_-12px_rgba(4,150,199,0.25)]' : ''}`}
    >
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-tactical/0 group-hover:bg-tactical/5 transition-colors duration-700 pointer-events-none"></div>

      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 scale-90 group-hover:scale-100 z-10">
        <div className="bg-tactical p-2.5 rounded-xl shadow-lg shadow-tactical/30">
            <Eye className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex items-start gap-4 mb-5 relative z-10">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-sm font-black shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:bg-tactical group-hover:text-white group-hover:border-tactical ${
          theme === 'DARK' 
            ? 'bg-slate-800 border-slate-700/50 text-tactical' 
            : 'bg-blue-50 border-blue-100 text-tactical'
        }`}>
            {incident.author.substring(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-black truncate transition-colors ${theme === 'DARK' ? 'text-white group-hover:text-tactical' : 'text-slate-900 group-hover:text-tactical'}`}>{incident.author}</p>
                {incident.sourceUrl && (
                    <a 
                      href={incident.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-tactical hover:scale-110 transition-all"
                    >
                      <Globe className="w-3 h-3" />
                    </a>
                )}
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest transition-all ${
                  theme === 'DARK' ? 'bg-slate-800 text-slate-400 border-slate-700 group-hover:border-tactical/50' : 'bg-blue-100/50 text-blue-600 border-blue-200 group-hover:border-blue-400'
                }`}>
                    {incident.source}
                </span>
                <p className="text-[10px] font-mono text-slate-500 tracking-tighter uppercase font-black">{new Date(incident.timestamp).toLocaleTimeString()}</p>
            </div>
        </div>
      </div>

      <p className={`mb-6 text-sm leading-relaxed line-clamp-3 font-medium relative z-10 transition-colors ${theme === 'DARK' ? 'text-slate-400 group-hover:text-slate-100' : 'text-slate-600 group-hover:text-slate-900'}`}>
        {incident.text}
      </p>

      <div className={`flex items-center justify-between border-t pt-5 relative z-10 transition-colors ${theme === 'DARK' ? 'border-slate-800/50 group-hover:border-tactical/20' : 'border-blue-50 group-hover:border-blue-200'}`}>
        <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-tactical/60 group-hover:text-tactical group-hover:scale-110 transition-all" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px] group-hover:text-slate-300 transition-colors">{incident.location || 'COORD_PEND'}</span>
        </div>
        <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black border tracking-[0.2em] shadow-sm transition-all group-hover:scale-110 ${getStatusColor(incident.status)}`}>
                {incident.status}
            </div>
            <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black border tracking-[0.2em] shadow-sm transition-all group-hover:scale-110 ${getRiskColor(incident.riskScore)}`}>
                {incident.riskScore}%
            </div>
        </div>
      </div>
      
      {/* Visual Accent for Light Mode */}
      {theme === 'LIGHT' && (
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-200/50 group-hover:scale-150 transition-all duration-700"></div>
      )}
    </div>
  );
};

export default IncidentCard;