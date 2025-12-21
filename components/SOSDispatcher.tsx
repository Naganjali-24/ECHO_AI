import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData, createIncidentReportTool } from '../services/geminiService';
import { IncidentPost, TriageLevel } from '../types';
import { Mic, MicOff, Phone, Loader2, ShieldAlert, Activity, CheckCircle, Zap, Radio, Globe } from './Icons';
import { useAppContext } from '../contexts/AppContext';

interface SOSDispatcherProps {
  onNewIncident: (incident: IncidentPost) => void;
  theme: 'DARK' | 'LIGHT';
  translations: any;
}

const SOSDispatcher: React.FC<SOSDispatcherProps> = ({ onNewIncident, theme, translations: t }) => {
  const { setIsSOSActive, latency } = useAppContext();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'HANDSHAKE' | 'ENCRYPTING' | 'LIVE'>('IDLE');
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'model', text: string, hex?: string }[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'ANALYZING' | 'LOGGED'>('IDLE');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Visualizer State
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [vData, setVData] = useState<number[]>(new Array(32).fill(0));
  const latestVData = useRef<number[]>(new Array(32).fill(0));

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const generateHex = (text: string) => {
    return text.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase()).slice(0, 16).join(' ');
  };

  const updateVisualizer = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const bars = 32;
    const step = Math.floor(dataArray.length / bars);
    const newData = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
      newData.push(sum / step);
    }
    
    latestVData.current = newData;
    setVData(newData);

    // Neural Wave Canvas Logic
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const time = Date.now() / 200;
            
            ctx.beginPath();
            for (let i = 0; i < 360; i += 2) {
              const rad = (i * Math.PI) / 180;
              const freqVal = (latestVData.current[i % latestVData.current.length] || 0) / 10;
              const r = 40 + freqVal + Math.sin(rad * 5 + time) * 5;
              const x = centerX + r * Math.cos(rad);
              const y = centerY + r * Math.sin(rad);
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = '#0496c7';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, centerY, 30 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
            ctx.fillStyle = '#0496c722';
            ctx.fill();
        }
    }

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  useEffect(() => {
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setVData(new Array(32).fill(0));
      latestVData.current = new Array(32).fill(0);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isActive]);

  const stopCall = async () => {
    setIsSOSActive(false);
    if (sessionRef.current) {
        try {
            const session = await sessionRef.current;
            session.close?.();
        } catch (e) {}
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }

    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    setIsActive(false);
    setIsConnecting(false);
    setPhase('IDLE');
    setStatus('IDLE');
    setTranscripts([]);
    analyserRef.current = null;
  };

  const startCall = async () => {
    setPermissionError(null);
    setIsConnecting(true);
    setPhase('HANDSHAKE');
    setTranscripts([]);
    setStatus('LISTENING');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setPhase('LIVE');
            setIsConnecting(false);
            setIsActive(true);
            setIsSOSActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            source.connect(analyser); 
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: blob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    const base64 = part.inlineData.data;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const buffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    sourcesRef.current.add(source);
                }
              }
            }
            
            if (msg.serverContent?.outputTranscription) {
               const text = msg.serverContent.outputTranscription.text;
               setTranscripts(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'model') {
                      return [...prev.slice(0, -1), { role: 'model', text: last.text + text, hex: generateHex(last.text + text) }];
                  }
                  return [...prev, { role: 'model', text, hex: generateHex(text) }];
               });
            }

            if (msg.serverContent?.inputTranscription) {
               const text = msg.serverContent.inputTranscription.text;
               setTranscripts(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'user') {
                      return [...prev.slice(0, -1), { role: 'user', text: last.text + text, hex: generateHex(last.text + text) }];
                  }
                  return [...prev, { role: 'user', text, hex: generateHex(text) }];
               });
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'report_incident') {
                  const args: any = fc.args;
                  
                  // Helper to safely stringify and prevent [object Object]
                  const safeStr = (v: any) => {
                    if (v === null || v === undefined) return "Unknown";
                    if (typeof v === 'object') {
                      if (v.text) return String(v.text);
                      if (v.location) return String(v.location);
                      if (v.name) return String(v.name);
                      return JSON.stringify(v);
                    }
                    return String(v);
                  };

                  const incident: IncidentPost = {
                    id: `sos-${Date.now()}`,
                    author: "SAT-UPLINK BYPASS",
                    timestamp: Date.now(),
                    text: safeStr(args.text),
                    status: (args.urgency as TriageLevel) || TriageLevel.YELLOW,
                    riskScore: Number(args.risk_score) || 50,
                    reasoning: "ENCRYPTED SATELLITE TELEMETRY - 08_GAMMA",
                    recommendedAction: safeStr(args.recommended_action),
                    location: safeStr(args.location),
                    source: 'NASA'
                  };
                  onNewIncident(incident);
                  setStatus('LOGGED');
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "INCIDENT LOGGED: HELP ASSETS PRIORITIZED" } }
                  }));
                }
              }
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopCall(),
          onerror: (e) => {
             console.error("SOS Uplink Error", e);
             stopCall();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are the ECHOAI Master Tactical Dispatcher. 
          Current Status: 911 lines are JAMMED. Cellular grids are SATURATED. 
          Your mission: Bypass local grids via the satellite uplink to secure life-saving info.
          - ACT FAST. Use calm, tactical brevity.
          - MANDATORY: Ask for EXACT LOCATION (cross-streets, landmark).
          - MANDATORY: Ask for NATURE OF THREAT.
          - Once confirmed, log immediately with 'report_incident'.
          - End transmissions by confirming "Help is prioritized via ECHO satellite relay."`,
          tools: [{ functionDeclarations: [createIncidentReportTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      let errorMsg = "Uplink Error";
      if (e?.name === 'NotAllowedError' || e?.message?.includes('Permission denied')) {
        errorMsg = "Microphone Access Denied";
      }
      setPermissionError(errorMsg);
      setIsConnecting(false);
      setStatus('IDLE');
    }
  };

  return (
    <div className={`border rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-stretch gap-8 relative overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 ${
      theme === 'DARK' ? 'bg-[#030712] border-tactical/40' : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-100'
    }`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <div className="w-full h-full bg-[radial-gradient(#0496c7_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-tactical/50 ${isActive ? 'animate-scan' : 'hidden'}`}></div>
      </div>

      <div className="z-10 flex flex-col items-center md:items-start text-center md:text-left gap-8 md:w-[280px] shrink-0 border-r border-slate-800/20 pr-0 md:pr-10">
        <div className="relative">
          <canvas ref={canvasRef} width={200} height={200} className={`absolute inset-0 m-auto -z-10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`p-10 rounded-[3rem] transition-all duration-1000 relative z-10 border-2 ${
            isActive ? 'bg-tactical border-blue-400 shadow-[0_0_60px_rgba(4,150,199,0.6)] scale-110' : (theme === 'DARK' ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50 shadow-md')
          }`}>
            <Phone className={`w-12 h-12 transition-all duration-700 ${isActive ? 'text-white animate-pulse' : (theme === 'DARK' ? 'text-slate-700' : 'text-slate-300')}`} />
          </div>
          {isActive && <div className="absolute inset-0 animate-ping bg-tactical/30 rounded-[3rem] -z-20 scale-150"></div>}
        </div>

        <div className="space-y-3">
          <h2 className={`text-2xl font-black tracking-tighter uppercase italic flex items-center gap-4 ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
             ECHO SOS UPLINK
          </h2>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-tactical animate-pulse shadow-[0_0_10px_#0496c7]' : 'bg-slate-800'}`}></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
              {isActive ? 'SIGNAL: SECURED' : 'GRID: JAMMED'}
            </p>
          </div>
          {permissionError && (
            <p className="text-red-500 text-[9px] font-black uppercase bg-red-500/10 px-2 py-1 rounded border border-red-500/20">{permissionError}</p>
          )}
        </div>

        <div className="w-full mt-auto">
          {!isActive ? (
            <button 
              onClick={startCall}
              disabled={isConnecting}
              className="w-full bg-tactical hover:bg-[#0385b2] text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 group"
            >
              {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5 group-hover:scale-125 transition-transform" />}
              {isConnecting ? 'BYPASSING...' : 'INITIATE BYPASS'}
            </button>
          ) : (
            <button 
              onClick={stopCall}
              className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 active:scale-95 border ${
                theme === 'DARK' ? 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white' : 'bg-white border-blue-100 text-tactical'
              }`}
            >
              <MicOff className="w-5 h-5" /> TERMINATE
            </button>
          )}
        </div>
      </div>

      <div className="z-10 flex-1 w-full flex flex-col gap-6">
         <div className={`h-[320px] rounded-[2.5rem] p-6 overflow-y-auto font-mono text-left flex flex-col gap-4 scrollbar-hide border relative transition-all ${
           theme === 'DARK' ? 'bg-[#020617]/95 border-slate-800 shadow-inner' : 'bg-white border-blue-50 text-slate-600 shadow-inner'
         }`}>
            {transcripts.length === 0 && !isConnecting && (
               <div className="h-full flex flex-col items-center justify-center opacity-10 gap-5 text-center">
                   <Radio className="w-12 h-12 text-tactical" />
                   <p className="text-[11px] uppercase tracking-[0.6em] font-black">Satellite Frequency Standing By</p>
               </div>
            )}
            {isConnecting && (
              <div className="h-full flex flex-col items-center justify-center gap-6 text-center animate-pulse">
                  <Globe className="w-12 h-12 text-tactical animate-spin duration-[5s]" />
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.4em] font-black text-tactical">Bypassing Standard Cellular Networks...</p>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-600 italic">Established Handshake with SAT_08_GAMMA</p>
                  </div>
              </div>
            )}
            {transcripts.map((t, i) => (
              <div key={i} className={`flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-400 ${t.role === 'model' ? 'text-tactical' : 'text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <div className={`text-[8px] font-black uppercase py-1 px-2 rounded h-fit shrink-0 ${t.role === 'model' ? 'bg-tactical/10 text-tactical border border-tactical/20' : 'bg-white/5 text-white border border-white/10'}`}>
                      {t.role === 'model' ? 'ECHO_DISP' : 'RES_CITZ'}
                  </div>
                  <span className="text-[7px] font-mono text-slate-700 tracking-tighter truncate opacity-50">{t.hex}</span>
                </div>
                <p className={`text-[12px] leading-relaxed font-bold py-1 pl-1 border-l-2 ${t.role === 'model' ? 'border-tactical text-tactical' : (theme === 'DARK' ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700')}`}>
                  {t.text}
                </p>
              </div>
            ))}
            {status === 'LOGGED' && (
               <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl flex items-center gap-5 animate-bounce mt-auto mx-2 shadow-[0_0_20px_#10b98122]">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Signal Locked & Archived</span>
                    <span className="text-[8px] text-emerald-500/60 uppercase font-black italic">Help assets deployed via satellite bypass</span>
                  </div>
               </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="flex flex-col gap-4">
            <div className={`h-12 rounded-2xl border flex items-end justify-center gap-1.5 px-6 relative overflow-hidden transition-all ${
               theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-blue-50'
            }`}>
                {vData.map((val, i) => (
                    <div key={i} className={`w-full rounded-t-lg transition-all duration-75 ${isActive ? 'bg-tactical shadow-[0_0_10px_#0496c7]' : 'bg-slate-800 opacity-10'}`} 
                         style={{ height: isActive ? `${Math.max(20, (val / 255) * 100)}%` : '20%' }}></div>
                ))}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <span className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-500 italic">No Active Handshake</span>
                  </div>
                )}
            </div>

            <div className="flex justify-between items-center px-4">
               <div className="flex items-center gap-3">
                   <Globe className={`w-4 h-4 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-slate-800'}`} />
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol: BYPASS_SOS_v4</span>
               </div>
               <div className="flex items-center gap-5">
                  <span className="text-[10px] font-black text-slate-700 uppercase italic">Latency: {latency || '0'}ms</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-tactical shadow-[0_0_5px_#0496c7] animate-pulse' : 'bg-slate-900'}`} style={{ animationDelay: `${i * 200}ms` }}></div>)}
                  </div>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SOSDispatcher;