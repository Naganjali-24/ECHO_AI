import { GoogleGenAI, Type, Modality, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { TriageLevel, AnalysisResponse, IncidentPost, Prediction, NewsArticle } from "../types";

const TEXT_MODEL = 'gemini-3-flash-preview';

// Helper to clean and parse JSON from AI responses and prevent [object Object] rendering
const tacticalJsonExtract = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    // Harden the result: recursively ensure fields are strings and handle potential nested objects
    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          const val = obj[key];
          if (val !== null && typeof val === 'object') {
            // Try to find a human-readable property before stringifying
            if (val.text) sanitized[key] = String(val.text);
            else if (val.location) sanitized[key] = String(val.location);
            else if (val.name) sanitized[key] = String(val.name);
            else if (val.description) sanitized[key] = String(val.description);
            else sanitized[key] = JSON.stringify(val);
          } else {
            sanitized[key] = val;
          }
        }
        return sanitized;
      }
      return obj;
    };
    
    return sanitize(parsed);
  } catch (e) {
    console.error("JSON Extraction failed:", text);
    throw new Error("Corrupted Intelligence Packet");
  }
};

const TRIAGE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_relevant: {
      type: Type.BOOLEAN,
      description: "Is this a real physical emergency or disaster event?",
    },
    urgency: {
      type: Type.STRING,
      enum: [TriageLevel.RED, TriageLevel.YELLOW, TriageLevel.GREEN],
    },
    risk_score: {
      type: Type.INTEGER,
      description: "0-100 score of the threat severity."
    },
    reasoning: {
      type: Type.STRING,
      description: "Technical reasoning for the triage decision."
    },
    recommended_action: {
      type: Type.STRING,
      description: "Immediate tactical directive for responders."
    },
    location_detected: {
      type: Type.STRING,
      nullable: true
    },
  },
  required: ["is_relevant", "urgency", "risk_score", "reasoning", "recommended_action"],
};

export const createIncidentReportTool: FunctionDeclaration = {
  name: 'report_incident',
  parameters: {
    type: Type.OBJECT,
    description: 'Report an emergency incident detected via SOS satellite bypass call.',
    properties: {
      text: {
        type: Type.STRING,
        description: 'Detailed description of the life threat or emergency nature.',
      },
      urgency: {
        type: Type.STRING,
        description: 'Calculated urgency level based on the life threat reported.',
        enum: [TriageLevel.RED, TriageLevel.YELLOW, TriageLevel.GREEN]
      },
      risk_score: {
        type: Type.NUMBER,
        description: 'Quantitative risk magnitude from 0 (Safe) to 100 (Immediate Death Risk).',
      },
      recommended_action: {
        type: Type.STRING,
        description: 'Critical tactical instruction for the user and responders.',
      },
      location: {
        type: Type.STRING,
        description: 'Geolocation data provided by the user or derived from telemetry.',
      },
    },
    required: ['text', 'urgency', 'risk_score', 'recommended_action', 'location'],
  },
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Converts a File object to a base64 string for model input.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry<T>(fn: (ai: any) => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    for (let i = 0; i < retries; i++) {
        try {
            return await fn(ai);
        } catch (error: any) {
            if ((error.status === 429 || error.message?.includes('429')) && i < retries - 1) {
                await delay(baseDelay * Math.pow(2, i));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Uplink Quota Exhausted.");
}

export const analyzeIncident = async (text: string, imageBase64?: string): Promise<AnalysisResponse> => {
  try {
    const parts: any[] = [{ text: `ANALYZE DISASTER SIGNAL: "${text}"` }];
    if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });

    const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: TRIAGE_SCHEMA,
        systemInstruction: "You are the ECHOAI Master Triage Unit. Filter out spam. Prioritize life threats (RED). Ensure JSON output is precise and all location/text fields are simple strings.",
      },
    }));

    return tacticalJsonExtract(response.text || "{}");
  } catch (error) {
    return {
      is_relevant: true, urgency: TriageLevel.YELLOW, risk_score: 50,
      reasoning: "Satellite signal weak. Analysis estimated.", recommended_action: "Field assessment required.", location_detected: "Unknown"
    };
  }
};

export const verifyClaim = async (query: string): Promise<{ status: 'VERIFIED' | 'DEBUNKED' | 'UNCERTAIN', explanation: string, links: string[] }> => {
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Cross-reference this intelligence packet with real-world data: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "Identify if the report corresponds to recent news or verified disaster alerts. Format: Status: [VERIFIED/DEBUNKED/UNCERTAIN]. Explanation: [Brief tactical summary]."
            }
        }));
        
        const text = response.text || "";
        let status: any = 'UNCERTAIN';
        if (text.toUpperCase().includes('VERIFIED')) status = 'VERIFIED';
        else if (text.toUpperCase().includes('DEBUNKED')) status = 'DEBUNKED';

        const cleanedText = text.replace(/^.*Status:?\s*/i, '').replace(/\[|\]/g, '').trim();
        const links: string[] = [];
        (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).forEach((c: any) => { 
          if (c.web?.uri) links.push(c.web.uri); 
        });

        return { status, explanation: cleanedText, links: Array.from(new Set(links)) };
    } catch (e) {
        return { status: 'UNCERTAIN', explanation: "Grounding engine timeout.", links: [] };
    }
};

export const getPredictions = async (): Promise<Prediction[]> => {
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: "Predict high-impact humanitarian or natural disaster risks for the next 96 hours.",
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            location: { type: Type.STRING },
                            probability: { type: Type.NUMBER },
                            window: { type: Type.STRING },
                            reasoning: { type: Type.STRING },
                            confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
                        },
                        required: ['id', 'type', 'location', 'probability', 'window', 'reasoning', 'confidence']
                    }
                },
                systemInstruction: "Focus on wildfires, flash floods, and seismic events with large population impact."
            }
        }));
        return tacticalJsonExtract(response.text || "[]");
    } catch (e) {
        return [];
    }
}

export const fetchSatelliteNews = async (): Promise<NewsArticle[]> => {
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: "Get the latest urgent global disaster and crisis reports from the last 12 hours.",
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            source: { type: Type.STRING },
                            url: { type: Type.STRING },
                            timestamp: { type: Type.NUMBER }
                        },
                        required: ["id", "title", "summary", "source", "url", "timestamp"]
                    }
                },
                systemInstruction: "ECHOAI News Core. Focus on relief efforts and immediate alerts."
            }
        }));
        return tacticalJsonExtract(response.text || "[]");
    } catch (e) {
        return [];
    }
};

export const getEnvironmentalIntel = async (lat: number, lng: number): Promise<{
    weather: string;
    aqi: string;
    seismicOutlook: string;
    locationName: string;
}> => {
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Environmental health scan for coordinates: ${lat}, ${lng}`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        weather: { type: Type.STRING },
                        aqi: { type: Type.STRING },
                        seismicOutlook: { type: Type.STRING },
                        locationName: { type: Type.STRING }
                    },
                    required: ["weather", "aqi", "seismicOutlook", "locationName"]
                }
            }
        }));
        return tacticalJsonExtract(response.text || "{}");
    } catch (e) {
        return {
            weather: "Sensors Offline",
            aqi: "Sensors Offline",
            seismicOutlook: "Scan Failed",
            locationName: "Unknown Sector"
        };
    }
};

export const generateAudioBriefing = async (incidents: IncidentPost[], language: string = 'EN', mode: 'OPERATIONAL' | 'STRATEGIC' = 'OPERATIONAL'): Promise<{ audio: Uint8Array, text: string } | null> => {
    try {
        const summaryText = incidents.slice(0, 3).map(i => `${i.status}: ${i.text}`).join(". ");
        const scriptResponse = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
          model: TEXT_MODEL,
          contents: `Script for a ${mode} SITREP. Incidents: ${summaryText}. Language: ${language}. Max 40 words.`,
          config: { systemInstruction: "ECHOAI Dispatch Command. Use professional, calm, tactical brevity." }
        }));
        
        const sitrepScript = scriptResponse.text || "Grid stable. No immediate alerts.";
        const audioResponse = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Command Voice: ${sitrepScript}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            },
        }));
        
        const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio ? { audio: decode(base64Audio), text: sitrepScript } : null;
    } catch (error) { 
        return null; 
    }
};

export const checkCloudConnection = async (): Promise<{ status: 'connected' | 'error', latency: number }> => {
    const start = Date.now();
    try {
        await callGeminiWithRetry((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: "ping",
            config: { maxOutputTokens: 1 }
        }));
        return { status: 'connected', latency: Date.now() - start };
    } catch (e) {
        return { status: 'error', latency: 0 };
    }
};

export const getDisasterNews = async (locationQuery?: string): Promise<{title: string, url?: string}[]> => {
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>((ai) => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Current disaster news ${locationQuery ? `for ${locationQuery}` : 'global'}.`,
            config: { tools: [{ googleSearch: {} }] }
        }));
        const lines = (response.text || "").split('\n').filter(l => l.length > 5);
        const urls: string[] = [];
        (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).forEach((c: any) => { if (c.web?.uri) urls.push(c.web.uri); });
        return lines.slice(0, 3).map((line, i) => ({ 
          title: line.replace(/^[\d\-\*\.]+\s*/, ''), 
          url: urls[i] || urls[0] 
        }));
    } catch (e) { return []; }
}