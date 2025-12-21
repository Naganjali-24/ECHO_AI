
import { useState, useCallback, useEffect } from 'react';
import { IncidentPost, User } from '../types';
import { fetchMastodonPosts, fetchReliefWebReports, fetchUSGSEarthquakes, fetchAINewsScraper, fetchNASAEvents, fetchNASAFIRMS, LocationContext } from '../services/externalDataService';
import { useAppContext } from '../contexts/AppContext';
import { saveToSatelliteCloud, loadFromSatelliteCloud } from '../services/storageService';

export const useIncidents = () => {
  const { addLog, user, setUser, notifications } = useAppContext();
  const [incidents, setIncidents] = useState<IncidentPost[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const cloudData = loadFromSatelliteCloud();
    if (cloudData.incidents.length > 0) setIncidents(cloudData.incidents);
  }, []);

  useEffect(() => {
    saveToSatelliteCloud({ incidents, user: user || undefined, notifications });
  }, [incidents, user, notifications]);

  const handleNewIncident = useCallback((incident: IncidentPost) => {
    setIncidents(prev => [incident, ...prev]);
    addLog(`Signal ${incident.id.split('-').pop()} secured.`, "ALERT");
  }, [addLog]);

  const handleResolveIncident = useCallback((id: string) => {
    const incidentToResolve = incidents.find(i => i.id === id);
    if (!incidentToResolve || !user) return;
    setIncidents(prev => prev.filter(incident => incident.id !== id));
    setUser({
        ...user,
        solvedIncidents: [...user.solvedIncidents, id],
        totalRiskMitigated: user.totalRiskMitigated + (incidentToResolve.riskScore || 0)
    });
    addLog(`Threat ${id} neutralized.`, "SUCCESS");
  }, [incidents, user, setUser, addLog]);

  const handleSyncData = useCallback(async (overrideLocation?: LocationContext) => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog(`Starting Grid Sync...`, "INFO");
    
    const fetchers = [
        { name: 'NASA_FIRMS', fn: () => fetchNASAFIRMS(overrideLocation) },
        { name: 'NASA_EONET', fn: () => fetchNASAEvents(overrideLocation) },
        { name: 'USGS', fn: () => fetchUSGSEarthquakes(overrideLocation) },
        { name: 'ReliefWeb', fn: () => fetchReliefWebReports(overrideLocation) },
        { name: 'Mastodon', fn: () => fetchMastodonPosts('emergency', overrideLocation) },
        { name: 'AI_Monitor', fn: () => fetchAINewsScraper(overrideLocation) }
    ];

    try {
        const results = await Promise.allSettled(fetchers.map(f => f.fn()));
        
        results.forEach((result, index) => {
            const fetcher = fetchers[index];
            if (result.status === 'fulfilled') {
                const data = result.value;
                if (data.length > 0) {
                    setIncidents(prev => {
                        const currentIds = new Set(prev.map(i => i.id));
                        const uniqueNew = data.filter(i => !currentIds.has(i.id));
                        return [...uniqueNew, ...prev];
                    });
                    addLog(`${fetcher.name} uplink established.`, "SUCCESS");
                }
            } else {
                addLog(`${fetcher.name} error: ${result.reason?.message || 'Uplink interrupted'}`, "ALERT");
            }
        });
    } catch (e: any) {
        addLog(`Critical Sync Failure.`, "ALERT");
    } finally {
        setIsSyncing(false);
    }
  }, [isSyncing, addLog]);

  return {
    incidents,
    isSyncing,
    handleNewIncident,
    handleResolveIncident,
    handleSyncData
  };
};
