
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { IncidentPost, TriageLevel } from '../types';
import { Loader2, Target, Globe, Radar, Activity, Eye, Zap, ShieldAlert, X, Settings } from './Icons';

declare var Cesium: any;

interface RescueMapProps {
  incidents: IncidentPost[];
  onGeocodeUpdate?: (id: string, lat: number, lng: number) => void;
  onMarkerClick?: (incident: IncidentPost) => void;
  translations?: any;
  theme: 'DARK' | 'LIGHT';
}

const RescueMap: React.FC<RescueMapProps> = ({ incidents, onMarkerClick, theme, translations: t }) => {
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filters, setFilters] = useState<Set<TriageLevel>>(new Set([TriageLevel.RED, TriageLevel.YELLOW, TriageLevel.GREEN]));
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  // Clustering States
  const [isClustering, setIsClustering] = useState(true);
  const [clusterRange, setClusterRange] = useState(40); // Pixel range for clustering

  // Helper to create dynamic tactical cluster icons
  const createClusterIcon = (size: number, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Draw outer glow
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fill();
    
    // Draw tactical ring
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    // Inner fill
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 8, 0, Math.PI * 2);
    ctx.fillStyle = '#020617'; // Slate 950
    ctx.fill();
    
    return canvas.toDataURL();
  };

  // Initialize Cesium
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
    });

    // Night Mode Styling for Cesium
    viewer.scene.globe.enableLighting = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0005;
    viewer.scene.fog.screenSpaceErrorFactor = 2.0;

    // Custom cluster look (Tactical HUD style)
    viewer.entities.cluster.clusterEvent.addEventListener((clusteredEntities: any[], cluster: any) => {
      cluster.label.show = true;
      cluster.label.text = clusteredEntities.length.toLocaleString();
      cluster.label.font = 'bold 12px Space Mono';
      cluster.label.fillColor = Cesium.Color.WHITE;
      cluster.label.outlineColor = Cesium.Color.BLACK;
      cluster.label.outlineWidth = 3;
      cluster.label.verticalOrigin = Cesium.VerticalOrigin.CENTER;
      
      cluster.billboard.show = true;
      cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER;
      
      const count = clusteredEntities.length;
      if (count > 20) {
        cluster.billboard.image = createClusterIcon(48, '#ef4444');
      } else if (count > 10) {
        cluster.billboard.image = createClusterIcon(40, '#f59e0b');
      } else {
        cluster.billboard.image = createClusterIcon(32, '#0496c7');
      }
    });

    viewerRef.current = viewer;
    setIsLoaded(true);

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update Clustering Settings
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.entities.cluster.enabled = isClustering;
      viewerRef.current.entities.cluster.pixelRange = clusterRange;
      viewerRef.current.entities.cluster.minimumClusterSize = 3;
    }
  }, [isClustering, clusterRange]);

  const getStatusColor = (status: TriageLevel) => {
    switch (status) {
      case TriageLevel.RED: return Cesium.Color.RED;
      case TriageLevel.YELLOW: return Cesium.Color.GOLD;
      case TriageLevel.GREEN: return Cesium.Color.LIME;
      default: return Cesium.Color.CYAN;
    }
  };

  const getStatusHex = (status: TriageLevel) => {
    switch (status) {
      case TriageLevel.RED: return '#ef4444';
      case TriageLevel.YELLOW: return '#eab308';
      case TriageLevel.GREEN: return '#22c55e';
      default: return '#0496c7';
    }
  };

  // Sync incidents
  useEffect(() => {
    if (!viewerRef.current || !isLoaded) return;

    viewerRef.current.entities.removeAll();

    incidents.forEach((incident) => {
      if (!incident.coordinates || !filters.has(incident.status)) return;

      viewerRef.current.entities.add({
        id: incident.id,
        name: incident.author,
        position: Cesium.Cartesian3.fromDegrees(incident.coordinates.lng, incident.coordinates.lat, 100),
        point: {
          pixelSize: 12,
          color: getStatusColor(incident.status),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        cylinder: {
          length: 500,
          topRadius: 2,
          bottomRadius: 50,
          material: getStatusColor(incident.status).withAlpha(0.3),
          outline: true,
          outlineColor: getStatusColor(incident.status),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
        label: {
          text: incident.author,
          font: '10px Space Mono',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
        properties: incident
      });
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewerRef.current.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        setSelectedEntity(pickedObject.id.properties.getValue());
      } else {
        setSelectedEntity(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [incidents, filters, isLoaded]);

  return (
    <div className={`w-full h-[600px] rounded-[2.5rem] overflow-hidden border relative group font-mono transition-all duration-700 ${
      theme === 'DARK' ? 'bg-slate-950 border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)]' : 'bg-slate-50 border-slate-200 shadow-xl'
    }`}>
      
      <div ref={containerRef} id="cesiumContainer" className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6 z-50">
          <Loader2 className="w-12 h-12 text-tactical animate-spin" />
          <p className="text-white font-black text-xs uppercase tracking-[0.4em]">Establishing Cesium Uplink</p>
        </div>
      )}

      {/* Cluster & Density HUD Control */}
      <div className="absolute top-24 right-6 z-10 w-52 animate-in slide-in-from-right-4 duration-500">
        <div className={`p-5 rounded-3xl backdrop-blur-2xl border shadow-2xl space-y-4 ${
          theme === 'DARK' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cluster Resolution</span>
             <button 
                onClick={() => setIsClustering(!isClustering)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isClustering ? 'bg-tactical text-white' : 'bg-slate-800 text-slate-500'}`}
             >
                <Zap className="w-3 h-3" />
             </button>
          </div>

          {isClustering && (
            <div className="space-y-3">
               <div className="flex justify-between text-[8px] font-black uppercase text-slate-600">
                  <span>Fine</span>
                  <span className="text-tactical">{clusterRange}px</span>
                  <span>Coarse</span>
               </div>
               <input 
                  type="range" 
                  min="10" 
                  max="120" 
                  step="5"
                  value={clusterRange} 
                  onChange={(e) => setClusterRange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-tactical"
               />
               <p className="text-[7px] text-slate-500 uppercase font-bold text-center tracking-tighter italic leading-tight">
                 Increase range to combine nearby incident signals
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Triage Filter HUD */}
      <div className="absolute bottom-24 right-6 z-10 flex flex-col gap-2">
        <div className={`p-2 rounded-2xl backdrop-blur-xl border flex flex-col gap-2 shadow-2xl ${
          theme === 'DARK' ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200'
        }`}>
          {(Object.values(TriageLevel) as TriageLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setFilters(prev => {
                const next = new Set(prev);
                if (next.has(level)) next.delete(level); else next.add(level);
                return next;
              })}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                filters.has(level) 
                ? 'scale-110 shadow-lg' 
                : 'opacity-30 grayscale hover:opacity-60'
              }`}
              style={{ backgroundColor: getStatusHex(level) }}
            >
              <ShieldAlert className="w-4 h-4 text-white" />
            </button>
          ))}
        </div>
      </div>

      {/* Tooltip HUD */}
      {selectedEntity && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] z-50 w-72 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className={`p-5 rounded-[2rem] backdrop-blur-2xl border shadow-2xl relative ${
            theme === 'DARK' ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
          }`}>
            <button 
              onClick={() => setSelectedEntity(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: getStatusHex(selectedEntity.status) }}>
                {selectedEntity.status?.[0]}
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>{selectedEntity.author}</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{new Date(selectedEntity.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <p className={`text-[10px] leading-relaxed mb-4 line-clamp-2 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-600'}`}>{selectedEntity.text}</p>
            <button 
              onClick={() => { onMarkerClick?.(selectedEntity); setSelectedEntity(null); }}
              className="w-full py-2 bg-tactical text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-tactical/20 transition-all hover:bg-[#0385b2]"
            >
              Expand Intel
            </button>
          </div>
        </div>
      )}

      {/* Overlay Status HUD */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className={`p-4 rounded-2xl backdrop-blur-xl border flex items-center gap-4 transition-all ${
          theme === 'DARK' ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          <Radar className="w-5 h-5 text-tactical animate-spin duration-[4000ms]" />
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>Satellite Resonance Grid</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
              Processing: {incidents.filter(i => i.coordinates && filters.has(i.status)).length} ACTIVE NODES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescueMap;
