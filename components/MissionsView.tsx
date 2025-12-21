
import React, { useState } from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { Target, Flag, Loader2, MapPin, ShieldAlert, CheckCircle, Activity } from './Icons';

interface MissionsViewProps {
  incidents: IncidentPost[];
  onResolve: (id: string) => void;
}

const MissionsView: React.FC<MissionsViewProps> = ({ incidents, onResolve }) => {
  const [deploying, setDeploying] = useState<string | null>(null);

  const activeMissions = incidents.filter(i => i.status === TriageLevel.RED || i.status === TriageLevel.YELLOW);

  const handleDeploy = (id: string) => {
    setDeploying(id);
    // Artificial tactical delay for "asset deployment"
    setTimeout(() => {
      onResolve(id);
      setDeploying(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Flag className="w-6 h-6 text-red-500" />
            FIELD MISSIONS
          </h2>
          <p className="text-slate-400 text-sm">Deploy tactical response assets to critical zones.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Operations</span>
          <span className="text-xl font-bold text-indigo-400">{activeMissions.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeMissions.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
            <Target className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="text-white font-bold">Area Secured</h3>
            <p className="text-slate-500 text-xs max-w-xs mt-2">All high-priority threats have been neutralized or assigned. Monitor global feed for updates.</p>
          </div>
        ) : (
          activeMissions.map((mission) => {
            const isCritical = mission.status === TriageLevel.RED;
            const missionId = mission.id.slice(-5).toUpperCase();

            return (
              <div key={mission.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all relative ${isCritical ? 'border-red-500/30' : 'border-yellow-500/20'}`}>
                {/* Tactical Header */}
                <div className={`px-4 py-2 flex justify-between items-center ${isCritical ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCritical ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                    <span className="text-[10px] font-black tracking-[0.2em] text-white">OP-{missionId}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase ${isCritical ? 'text-red-500' : 'text-yellow-500'}`}>
                    Priority: {mission.status}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Primary Objective</h4>
                      <p className="text-lg font-bold text-white leading-tight">{mission.recommendedAction}</p>
                    </div>
                    <div className="text-right ml-4">
                       <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</h4>
                       <div className="flex items-center gap-1 text-slate-300 font-bold justify-end">
                         <MapPin className="w-3 h-3 text-indigo-400" />
                         <span className="text-xs">{mission.location || 'Unknown Coordinates'}</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-indigo-500" /> Intelligence Brief
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-3 italic leading-relaxed">
                        "{mission.reasoning}"
                      </p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Threat Magnitude</h4>
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-2xl font-black text-white">{mission.riskScore}</span>
                        <span className="text-[10px] text-slate-600 mb-1">/ 100</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-yellow-500'}`}
                          style={{ width: `${mission.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeploy(mission.id)}
                    disabled={deploying === mission.id}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      deploying === mission.id 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 cursor-wait' 
                        : isCritical 
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                    }`}
                  >
                    {deploying === mission.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying Assets...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Execute Operation
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MissionsView;
