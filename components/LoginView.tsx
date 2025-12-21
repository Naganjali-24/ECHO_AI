import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, Server, Activity, Settings, Zap } from './Icons';

interface LoginViewProps {
  onLogin: (user: { name: string; email: string }) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [callsign, setCallsign] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const [loginStep, setLoginStep] = useState<'ID' | 'AUTH'>('ID');

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasPersonalKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim()) return;
    
    setLoading(true);
    // Simulated multi-stage decryption/auth
    setTimeout(() => {
      onLogin({
        name: callsign.toUpperCase() || "UNIT-ALPHA",
        email: `${(callsign || "alpha").toLowerCase()}@echo-ops.int`
      });
    }, 1500);
  };

  const handleQuickStart = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        name: "FIELD-CDR-01",
        email: "cdr.ops@echo-ops.int"
      });
    }, 1000);
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race condition
      setHasPersonalKey(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Dynamic Tactical Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #0496c7 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {/* Static Header Line (Non-animated replacement) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-tactical/20 z-50"></div>

      <div className="max-w-md w-full z-10 space-y-4">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-lg p-1 shadow-2xl overflow-hidden">
          <div className="border border-slate-700/50 p-8 rounded-sm relative">
            
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tactical/50"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tactical/50"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tactical/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tactical/50"></div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-tactical/10 p-2 rounded border border-tactical/30">
                  <ShieldAlert className="w-6 h-6 text-tactical" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-[0.3em] uppercase italic">
                  ECHO<span className="text-tactical">AI</span>
                </h1>
              </div>
              
              <div className="h-px w-12 bg-slate-800"></div>

              <div className="w-full space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center py-10 space-y-6 animate-pulse">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-tactical/20 border-t-tactical rounded-full animate-spin"></div>
                      <Zap className="absolute inset-0 m-auto w-6 h-6 text-tactical" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-tactical font-black text-[10px] tracking-[0.5em] uppercase">Encrypting Link</p>
                      <p className="text-slate-500 text-[8px] uppercase font-semibold">Bypassing Cellular Saturation...</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleManualLogin} className="space-y-5">
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={callsign}
                            onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                            placeholder="OPERATOR_CODE" 
                            className="w-full bg-slate-950/50 border border-slate-800 rounded px-4 py-3 text-sm text-tactical focus:border-tactical focus:outline-none transition-all placeholder:text-slate-800 font-mono tracking-widest"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Auth Sequence</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-slate-950/50 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-tactical focus:outline-none transition-all placeholder:text-slate-800 tracking-[0.5em]"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-tactical hover:bg-[#0385b2] text-white py-4 rounded font-black text-[10px] uppercase tracking-[0.4em] shadow-lg shadow-blue-900/20 transition-all active:scale-95 border border-blue-500/50"
                    >
                      Initialize Uplink
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={handleOpenKeySelector}
                className={`p-3 rounded border text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  hasPersonalKey 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Settings className="w-3 h-3" />
                {hasPersonalKey ? 'Personal Key: ACTIVE' : 'API KEY: DEFAULT'}
            </button>
            <button 
              type="button"
              onClick={handleQuickStart}
              className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-tactical hover:border-tactical transition-all text-[8px] uppercase font-black tracking-widest"
            >
              Demo: BYPASS AUTH
            </button>
        </div>
        
        <div className="text-center px-4">
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[7px] text-slate-600 hover:text-tactical transition-colors uppercase font-bold tracking-widest">
             Advanced Satellite Features Require Paid API Key [DOCS]
           </a>
        </div>

        <div className="flex items-center justify-center gap-4 py-4 opacity-20">
          <div className="h-[1px] bg-slate-700 flex-1"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          <div className="h-[1px] bg-slate-700 flex-1"></div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Global Stability Protocol 4.1.0</p>
          <p className="text-[7px] text-slate-700 font-bold uppercase tracking-tighter italic">Secured by Quantum Resonance Encryption</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;