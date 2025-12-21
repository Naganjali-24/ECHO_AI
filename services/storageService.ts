
import { IncidentPost, User, TacticalNotification } from '../types';

const STORAGE_KEYS = {
  INCIDENTS: 'echoai_satellite_incidents',
  USER: 'echoai_satellite_user',
  NOTIFICATIONS: 'echoai_satellite_notifications',
  LAST_SYNC: 'echoai_satellite_last_sync',
  MAP_STATE: 'echoai_satellite_map_state'
};

export const saveToSatelliteCloud = (data: {
  incidents?: IncidentPost[];
  user?: User;
  notifications?: TacticalNotification[];
}) => {
  try {
    if (data.incidents) localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(data.incidents));
    if (data.user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (e) {
    console.error("Cloud Sync Failed:", e);
  }
};

export const purgeSatelliteCloud = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  window.location.reload(); // Refresh to clear memory state
};

export const saveMapState = (center: { lat: number, lng: number }, zoom: number) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MAP_STATE, JSON.stringify({ center, zoom }));
  } catch (e) {
    console.error("Failed to save map state:", e);
  }
};

export const loadMapState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MAP_STATE);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const loadFromSatelliteCloud = () => {
  try {
    return {
      incidents: JSON.parse(localStorage.getItem(STORAGE_KEYS.INCIDENTS) || '[]') as IncidentPost[],
      user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null') as User | null,
      notifications: JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]') as TacticalNotification[],
      lastSync: parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || '0')
    };
  } catch (e) {
    console.error("Cloud Retrieval Failed:", e);
    return { incidents: [], user: null, notifications: [], lastSync: 0 };
  }
};
