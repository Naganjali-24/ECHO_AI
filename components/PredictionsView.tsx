
import React, { useState, useEffect } from 'react';
import { Prediction } from '../types';
import { getPredictions } from '../services/geminiService';
import { Radar, Loader2, MapPin, Zap, ShieldAlert, Activity, AlertCircle } from './Icons';

const PredictionsView: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      const data = await getPredictions();
      setPredictions(data);
      setLoading(false);
    };
    fetchForecast();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3 italic">
            <Radar className="w-6 h-6 text-tactical animate-pulse" />
            QUANTUM FORECAST
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Predictive Disaster Modeling Index</p>
        </div>
        <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tactical/10 border border-tactical/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-tactical animate-ping"></span>
                <span className="text-[10px] font-black text-tactical uppercase">Live Scan Active</span>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-slate-900/50 border border-slate-800 rounded-3xl">
           <div className="relative">
              <Radar className="w-12 h-12 text-tactical animate-spin duration-[3000ms]" />
              <div className="absolute inset-0 bg-tactical/20 blur-xl rounded-full"></div>
           </div>
           <div className="text-center">
              <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Synthesizing Sensor Grid</p>
              <p className="text-slate-500 text-[9px] uppercase tracking-tighter">Calculating planetary instability vectors...</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.length === 0 ? (
            <div className="col-span-2 py-20 text-center border border-dashed border-slate-800 rounded-2xl">
              <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 font-black text-xs uppercase tracking-widest">Global Stability Detected</p>
              <p className="text-slate-700 text-[9px] uppercase">No significant anomalous vectors found in the current window.</p>
            </div>
          ) : (
            predictions.map((p) => (
              <div key={p.id} className="group bg-slate-900 border border-slate-800 hover:border-tactical transition-all p-5 rounded-3xl relative overflow-hidden shadow-2xl">
                {/* Background Radar Lines */}
                <div className="absolute -top-10 -right-10 w-32 h-32 border border-slate-800 rounded-full opacity-20 pointer-events-none group-hover:border-tactical group-hover:scale-125 transition-all duration-700"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Signal Detected</span>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{p.type}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                        p.confidence === 'HIGH' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        p.confidence === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      Confidence: {p.confidence}
                    </div>
                    <span className="text-xs text-tactical font-black tracking-tighter">Prob: {p.probability}%</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    <span className="text-[11px] font-bold uppercase">{p.location}</span>
                  </div>
                  
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-[10px] leading-relaxed italic text-slate-400">
                    "{p.reasoning}"
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-tactical" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Window: <span className="text-white">{p.window}</span></span>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-tactical shadow-[0_0_8px_#0496c7]" style={{ width: `${p.probability}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Warning Footer */}
      <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
        <ShieldAlert className="w-8 h-8 text-red-500/50" />
        <p className="text-[9px] text-slate-500 leading-normal uppercase font-bold tracking-tighter">
          * ECHOAI predictions are probabilistic based on satellite telemetry and news aggregation. Confidence levels below 'HIGH' should be treated as observational signals. Use for prioritized strategic planning.
        </p>
      </div>
    </div>
  );
};

export default PredictionsView;
