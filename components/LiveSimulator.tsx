
import React, { useState } from 'react';
import { analyzeIncident, fileToBase64 } from '../services/geminiService';
import { IncidentPost, TriageLevel } from '../types';
import { Upload, Loader2, ShieldAlert } from './Icons';

interface LiveSimulatorProps {
  onNewIncident: (incident: IncidentPost) => void;
}

const LiveSimulator: React.FC<LiveSimulatorProps> = ({ onNewIncident }) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('Dispatcher Manual');
  const [location, setLocation] = useState('');
  const [manualStatus, setManualStatus] = useState<TriageLevel | 'AUTO'>('AUTO');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSimulate = async () => {
    if (!text && !file) return;

    setIsAnalyzing(true);
    
    try {
      let base64Image = undefined;
      if (file) {
        base64Image = await fileToBase64(file);
      }

      // Call Gemini to get reasoning and recommended action, even if status is manual
      const analysis = await analyzeIncident(text, base64Image);

      const finalStatus = manualStatus !== 'AUTO' ? manualStatus : analysis.urgency;
      const finalLocation = location.trim() !== '' ? location : (analysis.location_detected || 'Unknown');

      const newIncident: IncidentPost = {
        id: `inc-${Date.now()}`,
        author: author || '@manual_user',
        timestamp: Date.now(),
        text: text,
        imageUrl: previewUrl || undefined,
        status: finalStatus,
        riskScore: analysis.risk_score || 50,
        reasoning: analysis.reasoning, // Always use AI reasoning
        recommendedAction: analysis.recommended_action, // Always use AI recommendation
        location: finalLocation,
        source: 'Manual'
      };

      onNewIncident(newIncident);
      
      // Reset form
      setText('');
      setFile(null);
      setPreviewUrl(null);
    } catch (e) {
      alert("Injection failed. Check console.");
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-indigo-500/30 rounded-lg p-5 shadow-lg relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ShieldAlert className="w-24 h-24 text-indigo-500" />
      </div>

      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
        Manual Injection
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Inject incident data manually. AI will generate reasoning and recommendations.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Author / Source</label>
                <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Officer Smith"
                />
            </div>
            <div>
                 <label className="block text-xs font-medium text-slate-300 mb-1">Triage Level</label>
                 <select 
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as TriageLevel | 'AUTO')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 >
                     <option value="AUTO">🤖 Auto-Detect (AI)</option>
                     <option value={TriageLevel.RED}>🔴 RED (Critical)</option>
                     <option value={TriageLevel.YELLOW}>🟡 YELLOW (Warning)</option>
                     <option value={TriageLevel.GREEN}>🟢 GREEN (Info)</option>
                 </select>
            </div>
        </div>

        <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Location (Optional override)</label>
            <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave empty to let AI detect from text"
            />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Incident Report</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe the incident..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Attach Image (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-slate-600 rounded-md hover:bg-slate-700 transition text-sm text-slate-300 bg-slate-800">
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {file && <span className="text-xs text-emerald-400 truncate max-w-[150px]">{file.name}</span>}
          </div>
        </div>

        {previewUrl && (
          <div className="relative w-full h-32 bg-slate-900 rounded-md overflow-hidden border border-slate-700">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
            <button 
                onClick={() => { setFile(null); setPreviewUrl(null); }}
                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full text-xs hover:bg-red-500"
            >✕</button>
          </div>
        )}

        <button
          onClick={handleSimulate}
          disabled={isAnalyzing || (!text && !file)}
          className={`w-full py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2 ${
            isAnalyzing || (!text && !file)
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Injection...
            </>
          ) : (
            'Analyze & Inject'
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveSimulator;
