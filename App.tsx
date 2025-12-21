import React, { Suspense, useCallback } from 'react';
import { ViewMode } from './components/StickyFooter';
import { useAppContext } from './contexts/AppContext';
import { useIncidents } from './hooks/useIncidents';
import IncidentCard from './components/IncidentCard';
import SOSDispatcher from './components/SOSDispatcher';
import LoginView from './components/LoginView';
import IncidentDetailModal from './components/IncidentDetailModal';
import StickyFooter from './components/StickyFooter';
import SmartBriefing from './components/SmartBriefing';
import NotificationCenter from './components/NotificationCenter';
import { ShieldAlert, Loader2, Bell, Sun, Moon, RotateCw, Radar, Activity, Zap } from './components/Icons';

// Lazy Load View Components
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const DisasterHub = React.lazy(() => import('./components/DisasterHub'));
const GeoMap = React.lazy(() => import('./components/GeoMap'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <Loader2 className="w-12 h-12 text-tactical animate-spin" />
      <div className="absolute inset-0 bg-tactical/20 blur-xl rounded-full"></div>
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-tactical">Synchronizing Sector...</span>
  </div>
);

const SyncOverlay = () => (
  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-tactical/30 rounded-full shadow-[0_0_20px_rgba(4,150,199,0.2)]">
      <div className="relative">
        <Radar className="w-4 h-4 text-tactical animate-spin" />
      </div>
      <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Active Satellite Uplink</span>
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-tactical rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-tactical rounded-full animate-pulse delay-75"></div>
        <div className="w-1 h-1 bg-tactical rounded-full animate-pulse delay-150"></div>
      </div>
    </div>
  </div>
);

const SOSActiveHUD = () => (
  <div className="fixed top-0 left-0 right-0 h-1 bg-tactical z-[200]">
    <div className="absolute top-0 left-0 h-full bg-white w-20 animate-[move-right_2s_linear_infinite]"></div>
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[201] flex items-center gap-4 px-6 py-2 bg-tactical rounded-full shadow-[0_0_30px_rgba(4,150,199,0.5)] border border-blue-400">
      <Zap className="w-4 h-4 text-white animate-pulse" />
      <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">ECHO SOS UPLINK: BYPASS ACTIVE</span>
      <style>{`
        @keyframes move-right {
          0% { left: -10%; }
          100% { left: 110%; }
        }
      `}</style>
    </div>
  </div>
);

function App() {
  const { 
    user, setUser, theme, setTheme, language, setLanguage,
    notifications, setNotifications, logs, addLog,
    isNotificationsOpen, setIsNotificationsOpen, latency, cloudStatus,
    selectedIncident, setSelectedIncident, isSOSActive, t, handleLogout 
  } = useAppContext();

  const {
    incidents, isSyncing, handleNewIncident, handleResolveIncident, handleSyncData
  } = useIncidents();

  const [currentView, setCurrentView] = React.useState<ViewMode>('DASHBOARD');

  const handleLogin = (authData: { name: string; email: string }) => {
    setUser({
      id: "usr-" + Date.now(),
      ...authData,
      solvedIncidents: [],
      totalRiskMitigated: 0
    });
    setCurrentView('DASHBOARD');
    addLog(`Unit ${authData.name} initialized.`, "SUCCESS");
    handleSyncData();
  };

  if (!user) return <LoginView onLogin={handleLogin} />;

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden font-sans transition-all duration-500 ${
      theme === 'DARK' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'
    } ${isSOSActive ? 'brightness-50 grayscale-[0.5]' : ''}`}>
      {isSyncing && <SyncOverlay />}
      {isSOSActive && <SOSActiveHUD />}

      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
         <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'DARK' ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(4,150,199,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(4,150,199,0.05),transparent_70%)]'}`}></div>
      </div>

      {selectedIncident && (
        <IncidentDetailModal 
          incident={selectedIncident} 
          onClose={() => setSelectedIncident(null)} 
          onResolve={handleResolveIncident}
          translations={t}
        />
      )}

      <NotificationCenter 
        notifications={notifications} 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)}
        onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        onClearAll={() => setNotifications([])}
      />

      <header className={`shrink-0 backdrop-blur-xl border-b z-40 transition-colors ${
        theme === 'DARK' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-tactical" />
            <span className={`text-xl font-black tracking-tighter uppercase italic ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>{t.appName}</span>
          </div>
          
          <div className="flex items-center gap-4">
              <div className={`hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl border ${theme === 'DARK' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-tactical animate-pulse shadow-[0_0_8px_#0496c7]' : cloudStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isSyncing ? 'SYNC_ACTIVE' : latency ? `${latency}ms` : 'LINK_DOWN'}</span>
              </div>
              <button 
                onClick={() => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK')} 
                className={`p-2 rounded-xl transition-all ${theme === 'DARK' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'}`}
              >
                {theme === 'DARK' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsNotificationsOpen(true)} className="relative p-2 text-slate-400 hover:text-tactical transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <button onClick={() => setCurrentView('PROFILE')} className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[10px] font-black text-tactical transition-all ${theme === 'DARK' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white shadow-sm'}`}>
                {user.name.substring(0, 2)}
              </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto z-10 scroll-smooth pb-32">
        <Suspense fallback={<LoadingFallback />}>
          <div className={`max-w-4xl mx-auto py-8 transition-all ${currentView === 'DASHBOARD' ? 'px-2 sm:px-4' : 'px-4'}`}>
            {currentView === 'DASHBOARD' && (
              <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
                <SmartBriefing incidents={incidents} onLog={addLog} translations={t} language={language} theme={theme} />
                <div className={`pt-6 sm:pt-10 border-t ${theme === 'DARK' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <SOSDispatcher onNewIncident={handleNewIncident} theme={theme} translations={t} />
                </div>
              </div>
            )}

            {currentView === 'FEED' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="flex justify-between items-center px-2">
                  <h2 className={`text-2xl font-black uppercase tracking-tighter italic ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>{t.intel}</h2>
                  <button onClick={() => handleSyncData()} disabled={isSyncing} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${theme === 'DARK' ? 'bg-tactical/10 hover:bg-tactical/20 text-tactical border border-tactical/30' : 'bg-tactical text-white hover:bg-[#0385b2]'}`}>
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                      {t.scanGrid}
                  </button>
                </div>
                
                {incidents.length === 0 && isSyncing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-48 rounded-[2rem] border animate-pulse flex flex-col p-6 gap-4 ${theme === 'DARK' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${theme === 'DARK' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                          <div className="flex-1 space-y-2">
                            <div className={`h-3 w-24 rounded ${theme === 'DARK' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                            <div className={`h-2 w-16 rounded ${theme === 'DARK' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                          </div>
                        </div>
                        <div className={`h-4 w-full rounded ${theme === 'DARK' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                        <div className={`h-4 w-2/3 rounded ${theme === 'DARK' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incidents.map((incident) => (
                      <IncidentCard key={incident.id} incident={incident} onClick={() => setSelectedIncident(incident)} translations={t} theme={theme} />
                    ))}
                    {incidents.length === 0 && !isSyncing && (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 opacity-30">
                        <ShieldAlert className="w-12 h-12" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Grid Empty - Scan Required</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentView === 'GEO' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>NASA Orbital Grid</h2>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest italic">Global Geospatial Event Tracking</p>
                  </div>
                  <button onClick={() => handleSyncData()} className="text-[10px] font-black text-tactical uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-70">
                     <RotateCw className="w-4 h-4" /> REFRESH SAT
                  </button>
                </div>
                <GeoMap incidents={incidents} onMarkerClick={setSelectedIncident} theme={theme} />
              </div>
            )}

            {currentView === 'DISASTERS' && <DisasterHub incidents={incidents} onIncidentClick={setSelectedIncident} translations={t} theme={theme} />}
            {currentView === 'PROFILE' && <ProfileView user={user} onLogout={handleLogout} language={language} onLanguageChange={setLanguage} translations={t} theme={theme} onThemeChange={setTheme} />}
            {currentView === 'ADMIN' && <AdminDashboard incidents={incidents} logs={logs} theme={theme} translations={t} />}
          </div>
        </Suspense>
      </main>

      <StickyFooter currentView={currentView} setView={setCurrentView} translations={t} theme={theme} />
    </div>
  );
}

export default App;