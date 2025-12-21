
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { Loader2, Target, Globe, Radar, ShieldAlert, X, Activity, Zap, Eye, Info, Search, Clock } from './Icons';

declare var Cesium: any;

interface GeoMapProps {
  incidents: IncidentPost[];
  onMarkerClick?: (incident: IncidentPost) => void;
  theme: 'DARK' | 'LIGHT';
}

const GeoMap: React.FC<GeoMapProps> = ({ incidents, onMarkerClick, theme }) => {
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<IncidentPost | null>(null);
  const [telemetry, setTelemetry] = useState({ lat: '0', lng: '0', height: '0' });
  const [isAutoSweep, setIsAutoSweep] = useState(false);
  const sweepIntervalRef = useRef<any>(null);
  
  // Advanced Filter Categories
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['FIRE', 'STORM', 'QUAKE', 'OTHER']));

  const nasaIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (!i.coordinates) return false;
      const text = i.text.toLowerCase();
      if (text.includes('fire') && !activeCategories.has('FIRE')) return false;
      if ((text.includes('storm') || text.includes('cyclone') || text.includes('flood')) && !activeCategories.has('STORM')) return false;
      if ((text.includes('quake') || text.includes('seismic')) && !activeCategories.has('QUAKE')) return false;
      if (!text.includes('fire') && !text.includes('storm') && !text.includes('quake') && !activeCategories.has('OTHER')) return false;
      return i.source === 'NASA' || i.status === TriageLevel.RED;
    });
  }, [incidents, activeCategories]);

  const createTacticalIcon = (color: string, pulse: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Outer Ring
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Glow
    ctx.beginPath();
    ctx.arc(32, 32, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fill();

    // Crosshairs
    ctx.globalAlpha = 1.0;
    ctx.moveTo(32, 0); ctx.lineTo(32, 15);
    ctx.moveTo(32, 49); ctx.lineTo(32, 64);
    ctx.moveTo(0, 32); ctx.lineTo(15, 32);
    ctx.moveTo(49, 32); ctx.lineTo(64, 32);
    ctx.stroke();

    return canvas.toDataURL();
  };

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrainProvider: Cesium.createWorldTerrain?.(),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      scene3DOnly: true,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
    });

    // Orbital Atmosphere Styling
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.001;
    viewer.scene.sun.show = true;
    viewer.scene.moon.show = true;

    // Telemetry Sync
    viewer.camera.changed.addEventListener(() => {
      const cartographic = viewer.camera.positionCartographic;
      setTelemetry({
        lat: Cesium.Math.toDegrees(cartographic.latitude).toFixed(4),
        lng: Cesium.Math.toDegrees(cartographic.longitude).toFixed(4),
        height: (cartographic.height / 1000).toFixed(0)
      });
    });

    viewerRef.current = viewer;
    setIsLoaded(true);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
      duration: 3
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Auto-Sweep Logic
  useEffect(() => {
    if (isAutoSweep && nasaIncidents.length > 0) {
      let index = 0;
      sweepIntervalRef.current = setInterval(() => {
        const incident = nasaIncidents[index];
        if (incident.coordinates) {
          viewerRef.current.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(incident.coordinates.lng, incident.coordinates.lat, 500000),
            duration: 4,
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45) }
          });
          setSelectedEntity(incident);
        }
        index = (index + 1) % nasaIncidents.length;
      }, 10000);
    } else {
      clearInterval(sweepIntervalRef.current);
    }
    return () => clearInterval(sweepIntervalRef.current);
  }, [isAutoSweep, nasaIncidents]);

  useEffect(() => {
    if (!viewerRef.current || !isLoaded) return;

    viewerRef.current.entities.removeAll();

    nasaIncidents.forEach((incident) => {
      if (!incident.coordinates) return;

      const isFire = incident.text.toLowerCase().includes('fire');
      const isStorm = incident.text.toLowerCase().includes('storm') || incident.text.toLowerCase().includes('cyclone');
      const isQuake = incident.text.toLowerCase().includes('quake');

      const color = isFire ? Cesium.Color.RED : 
                    isStorm ? Cesium.Color.CYAN : 
                    isQuake ? Cesium.Color.GOLD : Cesium.Color.ORANGE;

      const iconUrl = createTacticalIcon(color.toCssColorString());

      viewerRef.current.entities.add({
        id: incident.id,
        name: incident.author,
        position: Cesium.Cartesian3.fromDegrees(incident.coordinates.lng, incident.coordinates.lat, 500),
        billboard: {
          image: iconUrl,
          width: 32,
          height: 32,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: incident.status === TriageLevel.RED ? `CRITICAL: ${incident.author}` : incident.author,
          font: 'bold 10px Space Mono',
          fillColor: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -40),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
        properties: incident
      });
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewerRef.current.scene.pick(click.position);
      if (Cesium.defined(pickedObject)) {
        setSelectedEntity(pickedObject.id.properties);
        setIsAutoSweep(false); // Stop sweep if user manually interacts
      } else {
        setSelectedEntity(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [nasaIncidents, isLoaded]);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <div className={`w-full h-[650px] rounded-[3rem] overflow-hidden border relative group font-mono transition-all duration-700 ${
      theme === 'DARK' ? 'bg-[#010409] border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-xl'
    }`}>
      <div ref={containerRef} id="cesiumContainer" className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6 z-50">
          <div className="relative">
             <Radar className="w-16 h-16 text-tactical animate-spin" />
             <div className="absolute inset-0 bg-tactical/30 blur-2xl rounded-full"></div>
          </div>
          <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">NASA Orbital Link Synchronizing...</p>
        </div>
      )}

      {/* Satellite Category Filters */}
      <div className="absolute top-24 left-6 z-10 flex flex-col gap-2">
         {[
           { id: 'FIRE', icon: <Zap className="w-4 h-4" />, label: 'Wildfires', color: 'text-red-500' },
           { id: 'STORM', icon: <Activity className="w-4 h-4" />, label: 'Atmospheric', color: 'text-cyan-400' },
           { id: 'QUAKE', icon: <Target className="w-4 h-4" />, label: 'Seismic', color: 'text-amber-500' },
           { id: 'OTHER', icon: <Info className="w-4 h-4" />, label: 'Anomalies', color: 'text-tactical' }
         ].map(cat => (
           <button 
             key={cat.id}
             onClick={() => toggleCategory(cat.id)}
             className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all backdrop-blur-xl group/btn ${
               activeCategories.has(cat.id) 
                 ? (theme === 'DARK' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-tactical text-tactical') 
                 : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
             }`}
           >
              <div className={`${activeCategories.has(cat.id) ? cat.color : 'text-slate-700'} group-hover/btn:scale-125 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest hidden md:block">{cat.label}</span>
           </button>
         ))}
      </div>

      {/* Global Telemetry HUD */}
      <div className="absolute bottom-24 left-6 z-10 pointer-events-none">
        <div className={`p-6 rounded-[2rem] backdrop-blur-3xl border flex flex-col gap-4 shadow-2xl ${
          theme === 'DARK' ? 'bg-[#020617]/80 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
           <div className="flex items-center gap-3 border-b border-slate-800 pb-2 mb-1">
              <Globe className="w-5 h-5 text-tactical animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Orbital Telemetry</span>
                <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest italic">Satellite_ID: ECHO_ORB_01</span>
              </div>
           </div>
           <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">LAT</span>
                <span className="text-xs font-black text-tactical">{telemetry.lat}°</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">LNG</span>
                <span className="text-xs font-black text-tactical">{telemetry.lng}°</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">ALT</span>
                <span className="text-xs font-black text-tactical">{telemetry.height}KM</span>
              </div>
           </div>
        </div>
      </div>

      {/* Auto-Pilot Toggle */}
      <div className="absolute bottom-24 right-6 z-10">
        <button 
          onClick={() => setIsAutoSweep(!isAutoSweep)}
          className={`flex flex-col items-center gap-2 p-5 rounded-full border shadow-2xl transition-all duration-500 ${
            isAutoSweep 
              ? 'bg-tactical border-tactical text-white scale-110 shadow-[0_0_30px_#0496c7]' 
              : (theme === 'DARK' ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white' : 'bg-white border-slate-200 text-slate-400')
          }`}
        >
          <Radar className={`w-8 h-8 ${isAutoSweep ? 'animate-spin' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">{isAutoSweep ? 'SWEEPING' : 'SWEEP'}</span>
        </button>
      </div>

      {/* Detailed Tooltip Overlay */}
      {selectedEntity && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in slide-in-from-top-4 duration-300">
          <div className={`p-6 rounded-[2.5rem] backdrop-blur-3xl border shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative group/card overflow-hidden ${
            theme === 'DARK' ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
          }`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tactical to-transparent animate-scan"></div>
            
            <button onClick={() => setSelectedEntity(null)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-500 transition-colors bg-slate-800/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-inner ${
                   selectedEntity.status === TriageLevel.RED ? 'bg-red-600 animate-pulse' : 'bg-tactical'
                }`}>
                  {selectedEntity.status?.[0]}
                </div>
                <div className="flex flex-col flex-1">
                  <h4 className={`text-sm font-black uppercase tracking-tight truncate ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{selectedEntity.author}</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{new Date(selectedEntity.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${theme === 'DARK' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-[11px] leading-relaxed italic font-medium ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{selectedEntity.text}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col p-3 rounded-xl bg-tactical/5 border border-tactical/10">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Risk Level</span>
                    <span className={`text-xs font-black ${selectedEntity.status === TriageLevel.RED ? 'text-red-500' : 'text-tactical'}`}>{selectedEntity.riskScore}% Magnitude</span>
                 </div>
                 <div className="flex flex-col p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase">SAT_OVERRIDE_V4</span>
                 </div>
              </div>

              <button 
                onClick={() => onMarkerClick?.(selectedEntity)}
                className="w-full py-4 bg-tactical text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-tactical/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group/btn"
              >
                <Search className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                Analyze Sector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Badge */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className={`px-6 py-4 rounded-[1.5rem] backdrop-blur-2xl border flex items-center gap-4 transition-all shadow-2xl ${
          theme === 'DARK' ? 'bg-[#050b18]/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          <div className="relative">
             <Radar className="w-6 h-6 text-tactical animate-spin duration-[6000ms]" />
             <div className="absolute inset-0 bg-tactical/20 blur-xl animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>NASA Planetary Sweep</span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">
                 Live Feed: {nasaIncidents.length} Anomalies Logged
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="absolute top-6 right-6 z-10">
         <div className={`px-4 py-2 rounded-xl backdrop-blur-xl border flex gap-6 ${theme === 'DARK' ? 'bg-slate-900/40 border-slate-800' : 'bg-white/40 border-slate-200'}`}>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span className="text-[8px] font-black text-slate-400 uppercase">Crit</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500"></div>
               <span className="text-[8px] font-black text-slate-400 uppercase">Warn</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
               <span className="text-[8px] font-black text-slate-400 uppercase">Atm</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default GeoMap;
