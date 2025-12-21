
import React from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { X, CheckCircle, Activity, Zap, Globe } from './Icons';

interface IncidentDetailModalProps {
  incident: IncidentPost;
  onClose: () => void;
  onResolve?: (id: string) => void;
  translations: any;
}

const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({ incident, onClose, onResolve, translations: t }) => {
  const isCritical = incident.status === TriageLevel.RED;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 font-mono overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="bg-[#020617] w-full max-lg h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative flex flex-col border border-slate-800/50 animate-in fade-in zoom-in-95 duration-300">
        
        {/* HUD Elements - Static corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-tactical/30 rounded-tl-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-tactical/30 rounded-tr-3xl pointer-events-none"></div>

        {/* Top Intelligence Header */}
        <div className="p-6 pb-0 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Unit</span>
              <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-tactical font-black text-[10px] min-w-[50px] text-center">
                AI
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center">Source /</span>
              <div className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 font-black text-[9px] truncate text-center">
                {incident.source.toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">View</span>
              <a 
                href={incident.sourceUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-2 bg-tactical/10 border border-tactical/20 rounded-xl text-tactical font-black text-[8px] flex items-center gap-1 hover:bg-tactical/20 transition-all"
              >
                • ORIGINAL INTEL
              </a>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Intelligence Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          
          {/* Main Intelligence Body */}
          <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800/60 text-left relative group">
             <div className="flex items-center gap-3 mb-4 opacity-40">
                <Globe className="w-4 h-4 text-tactical" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Signal Contents</span>
              </div>
            <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed tracking-tight">
              "{incident.text}"
            </p>
          </div>

          {/* Core Logic Modules */}
          <div className="space-y-4">
            {/* Resonance Logic */}
            <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/60 relative group">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Resonance Logic</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold tracking-tight">
                {incident.reasoning}
              </p>
            </div>

            {/* Tactical Directive */}
            <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/60 relative">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Tactical Directive</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-black uppercase tracking-widest italic">
                {incident.recommendedAction}
              </p>
            </div>
          </div>

          {/* Intelligence Matrix - Precision Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Coordinates Module - Full Width */}
            <div className="col-span-2 bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4">Coordinates</span>
              <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
                {incident.location || 'COORD_PENDING'}
              </span>
            </div>

            {/* Risk Module - Side by Side */}
            <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4">Risk</span>
              <span className={`text-4xl font-black italic tracking-tighter ${isCritical ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'text-tactical drop-shadow-[0_0_12px_rgba(4,150,199,0.4)]'}`}>
                {incident.riskScore}%
              </span>
            </div>

            {/* Network Module - Side by Side */}
            <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4">Network</span>
              <span className="text-sm font-black text-white uppercase tracking-[0.3em]">
                {incident.source.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Visualization Layer */}
          {incident.imageUrl && (
            <div className="rounded-[2.5rem] overflow-hidden border border-slate-800 h-64 relative group shadow-2xl">
              <img src={incident.imageUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-700" alt="Sat Uplink" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-8 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-white uppercase tracking-[0.5em]">Live Satellite Feed</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Terminal */}
        <div className="p-2 pt-0 bg-slate-950 flex border-t border-slate-800/50">
          <button 
            onClick={onClose}
            className="flex-1 py-6 bg-[#0a0f1e] hover:bg-slate-900 text-slate-600 hover:text-white rounded-bl-3xl sm:rounded-none font-black text-[10px] uppercase tracking-[0.4em] transition-all border-r border-slate-800/50"
          >
            Acknowledge
          </button>
          {onResolve && (
            <button 
              onClick={() => { onResolve(incident.id); onClose(); }}
              className="flex-[1.8] py-6 bg-tactical hover:bg-[#0385b2] text-white rounded-br-3xl sm:rounded-none font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 relative group"
            >
              <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Neutralize
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailModal;
