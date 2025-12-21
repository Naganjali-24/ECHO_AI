
import { IncidentPost, TriageLevel, AnalysisResponse } from "../types";
import { analyzeIncident, getDisasterNews } from "./geminiService";

export interface LocationContext {
    lat: number;
    lng: number;
    city?: string;
    countryCode?: string;
}

const CACHE_KEY = 'echoai_analysis_cache';
const getCache = (): Record<string, AnalysisResponse> => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch { return {}; }
};
const setCache = (text: string, analysis: AnalysisResponse) => {
    try {
        const cache = getCache();
        const keys = Object.keys(cache);
        if (keys.length > 200) delete cache[keys[0]];
        cache[text] = analysis;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
};

const processIntoIncident = async (
  rawText: string, 
  author: string, 
  source: IncidentPost['source'],
  rawDate: number,
  imageUrl?: string,
  sourceUrl?: string,
  coords?: { lat: number; lng: number }
): Promise<IncidentPost | null> => {
    
    try {
        const cache = getCache();
        let analysis = cache[rawText];

        if (!analysis) {
            analysis = await analyzeIncident(rawText, undefined); 
            if (analysis.is_relevant) {
                setCache(rawText, analysis);
            }
        }

        if (!analysis.is_relevant) return null;

        const finalLocation = typeof analysis.location_detected === 'string' 
            ? analysis.location_detected 
            : (analysis.location_detected ? JSON.stringify(analysis.location_detected) : undefined);

        return {
            id: `${source.toLowerCase()}-${rawDate}-${Math.floor(Math.random() * 1000)}`,
            author: author,
            timestamp: rawDate,
            text: rawText,
            imageUrl: imageUrl,
            status: analysis.urgency,
            riskScore: analysis.risk_score || 50,
            reasoning: analysis.reasoning,
            recommendedAction: analysis.recommended_action,
            location: finalLocation,
            source: source,
            sourceUrl: sourceUrl,
            coordinates: coords
        };
    } catch (e) {
        console.error("AI Analysis failed for post:", e);
        return null;
    }
};

export const fetchNASAFIRMS = async (loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        // Direct uplink to NASA EONET Wildfire Category - High-quality proxy for FIRMS hotspot data
        const response = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/categories/wildfires?status=open&limit=15`);
        if (!response.ok) throw new Error(`NASA FIRMS Uplink Error: ${response.statusText}`);
        const data = await response.json();
        const posts: IncidentPost[] = [];
        
        for (const event of (data.events || [])) {
            const lastGeom = event.geometry?.[0];
            const coords = lastGeom ? { lat: lastGeom.coordinates[1], lng: lastGeom.coordinates[0] } : undefined;
            
            const incident = await processIntoIncident(
                `NASA FIRMS HOTSPOT: ${event.title}. Thermal anomaly detected via MODIS/VIIRS satellite constellation. Confirmed wildfire signature.`,
                "NASA FIRMS",
                'NASA',
                new Date(event.geometry?.[0]?.date || Date.now()).getTime(),
                undefined,
                event.sources?.[0]?.url,
                coords
            );
            if (incident) posts.push(incident);
        }
        return posts;
    } catch (error: any) {
        throw new Error(`NASA FIRMS Sync Failed: ${error.message || error}`);
    }
};

export const fetchNASAEvents = async (loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        const response = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30`);
        if (!response.ok) throw new Error(`NASA EONET Error: ${response.statusText}`);
        const data = await response.json();
        const posts: IncidentPost[] = [];
        
        for (const event of (data.events || [])) {
            const lastGeom = event.geometry?.[0];
            const coords = lastGeom ? { lat: lastGeom.coordinates[1], lng: lastGeom.coordinates[0] } : undefined;
            
            const incident = await processIntoIncident(
                `NASA SAT-ALERT: ${event.title}. Type: ${event.categories?.[0]?.title || 'Environmental Event'}. Telemetry confirmed via NASA EONET.`,
                "NASA EONET",
                'NASA',
                new Date(event.geometry?.[0]?.date || Date.now()).getTime(),
                undefined,
                event.sources?.[0]?.url,
                coords
            );
            if (incident) posts.push(incident);
        }
        return posts;
    } catch (error: any) {
        throw new Error(`NASA Orbital Uplink Failed: ${error.message || error}`);
    }
};

export const fetchMastodonPosts = async (tag: string = 'emergency', loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        const response = await fetch(`https://mastodon.social/api/v1/timelines/tag/${tag}?limit=5`);
        if (!response.ok) throw new Error(`Mastodon API Error: ${response.statusText}`);
        const data = await response.json();
        const posts: IncidentPost[] = [];
        for (const post of data) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = post.content;
            const textContent = tempDiv.textContent || "";
            const incident = await processIntoIncident(textContent, `@${post.account.username}`, 'Mastodon', new Date(post.created_at).getTime(), post.media_attachments?.[0]?.preview_url, post.url);
            if (incident) posts.push(incident);
        }
        return posts;
    } catch (error: any) { 
        throw new Error(`Mastodon Sync Failed: ${error.message || error}`); 
    }
};

export const fetchReliefWebReports = async (loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        const url = "https://api.reliefweb.int/v1/reports?appname=dispatch&limit=3&sort[]=date:desc&fields[include][]=title&fields[include][]=body&fields[include][]=date";
        const response = await fetch(url);
        if (!response.ok) throw new Error(`ReliefWeb API Error: ${response.statusText}`);
        const data = await response.json();
        const reports: IncidentPost[] = [];
        for (const report of (data.data || [])) {
            const fields = report.fields || {};
            const incident = await processIntoIncident(`${fields.title} - ${fields.body?.substring(0, 150)}`, "ReliefWeb", 'ReliefWeb', new Date(fields.date?.created).getTime(), undefined, report.href);
            if (incident) reports.push(incident);
        }
        return reports;
    } catch (error: any) { 
        throw new Error(`ReliefWeb Sync Failed: ${error.message || error}`);
    }
};

export const fetchUSGSEarthquakes = async (loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`USGS Feed Error: ${res.statusText}`);
        const data = await res.json();
        const posts: IncidentPost[] = [];
        for (const feature of (data.features || []).slice(0, 10)) {
            const props = feature.properties;
            const geom = feature.geometry;
            const coords = geom ? { lat: geom.coordinates[1], lng: geom.coordinates[0] } : undefined;
            const incident = await processIntoIncident(`Quake M${props.mag} - ${props.place}`, "USGS", "NASA", props.time, undefined, props.url, coords);
            if (incident) posts.push(incident);
        }
        return posts;
    } catch (e: any) { 
        throw new Error(`USGS Seismic Sync Failed: ${e.message || e}`);
    }
}

export const fetchAINewsScraper = async (loc?: LocationContext): Promise<IncidentPost[]> => {
    try {
        const news = await getDisasterNews(loc?.city);
        const posts: IncidentPost[] = [];
        for (const item of news) {
            const incident = await processIntoIncident(item.title, "AI Monitor", "WebScraper", Date.now(), undefined, item.url);
            if (incident) posts.push(incident);
        }
        return posts;
    } catch (e: any) { 
        throw new Error(`AI Scraper Failed: ${e.message || e}`);
    }
}
