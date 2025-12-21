
import React from 'react';
import { TacticalNotification } from '../types';
import { X, Bell, Trash2, ShieldAlert, Info, CheckCircle } from './Icons';

interface NotificationCenterProps {
  notifications: TacticalNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  isOpen, 
  onClose, 
  onMarkRead, 
  onClearAll 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose} 
      />
      <div className="absolute top-0 right-0 w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right-10 duration-300">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">COMMS CENTER</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-2">
              <Bell className="w-12 h-12" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Active Transmissions</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => onMarkRead(n.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  n.read ? 'bg-slate-950/30 border-slate-800 opacity-60' : 'bg-slate-800 border-indigo-500/30 shadow-lg'
                }`}
              >
                {!n.read && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />}
                <div className="flex gap-3">
                  <div className={`shrink-0 p-2 rounded-lg ${
                    n.type === 'ALERT' ? 'bg-red-500/20 text-red-500' : 
                    n.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {n.type === 'ALERT' ? <ShieldAlert className="w-4 h-4" /> : 
                     n.type === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase mb-1 truncate">{n.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex gap-4">
          <button 
            onClick={onClearAll}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3 h-3" /> Purge Logs
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
