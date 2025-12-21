
export enum TriageLevel {
  RED = 'RED',     // Immediate danger, life threatening
  YELLOW = 'YELLOW', // Urgent, but stable (needs supplies, power)
  GREEN = 'GREEN'   // Safe, news, general updates
}

export type IncidentSource = 'Manual' | 'Mastodon' | 'ReliefWeb' | 'GDACS' | 'WebScraper' | 'Bluesky' | 'GDELT' | 'NASA';

export interface IncidentPost {
  id: string;
  author: string;
  timestamp: number;
  imageUrl?: string;
  text: string;
  status: TriageLevel;
  riskScore: number; 
  reasoning: string;
  recommendedAction: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  source: IncidentSource;
  sourceUrl?: string;
}

export interface Prediction {
  id: string;
  type: string;
  location: string;
  probability: number;
  window: string;
  reasoning: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  solvedIncidents: string[]; 
  totalRiskMitigated: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  level: 'INFO' | 'SUCCESS' | 'ALERT';
}

export interface AnalysisResponse {
  is_relevant: boolean;
  urgency: TriageLevel;
  risk_score: number;
  reasoning: string;
  recommended_action: string;
  location_detected: string | null;
}

export interface TacticalNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  read: boolean;
  incidentId?: string;
}
