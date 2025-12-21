
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, TacticalNotification, LogEntry, IncidentPost } from '../types';
import { Language, TRANSLATIONS } from '../services/i18nService';
import { checkCloudConnection } from '../services/geminiService';
import { saveToSatelliteCloud, loadFromSatelliteCloud } from '../services/storageService';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  theme: 'DARK' | 'LIGHT';
  setTheme: React.Dispatch<React.SetStateAction<'DARK' | 'LIGHT'>>;
  language: Language;
  setLanguage: (lang: Language) => void;
  notifications: TacticalNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<TacticalNotification[]>>;
  logs: LogEntry[];
  addLog: (message: any, level?: LogEntry['level']) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  latency: number | null;
  cloudStatus: 'connected' | 'error' | 'testing';
  selectedIncident: IncidentPost | null;
  setSelectedIncident: (incident: IncidentPost | null) => void;
  isSOSActive: boolean;
  setIsSOSActive: (active: boolean) => void;
  t: any;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>('DARK');
  const [language, setLanguage] = useState<Language>('EN');
  const [notifications, setNotifications] = useState<TacticalNotification[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'testing'>('testing');
  const [selectedIncident, setSelectedIncident] = useState<IncidentPost | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const addLog = useCallback((message: any, level: LogEntry['level'] = 'INFO') => {
    const stringMessage = typeof message === 'string' 
      ? message 
      : (message?.message || JSON.stringify(message) || 'Unknown system event');

    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      message: stringMessage,
      level
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const checkUplink = useCallback(async () => {
    setCloudStatus('testing');
    const result = await checkCloudConnection();
    setCloudStatus(result.status);
    setLatency(result.latency);
  }, []);

  useEffect(() => {
    const cloudData = loadFromSatelliteCloud();
    if (cloudData.user) setUser(cloudData.user);
    if (cloudData.notifications.length > 0) setNotifications(cloudData.notifications);
    
    checkUplink();
    const heartbeat = setInterval(checkUplink, 45000); 
    return () => clearInterval(heartbeat);
  }, [checkUplink]);

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
  };

  const value = {
    user, setUser, theme, setTheme, language, setLanguage,
    notifications, setNotifications, logs, addLog,
    isNotificationsOpen, setIsNotificationsOpen, latency, cloudStatus,
    selectedIncident, setSelectedIncident, isSOSActive, setIsSOSActive, t, handleLogout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
