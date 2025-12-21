
import { IncidentPost, User, TacticalNotification } from '../types';
import { loadFromSatelliteCloud, saveToSatelliteCloud } from './storageService';

export interface TacticalDataPacket {
  version: string;
  timestamp: number;
  origin: string;
  payload: {
    incidents: IncidentPost[];
    user: User | null;
    notifications: TacticalNotification[];
  };
}

export const generateDataPacket = (): TacticalDataPacket => {
  const currentData = loadFromSatelliteCloud();
  return {
    version: "1.0.0-ECHO",
    timestamp: Date.now(),
    origin: currentData.user?.name || "ANON_TERMINAL",
    payload: {
      incidents: currentData.incidents,
      user: currentData.user,
      notifications: currentData.notifications
    }
  };
};

export const downloadDataPacket = () => {
  const packet = generateDataPacket();
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ECHO_DATA_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importDataPacket = async (file: File): Promise<boolean> => {
  try {
    const text = await file.text();
    const packet: TacticalDataPacket = JSON.parse(text);
    
    if (packet.version && packet.payload) {
      saveToSatelliteCloud({
        incidents: packet.payload.incidents,
        user: packet.payload.user || undefined,
        notifications: packet.payload.notifications
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Packet corruption detected during uplink.", e);
    return false;
  }
};
