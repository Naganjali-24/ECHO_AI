import React, { useState, useEffect, useRef } from 'react';
import { IncidentPost, TriageLevel, LogEntry } from '../types';
import StatCard from './StatCard';
import { Users, Server, Activity, AlertCircle, BarChart, Settings, CloudLightning, Loader2, CheckCircle, Radio, Upload, Download, Trash2, ShieldAlert } from './Icons';
import { checkCloudConnection } from '../services/geminiService';
import { downloadDataPacket, importDataPacket } from '../services/dataPacketService';
import { purgeSatelliteCloud } from '../services/storageService';

interface AdminDashboardProps {
  incidents: IncidentPost[];
  logs: LogEntry[];
  theme: 'DARK' | 'LIGHT';
  translations: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ incidents, logs, theme, translations: t }) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [latency, setLatency] = useState<number | null>(null);
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasPersonalKey(hasKey);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const total = incidents.length;
  const redCount = incidents.filter(i => i.status === TriageLevel.RED).length;
  const redPct = total ? (redCount / total) * 100 : 0;

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    const result = await checkCloudConnection();
    setConnectionStatus(result.status);
    setLatency(result.latency);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      downloadDataPacket();
      setIsExporting(false);
    }, 1200);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsImporting(true);
    const success = await importDataPacket(e.target.files[0]);
    if (success) {
      window.location.reload();
    } else {
      alert("CRITICAL ERROR: Data Packet Corrupted.");
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-mono">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>System Administration</h2>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Real-time Satellite Grid & AI Core Diagnostics</p>
        </div>
        <button 
          className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            hasPersonalKey 
              ? (theme === 'DARK' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm') 
              : (theme === 'DARK' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm')
          }`}
        >
          <Settings className="w-4 h-4" />
          {hasPersonalKey ? 'Uplink: Premium' : 'Uplink: Default'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard theme={theme} title="Total Signals" value={total} icon={<Activity className="w-5 h-5" />} colorClass="text-indigo-400" />
        <StatCard theme={theme} title="Uplink Latency" value={latency ? `${latency}ms` : '0ms'} icon={<Server className="w-5 h-5" />} colorClass={latency && latency > 1000 ? "text-yellow-500" : "text-emerald-500"} />
        <StatCard theme={theme} title="Risk Index" value={`${Math.round(redPct)}%`} icon={<AlertCircle className="w-5 h-5" />} colorClass="text-red-500" />
        <div className={`border rounded-[1.5rem] p-4 flex flex-col justify-center items-center shadow-xl transition-all ${
          theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-blue-900/5'
        }`}>
            <span className="text-tactical font-black text-[9px] uppercase italic mb-1">Grid Status</span>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className={`text-lg font-black uppercase ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>SYNCED</span>
            </div>
        </div>
      </div>

      {/* Satellite Data Port Section */}
      <div className={`border rounded-[2.5rem] p-8 shadow-xl transition-all relative overflow-hidden ${
        theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-blue-900/5'
      }`}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Download className="w-32 h-32 text-tactical" />
          </div>
          
          <h3 className={`text-sm font-black mb-6 flex items-center gap-3 uppercase tracking-widest italic ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
              <Server className="w-5 h-5 text-tactical" />
              Satellite Data Port
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-3xl border ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Export Packet</p>
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-4 bg-tactical text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Generate JSON
                  </button>
                  <p className="text-[7px] text-slate-600 mt-4 uppercase italic">Encapsulates all signals, logs, and unit data into a portable archive.</p>
              </div>

              <div className={`p-6 rounded-3xl border ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Uplink Packet</p>
                  <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full py-4 border border-tactical text-tactical rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-tactical/10"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import Signal
                  </button>
                  <p className="text-[7px] text-slate-600 mt-4 uppercase italic">Restore grid state from a previously exported tactical data packet.</p>
              </div>

              <div className={`p-6 rounded-3xl border ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Hard Reset</p>
                  <button 
                    onClick={() => { if(confirm("AUTHORIZATION REQUIRED: Purge entire satellite cache?")) purgeSatelliteCloud(); }}
                    className="w-full py-4 bg-red-600/10 border border-red-600/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    Purge Cloud
                  </button>
                  <p className="text-[7px] text-slate-600 mt-4 uppercase italic text-center">Wipes all localized grid data. Non-reversible procedure.</p>
              </div>
          </div>
      </div>

      <div className={`border rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[300px] transition-all ${
        theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-blue-900/5'
      }`}>
        <div className={`px-5 py-3 border-b flex justify-between items-center ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-tactical animate-pulse" />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>Satellite Uplink Monitor (Live)</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20"></div>
            </div>
        </div>
        <div className={`flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-hide ${theme === 'DARK' ? 'bg-[#050810]' : 'bg-slate-50/50'}`}>
            {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-[9px] mt-2 font-black uppercase tracking-[0.5em]">Waiting for signal...</span>
                </div>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-[11px] leading-relaxed group">
                        <span className="text-slate-400 shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                        <span className={`font-black uppercase tracking-tighter w-14 shrink-0 ${
                            log.level === 'ALERT' ? 'text-red-500' : log.level === 'SUCCESS' ? 'text-emerald-500' : 'text-tactical'
                        }`}>{log.level}</span>
                        <span className={`group-hover:translate-x-1 transition-transform ${theme === 'DARK' ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{log.message}</span>
                    </div>
                ))
            )}
            <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;