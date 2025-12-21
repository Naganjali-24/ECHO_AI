
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { verifyClaim, generateAudioBriefing, decodeAudioData } from '../services/geminiService';
import { Play, Pause, Loader2, Search, CloudLightning, Zap, ShieldAlert, Activity, Radio, Globe, Target, CheckCircle, AlertCircle, Info, List, MapPin } from './Icons';

interface SmartBriefingProps {
  incidents: IncidentPost[];
  onLog?: (message: string, level?: 'INFO' | 'SUCCESS' | 'ALERT') => void;
  translations: any;
  language?: string;
  theme: 'DARK' | 'LIGHT';
}

const SmartBriefing: React.FC<SmartBriefingProps> = ({ incidents, onLog, translations: t, language = 'EN', theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [briefingText, setBriefingText] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [briefingMode, setBriefingMode] = useState<'OPERATIONAL' | 'STRATEGIC'>('OPERATIONAL');
  const [truthQuery, setTruthQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [truthResult, setTruthResult] = useState<{ status: 'VERIFIED' | 'DEBUNKED' | 'UNCERTAIN', explanation: string, links: string[] } | null>(null);
  const [expandedIntelId, setExpandedIntelId] = useState<string | null>(null);
  const [isTruthExpanded, setIsTruthExpanded] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));

  const currentLine = useMemo(() => {
    if (!displayedText) return "";
    const sentences = displayedText.split(/[.!?]/).filter(s => s.trim().length > 0);
    return sentences[sentences.length - 1] || "";
  }, [displayedText]);

  useEffect(() => {
    if (isPlaying && !isPaused && briefingText && displayedText.length < briefingText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(briefingText.slice(0, displayedText.length + 1));
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, isPaused, briefingText, displayedText]);

  const updateVisualizer = () => {
    if (!analyserRef.current || !isPlaying || isPaused) return;
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
    setVisualizerData(newData);
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  useEffect(() => {
    if (isPlaying && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying, isPaused]);

  const handlePlayBriefing = async () => {
    if (isPlaying) {
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'running') {
          await audioContextRef.current.suspend();
          setIsPaused(true);
        } else {
          await audioContextRef.current.resume();
          setIsPaused(false);
        }
      }
      return;
    }

    setIsGeneratingAudio(true);
    setDisplayedText('');
    setBriefingText('');
    try {
      const result = await generateAudioBriefing(incidents, language, briefingMode);
      if (!result) {
        setIsGeneratingAudio(false);
        return;
      }
      setBriefingText(result.text);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const decodedBuffer = await decodeAudioData(result.audio, ctx, 24000, 1);
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setVisualizerData(new Array(32).fill(0));
      };
      
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      setIsPaused(false);
    } catch (e) {
      console.error("Audio playback error", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleVerifySignal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!truthQuery.trim() || isVerifying) return;
    setIsVerifying(true);
    setTruthResult(null);
    setIsTruthExpanded(false);
    onLog?.(`${t.verifying} "${truthQuery.substring(0, 20)}..."`, "INFO");
    try {
      const result = await verifyClaim(truthQuery);
      setTruthResult(result);
      setIsTruthExpanded(true);
      onLog?.(`${t.synced}: ${result.status}`, result.status === 'VERIFIED' ? 'SUCCESS' : result.status === 'DEBUNKED' ? 'ALERT' : 'INFO');
    } catch (error) {
      onLog?.("ERR_TIMED_OUT", "ALERT");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500 font-mono w-full">
      
      {/* Immersive Audio Briefing Card */}
      <div className={`border rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 relative overflow-hidden group shadow-xl flex flex-col min-h-[50vw] md:min-h-[420px] transition-all duration-300 hover:shadow-tactical/20 hover:border-tactical/30 ${
        theme === 'DARK' ? 'bg-[#050b18] border-slate-800' : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-blue-900/5'
      }`}>
        {/* Surgical HUD Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tactical/20 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tactical/20 rounded-br-xl pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Radio className={`w-20 md:w-24 h-20 md:h-24 ${theme === 'DARK' ? 'text-tactical' : 'text-blue-500'}`} />
        </div>
        
        {(isGeneratingAudio || (incidents.length === 0 && !isPlaying)) && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center gap-4 animate-in fade-in duration-300 backdrop-blur-md ${
              theme === 'DARK' ? 'bg-slate-950/95' : 'bg-white/90'
            }`}>
                <Loader2 className="w-8 h-8 text-tactical animate-spin" />
                <p className={`font-black text-[8px] uppercase tracking-[0.4em] ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{t.syncing}</p>
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className={`font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2 ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying && !isPaused ? 'bg-red-500 animate-pulse shadow-[0_0_8px_red]' : 'bg-slate-600'}`}></span>
                {t.sitrep}
            </h3>
            <div className={`flex p-0.5 rounded-lg border ${theme === 'DARK' ? 'bg-slate-950/80 border-slate-800' : 'bg-blue-100/50 border-blue-200'}`}>
                {(['OPERATIONAL', 'STRATEGIC'] as const).map(m => (
                    <button 
                        key={m}
                        onClick={() => setBriefingMode(m)}
                        className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[6px] md:text-[7px] font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-90 ${
                          briefingMode === m 
                            ? (theme === 'DARK' ? 'bg-tactical text-white shadow-lg' : 'bg-tactical text-white shadow-md') 
                            : 'text-slate-500 hover:text-tactical'
                        }`}
                    >
                        {m === 'OPERATIONAL' ? t.operational : t.strategic}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center mb-3 md:mb-4 h-8 md:h-10">
            <div className={`transition-all duration-500 ${isPlaying ? 'scale-100 opacity-100' : 'scale-95 opacity-30'}`}>
              <p className={`text-[10px] md:text-[11px] font-black italic tracking-tighter leading-tight truncate px-2 max-w-full ${theme === 'DARK' ? 'text-white/80' : 'text-slate-900'}`}>
                {currentLine || (isPaused ? "PAUSED" : "IDLE")}
              </p>
            </div>
            <div className="flex items-end justify-center gap-0.5 h-1 md:h-1.5 mt-1 md:mt-1.5 w-full max-w-[80px] md:max-w-[100px] opacity-40">
              {visualizerData.slice(0, 16).map((val, i) => (
                <div key={i} className={`w-0.5 rounded-full transition-all duration-75 ${isPlaying && !isPaused ? 'bg-tactical' : (theme === 'DARK' ? 'bg-slate-800' : 'bg-blue-200')}`}
                  style={{ height: (isPlaying && !isPaused) ? `${Math.max(30, (val / 255) * 100)}%` : '30%' }}
                />
              ))}
            </div>
          </div>

          <div className={`flex-1 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] border flex flex-col gap-2 md:gap-3 transition-all mb-3 md:mb-4 overflow-hidden ${
            theme === 'DARK' ? 'bg-[#020617]/60 border-slate-800/80 shadow-inner' : 'bg-white border-blue-100 shadow-sm'
          }`}>
             <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5 md:pb-2">
                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.intelFeed}</span>
                <Activity className="w-2 md:w-2.5 h-2 md:h-2.5 text-tactical animate-pulse" />
             </div>
             
             <div className="flex-1 space-y-1.5 md:space-y-2 overflow-y-auto scrollbar-hide pr-1">
                {incidents.length > 0 ? incidents.slice(0, 10).map(i => {
                  const isExpanded = expandedIntelId === i.id;
                  return (
                    <div 
                      key={i.id} 
                      onClick={() => setExpandedIntelId(isExpanded ? null : i.id)}
                      className={`flex flex-col border rounded-lg md:rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group/item ${
                        isExpanded 
                          ? (theme === 'DARK' ? 'bg-slate-800/40 border-tactical/50 shadow-[0_0_10px_rgba(4,150,199,0.1)]' : 'bg-blue-50/50 border-tactical/30') 
                          : (theme === 'DARK' ? 'bg-white/5 border-slate-800/50 hover:bg-white/10' : 'bg-white border-blue-50 hover:border-blue-200 shadow-sm')
                      }`}
                    >
                      <div className="p-1.5 md:p-2 flex items-start gap-2">
                        <div className={`mt-1 w-1 md:w-1.5 h-1 md:h-1.5 shrink-0 rounded-full ${i.status === 'RED' ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-yellow-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                             <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tighter truncate ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>{i.author}</span>
                             <span className="text-[6px] md:text-[7px] font-bold text-slate-600 whitespace-nowrap">{new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className={`text-[9px] md:text-[10px] font-medium leading-tight block transition-all ${isExpanded ? 'text-white' : (theme === 'DARK' ? 'text-slate-400 line-clamp-1' : 'text-slate-600 line-clamp-1')}`}>
                            {i.text}
                          </span>
                        </div>
                      </div>

                      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                           <div className="px-3 pb-3 pt-1 border-t border-slate-800/20 space-y-2">
                              <p className="text-[9px] text-slate-400 italic leading-snug">{i.reasoning}</p>
                              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-tight">{i.recommendedAction}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 gap-2 py-4">
                    <CloudLightning className="w-6 md:w-8 h-6 md:h-8" />
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em]">{t.syncing}</span>
                  </div>
                )}
             </div>
          </div>

          <div className="px-1 md:px-2">
            <button
                onClick={handlePlayBriefing}
                disabled={isGeneratingAudio || incidents.length === 0}
                className={`w-full flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 rounded-[0.8rem] md:rounded-[1rem] font-black text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all shadow-lg active:scale-95 hover:scale-[1.02] border ${
                  isGeneratingAudio ? 'bg-slate-800 border-slate-700 text-slate-500' : isPlaying ? (isPaused ? 'bg-emerald-600 border-emerald-500 text-white' : (theme === 'DARK' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-blue-100 border-blue-200 text-blue-700')) : 'bg-tactical border-tactical text-white hover:bg-[#0385b2] shadow-tactical/20'
                }`}
            >
                {isGeneratingAudio ? <Loader2 className="w-3 md:w-3.5 h-3 md:h-3.5 animate-spin" /> : isPlaying ? (isPaused ? <Play className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <Pause className="w-3 md:w-3.5 h-3 md:h-3.5" />) : <Zap className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {isGeneratingAudio ? t.syncing : isPlaying ? (isPaused ? t.execSitrep : t.sitrep) : t.execSitrep}
            </button>
          </div>
        </div>
      </div>

      {/* Intelligence & Truth Card - Expandable Engine */}
      <div className={`border rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col shadow-xl relative overflow-hidden group/intel min-h-[50vw] md:min-h-[420px] transition-all duration-300 hover:shadow-emerald-500/10 hover:border-emerald-500/30 ${
        theme === 'DARK' ? 'bg-[#050b18] border-slate-800' : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-blue-900/5'
      }`}>
        {/* Surgical HUD Corners */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-emerald-400/20 rounded-tr-xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-emerald-400/20 rounded-bl-xl pointer-events-none"></div>

        <h3 className={`font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-between mb-4 md:mb-6 ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-400 group-hover/intel:scale-110 transition-transform" />
                {t.truthEngine}
            </div>
        </h3>
        
        <form onSubmit={handleVerifySignal} className="relative mb-3 md:mb-4 group/input">
            <input 
                type="text" 
                value={truthQuery}
                onChange={(e) => setTruthQuery(e.target.value)}
                placeholder={`${t.acknowledge}...`}
                className={`w-full border rounded-lg md:rounded-xl py-3 md:py-4 pl-3 md:pl-4 pr-10 md:pr-12 text-[9px] md:text-[10px] focus:outline-none focus:border-tactical transition-all uppercase tracking-widest hover:border-tactical/50 ${
                  theme === 'DARK' ? 'bg-slate-950/50 border-slate-800 text-white' : 'bg-white border-blue-100 text-slate-900 shadow-sm'
                }`}
            />
            <div className="absolute right-1.5 md:right-2 top-1.5 md:top-2">
                <button 
                    disabled={isVerifying || !truthQuery.trim()}
                    className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all border hover:scale-105 active:scale-90 ${
                      theme === 'DARK' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-tactical' : 'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-500'
                    }`}
                >
                    {isVerifying ? <Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" /> : <Search className="w-3.5 md:w-4 h-3.5 md:h-4" />}
                </button>
            </div>
        </form>

        <div className={`flex-1 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 overflow-y-auto scrollbar-hide border transition-all relative ${
          theme === 'DARK' ? 'bg-[#020617]/80 border-slate-800 shadow-inner' : 'bg-white border-blue-100 text-slate-600 shadow-inner'
        }`}>
            {isVerifying ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 md:gap-4 text-center py-6 md:py-10">
                    <Globe className="w-8 md:w-10 h-8 md:h-10 text-tactical animate-spin" />
                    <p className="text-tactical font-black text-[7px] md:text-[8px] uppercase tracking-[0.4em]">{t.verifying}</p>
                    <div className="w-full max-w-[120px] h-1 bg-slate-800 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-tactical animate-scan h-full w-full opacity-50"></div>
                    </div>
                </div>
            ) : truthResult ? (
                <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
                    {/* Verdict Panel (Main Card) */}
                    <div 
                      onClick={() => setIsTruthExpanded(!isTruthExpanded)}
                      className={`p-3 md:p-4 rounded-xl md:rounded-2xl border flex flex-col items-center text-center gap-1.5 md:gap-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                        truthResult.status === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                        truthResult.status === 'DEBUNKED' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                        'bg-slate-800/40 border-slate-700'
                    }`}>
                        <div className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center shadow-lg ${
                            truthResult.status === 'VERIFIED' ? 'bg-emerald-500 text-white' :
                            truthResult.status === 'DEBUNKED' ? 'bg-red-500 text-white' :
                            'bg-slate-700 text-slate-300'
                        }`}>
                           {truthResult.status === 'VERIFIED' ? <CheckCircle className="w-4 md:w-5 h-4 md:h-5" /> :
                            truthResult.status === 'DEBUNKED' ? <AlertCircle className="w-4 md:w-5 h-4 md:h-5" /> :
                            <Info className="w-4 md:w-5 h-4 md:h-5" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] ${
                            truthResult.status === 'VERIFIED' ? 'text-emerald-500' : 
                            truthResult.status === 'DEBUNKED' ? 'text-red-500' : 'text-slate-400'
                          }`}>{truthResult.status === 'VERIFIED' ? t.synced : truthResult.status}</span>
                        </div>
                    </div>

                    {/* Expandable Explanation Panel */}
                    <div className={`grid transition-all duration-500 ease-in-out ${isTruthExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[9px] md:text-[10px] leading-relaxed font-medium italic ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {truthResult.explanation}
                            </p>
                            
                            {truthResult.links.length > 0 && (
                                <div className="pt-2 md:pt-3 mt-2 md:mt-3 border-t border-slate-800/20">
                                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                                      {truthResult.links.map((link, idx) => (
                                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="px-1.5 md:px-2 py-0.5 md:py-1 bg-tactical/10 border border-tactical/20 rounded-md text-[6px] md:text-[7px] font-black text-tactical hover:bg-tactical hover:text-white transition-all">
                                          REF_0{idx + 1}
                                        </a>
                                      ))}
                                  </div>
                                </div>
                            )}
                          </div>
                        </div>
                    </div>
                    
                    {!isTruthExpanded && (
                      <button 
                        onClick={() => setIsTruthExpanded(true)}
                        className="w-full text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-tactical transition-colors"
                      >
                        [ {t.viewIntel} ]
                      </button>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 opacity-20 gap-3 md:gap-4 py-8 md:py-10">
                    <CloudLightning className="w-8 md:w-10 h-8 md:h-10" />
                    <span className="text-[8px] md:text-[9px] uppercase font-black tracking-[0.4em] text-center">{t.engineStandby}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SmartBriefing;
