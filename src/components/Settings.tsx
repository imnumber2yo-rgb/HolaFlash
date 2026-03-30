import React from "react";
import { Settings2, Save, RotateCcw } from "lucide-react";
import { SRSSettings } from "../types";

interface SettingsProps {
  settings: SRSSettings;
  onUpdate: (settings: SRSSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const handleReset = () => {
    const defaultSettings: SRSSettings = {
      initialEaseFactor: 2.5,
      intervalMultiplier: 1.0,
      startingInterval: 1,
    };
    setLocalSettings(defaultSettings);
    onUpdate(defaultSettings);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <div className="inline-flex p-3 bg-slate-100 text-slate-600 rounded-2xl mb-2">
          <Settings2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">System Settings</h2>
        <p className="text-slate-500 font-medium">Customize your learning algorithm parameters.</p>
      </header>

      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 space-y-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">SRS Parameters</h3>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Defaults
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Initial Ease Factor</label>
                <span className="text-sm font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  {localSettings.initialEaseFactor.toFixed(1)}
                </span>
              </div>
              <input 
                type="range" 
                min="1.3" 
                max="4.0" 
                step="0.1"
                value={localSettings.initialEaseFactor}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, initialEaseFactor: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Controls how quickly the interval grows for correctly answered words. Higher means faster growth.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Interval Multiplier</label>
                <span className="text-sm font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  {localSettings.intervalMultiplier.toFixed(1)}x
                </span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1"
                value={localSettings.intervalMultiplier}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, intervalMultiplier: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Global multiplier applied to all calculated intervals. 0.5x makes reviews twice as frequent.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Starting Interval (Days)</label>
                <span className="text-sm font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  {localSettings.startingInterval} Day{localSettings.startingInterval !== 1 ? 's' : ''}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="7" 
                step="1"
                value={localSettings.startingInterval}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, startingInterval: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                The first interval assigned to a word after it is successfully learned.
              </p>
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>
    </div>
  );
};
