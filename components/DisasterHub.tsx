
import React, { useState, useEffect, useMemo } from 'react';
import { IncidentPost, Prediction, TriageLevel, NewsArticle } from '../types';
import { getPredictions, getEnvironmentalIntel, fetchSatelliteNews } from '../services/geminiService';
import { ShieldAlert, Activity, Globe, MapPin, CheckCircle, Loader2, AlertCircle, Wind, Thermometer, Waves, Radar, Clock, Zap, Target, Search, Radio } from './Icons';

interface DisasterHubProps {
  incidents: IncidentPost[];
  onIncidentClick: (incident: IncidentPost) => void;
  translations: any;
  theme: 'DARK' | 'LIGHT';
}

const OrbitalBackground = ({ theme }: { theme: 'DARK' | 'LIGHT' }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    {/* Massive Rotating Wireframe Globe */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] animate-[spin_180s_linear_infinite] opacity-[0.07]">
      <svg viewBox="0 0 100 100" className={theme === 'DARK' ? 'text-tactical' : 'text-blue-500'}>
        <circle cx="50" cy="50" r="49.5" fill="none" stroke="currentColor" strokeWidth="0.05" strokeDasharray="1,1" />
        {Array.from({ length: 24 }).map((_, i) => (
          <ellipse 
            key={i} 
            cx="50" cy="50" 
            rx={49.5} ry={5 + i * 2} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.02" 
            className="opacity-50" 
            transform={`rotate(${i * 7.5} 50 50)`} 
          />
        ))}
        {/* Longitudinal Lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="50" y1="0.5" x2="50" y2="99.5" stroke="currentColor" strokeWidth="0.02" transform={`rotate(${i * 15} 50 50)`} />
        ))}
      </svg>
    </div>

    {/* Satellite Signal "Fog" */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_80%)]"></div>
    
    {/* Floating Data Telemetry */}
    <div className="absolute inset-0 opacity-[0.03] font-mono text-[8px] flex flex-wrap gap-4 p-10 uppercase">
       {Array.from({ length: 60 }).map((_, i) => (
         <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
           SAT_{Math.floor(Math.random() * 999)}_SIGNAL_LOCK_0x{Math.floor(Math.random() * 255).toString(16).toUpperCase()}
         </span>
       ))}
    </div>
  </div>
);

const TacticalScanHUD = ({ isLocating }: { isLocating: boolean }) => (
  <div className="relative w-64 h-64 flex items-center justify-center">
    {/* Outer Spinning Ring */}
    <div className={`absolute inset-0 border border-tactical/20 rounded-full ${isLocating ? 'animate-spin duration-[10s]' : 'opacity-20'}`}>
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-tactical rounded-full shadow-[0_0_10px_#0496c7]"></div>
    </div>
    
    {/* Inner Pulsing Radar */}
    <div className={`absolute inset-4 border border-tactical/10 rounded-full flex items-center justify-center ${isLocating ? 'animate-pulse' : 'opacity-10'}`}>
       <Radar className={`w-20 h-20 ${isLocating ? 'text-tactical animate-spin duration-[4s]' : 'text-slate-800'}`} />
    </div>

    {/* Center Target */}
    <Target className={`w-12 h-12 transition-all duration-700 ${isLocating ? 'text-white scale-110' : 'text-slate-800 scale-100'}`} />

    {/* Coordinate Lockdown Animation */}
    {isLocating && (
      <div className="absolute -bottom-16 flex flex-col items-center gap-1">
         <span className="text-[10px] font-black text-tactical uppercase tracking-[0.5em] animate-pulse">Establishing Link</span>
         <div className="flex gap-1">
            {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-tactical rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
         </div>
      </div>
    )}
  </div>
);

const DisasterHub: React.FC<DisasterHubProps> = ({ incidents, onIncidentClick, translations: t, theme }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [activeTab, setActiveTab] = useState<'FUTURE' | 'PRESENT' | 'PAST' | 'LOCAL' | 'NEWS'>('PRESENT');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [envData, setEnvData] = useState<{weather: string, aqi: string, seismicOutlook: string, locationName: string} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (activeTab === 'FUTURE' && predictions.length === 0) {
      const fetchForecast = async () => {
        setLoadingForecast(true);
        const data = await getPredictions();
        setPredictions(data);
        setLoadingForecast(false);
      };
      fetchForecast();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'NEWS' && news.length === 0) {
      const fetchNews = async () => {
        setLoadingNews(true);
        const data = await fetchSatelliteNews();
        setNews(data);
        setLoadingNews(false);
      };
      fetchNews();
    }
  }, [activeTab]);

  const requestLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        try {
          const data = await getEnvironmentalIntel(coords.lat, coords.lng);
          setEnvData(data);
        } catch (e) {
          console.error("Environmental intel failed:", e);
        } finally { setIsLocating(false); }
      },
      (err) => { 
        console.error("Geolocation error:", err);
        alert(err.code === 1 ? "Permission denied." : "Uplink failed.");
        setIsLocating(false); 
      }
    );
  };

  return (
    <div className={`space-y-4 md:space-y-6 animate-in fade-in duration-700 font-mono w-full px-2 sm:px-0 relative min-h-[750px] overflow-hidden rounded-[3rem] shadow-2xl ${
      theme === 'DARK' ? 'bg-[#010409] border-slate-800' : 'bg-white border-blue-50'
    }`}>
      
      <OrbitalBackground theme={theme} />

      <div className="p-6 md:p-12 relative z-10 flex flex-col gap-8 h-full">
        <div className="flex flex-col gap-2">
          <h2 className={`text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-5 ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
              <ShieldAlert className="w-10 h-10 text-tactical" />
              {t.hub}
          </h2>
          <div className="flex items-center gap-4">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_emerald]"></div>
             <p className="text-[11px] text-slate-500 uppercase tracking-[0.4em] font-black">Orbital Telemetry Active</p>
          </div>
        </div>

        <div className={`flex p-1.5 rounded-[2.5rem] border shadow-2xl overflow-x-auto scrollbar-hide backdrop-blur-3xl transition-all ${
          theme === 'DARK' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/90 border-blue-100'
        }`}>
          {(['PRESENT', 'FUTURE', 'LOCAL', 'NEWS', 'PAST'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-8 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                ? 'bg-tactical text-white shadow-2xl shadow-tactical/40 translate-y-[-2px]' 
                : 'text-slate-500 hover:text-tactical'
              }`}
            >
              {tab === 'PRESENT' ? t.operational : tab === 'FUTURE' ? t.quantumForecast : tab === 'LOCAL' ? t.geo : tab === 'NEWS' ? 'NEWS' : 'ARCHIVE'}
            </button>
          ))}
        </div>

        <div className={`flex-1 rounded-[3.5rem] p-8 md:p-12 border shadow-inner relative overflow-hidden flex flex-col transition-all duration-700 ${
          theme === 'DARK' ? 'bg-[#020617]/70 border-slate-800/60 shadow-black' : 'bg-slate-50/70 border-blue-50'
        }`}>
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tactical to-transparent animate-scan opacity-40"></div>

          {activeTab === 'PRESENT' && (
            <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="flex items-center justify-between border-b border-slate-800/40 pb-8">
                  <div className="flex flex-col gap-1">
                     <span className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Anomaly Surveillance Stream</span>
                     <span className="text-[9px] text-slate-500 uppercase font-black italic">Tracking {incidents.length} planetary events</span>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-tactical">0{i}</div>)}
                     </div>
                     <Activity className="w-6 h-6 text-tactical animate-pulse" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {incidents.slice(0, 6).map(i => (
                  <div 
                    key={i.id} 
                    onClick={() => onIncidentClick(i)} 
                    className={`p-6 rounded-[2rem] border flex justify-between items-center cursor-pointer transition-all duration-500 group/item hover:bg-tactical/5 ${
                      theme === 'DARK' 
                        ? 'bg-slate-900/60 border-slate-800/80 hover:border-tactical/50' 
                        : 'bg-white border-blue-100 shadow-sm hover:border-tactical'
                    }`}
                  >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all group-hover/item:rotate-12 ${
                          i.status === TriageLevel.RED ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        }`}>
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-black uppercase truncate group-hover/item:text-tactical transition-colors ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{i.text}</span>
                            <div className="flex items-center gap-2.5 mt-1.5">
                               <MapPin className="w-3.5 h-3.5 text-slate-600" />
                               <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{i.location || 'PLANETARY_SURFACE'}</span>
                            </div>
                        </div>
                      </div>
                      <Search className="w-6 h-6 text-tactical opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0" />
                  </div>
                ))}
               </div>
            </div>
          )}

          {activeTab === 'LOCAL' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-16 relative z-10 animate-in zoom-in-95 duration-700">
              {!location ? (
                <div className="flex flex-col items-center gap-12">
                  <TacticalScanHUD isLocating={isLocating} />
                  <div className="max-w-lg space-y-5">
                    <h3 className={`text-3xl font-black uppercase tracking-tighter italic ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>Sector Intelligence Lock</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.4em] leading-relaxed">Secure a satellite coordinate lock to bypass cellular congestion and retrieve localized environmental threat resonance levels.</p>
                  </div>
                  <button 
                    onClick={requestLocation} 
                    disabled={isLocating}
                    className="px-16 py-7 bg-tactical text-white font-black rounded-[2.5rem] text-[12px] uppercase tracking-[0.6em] shadow-2xl shadow-tactical/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-5 group"
                  >
                    {isLocating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Radar className="w-6 h-6 group-hover:rotate-90 transition-transform" />}
                    {isLocating ? 'Locking Sector...' : 'Initiate Scan'}
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex items-center gap-5 px-10 py-4 bg-emerald-500/10 border border-emerald-500/40 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-pulse">
                       <Target className="w-6 h-6 text-emerald-500" />
                       <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em]">Sector Lock Established: {envData?.locationName}</span>
                    </div>
                    <div className="flex gap-20">
                       <div className="flex flex-col items-center border-r border-slate-800/40 pr-20">
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1">LON Telemetry</span>
                          <span className="text-2xl font-black text-white italic tracking-tighter">{location.lng.toFixed(6)}°</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1">LAT Telemetry</span>
                          <span className="text-2xl font-black text-white italic tracking-tighter">{location.lat.toFixed(6)}°</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { icon: <Wind />, label: 'Atmosphere', val: envData?.aqi, status: 'O2 BALANCE: NOMINAL', color: 'text-cyan-400' },
                      { icon: <Thermometer />, label: 'Thermal Profile', val: envData?.weather, status: 'HEAT INDEX: STABLE', color: 'text-amber-400' },
                      { icon: <Waves />, label: 'Seismic Stability', val: envData?.seismicOutlook, status: 'TECTONIC: INACTIVE', color: 'text-indigo-400' }
                    ].map((stat, idx) => (
                      <div key={idx} className={`p-12 rounded-[3.5rem] border flex flex-col items-center gap-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:rotate-1 ${
                        theme === 'DARK' ? 'bg-[#020617]/90 border-slate-800' : 'bg-white border-blue-50'
                      }`}>
                          <div className={`${stat.color} w-14 h-14 p-3 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-inner`}>
                            {stat.icon}
                          </div>
                          <div className="text-center">
                             <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em]">{stat.label}</span>
                             <p className={`text-3xl font-black italic mt-3 tracking-tighter ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{stat.val}</p>
                          </div>
                          <div className="flex items-center gap-3 pt-6 border-t border-white/5 w-full justify-center">
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]"></div>
                             <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em]">{stat.status}</span>
                          </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setLocation(null)}
                    className="text-[11px] font-black text-slate-700 uppercase tracking-[0.8em] hover:text-red-500 transition-all hover:scale-110 flex items-center gap-4 mx-auto"
                  >
                    <Radio className="w-4 h-4" /> [ TERMINATE SECTOR LINK ]
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'FUTURE' && (
            <div className="space-y-10 relative z-10 animate-in slide-in-from-right-16 duration-700">
               <div className="flex items-center justify-between mb-10 border-b border-slate-800/40 pb-10">
                  <div className="flex items-center gap-6">
                     <Radar className="w-8 h-8 text-tactical animate-spin" />
                     <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white uppercase tracking-[0.5em]">Quantum Instability Forecast</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest">Model Confidence Range: 84% - 99%</span>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     {[1,2,3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-slate-800'}`}></div>)}
                  </div>
               </div>
               {loadingForecast ? (
                 <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] gap-8">
                    <div className="w-32 h-2 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
                       <div className="absolute inset-0 bg-tactical animate-scan"></div>
                    </div>
                    <span className="text-[11px] font-black text-tactical animate-pulse uppercase tracking-[0.6em]">Processing Neural Probability Matrix...</span>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {predictions.map(p => (
                      <div key={p.id} className="p-8 rounded-[2.5rem] border bg-[#030815] border-slate-800 transition-all duration-500 hover:border-tactical/50 group/pred hover:translate-y-[-5px] shadow-2xl">
                         <div className="flex justify-between items-start mb-6">
                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${p.probability > 70 ? 'text-red-500' : 'text-tactical'}`}>{p.type}</span>
                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[11px] font-black text-white shadow-inner">
                               {p.probability}%
                            </div>
                         </div>
                         <div className="flex items-center gap-4 mb-4">
                            <MapPin className="w-4 h-4 text-slate-600" />
                            <p className="text-sm font-black text-slate-300 uppercase tracking-tighter truncate">{p.location}</p>
                         </div>
                         <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic mb-6 line-clamp-3">"{p.reasoning}"</p>
                         <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3">
                               <Clock className="w-4 h-4 text-slate-600" />
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">WINDOW: {p.window}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                               p.confidence === 'HIGH' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}>CONFIDENCE: {p.confidence}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'NEWS' && (
            <div className="space-y-10 relative z-10 animate-in slide-in-from-top-16 duration-700">
               <div className="flex items-center justify-between mb-10 border-b border-slate-800/40 pb-10">
                  <div className="flex items-center gap-6">
                     <Globe className="w-8 h-8 text-emerald-500 animate-pulse" />
                     <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white uppercase tracking-[0.5em]">Global Intelligence Sync</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Scanning 85,000+ Geo-Reference Sources</span>
                     </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-500 tracking-widest uppercase italic">Source Index: GDELT_v4.2</div>
               </div>
               {loadingNews ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] gap-8">
                     <Loader2 className="w-12 h-12 text-tactical animate-spin" />
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em]">Streaming Multi-Sector Crisis Intel...</span>
                  </div>
               ) : (
                  <div className="space-y-6">
                     {news.map(art => (
                       <div key={art.id} className="p-8 rounded-[3rem] border bg-[#030815] border-slate-800 hover:bg-slate-900 transition-all duration-500 group/news relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-tactical opacity-20 group-hover:opacity-100 transition-all duration-500"></div>
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="text-base font-black text-white uppercase group-hover/news:text-tactical transition-colors tracking-tight">{art.title}</h3>
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{new Date(art.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[12px] text-slate-400 leading-relaxed italic mb-8 line-clamp-3">"{art.summary}"</p>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                             <div className="flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-tactical shadow-[0_0_10px_#0496c7]"></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{art.source}</span>
                             </div>
                             <a href={art.url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-tactical/10 hover:bg-tactical text-tactical hover:text-white border border-tactical/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg group-hover/news:scale-105">
                                SECURE UPLINK <Zap className="w-4 h-4" />
                             </a>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DisasterHub;
