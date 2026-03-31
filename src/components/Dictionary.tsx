import React, { useState, useRef } from "react";
import { Plus, Trash2, Search, BookOpen, Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { Word, WordCategory, UserStats } from "../types";
import { translateWord } from "../services/gemini";
import { motion, AnimatePresence } from "framer-motion";

interface DictionaryProps {
  words: Word[];
  onAdd: (spanish: string, english: string, category: WordCategory) => void;
  onDelete: (id: string) => void;
  onSuggest: () => Promise<void>;
  isSuggesting: boolean;
  suggestionSettings: UserStats["suggestionSettings"];
  onUpdateSettings: (settings: Partial<UserStats["suggestionSettings"]>) => void;
}

export const Dictionary: React.FC<DictionaryProps> = ({ 
  words, 
  onAdd, 
  onDelete, 
  onSuggest, 
  isSuggesting,
  suggestionSettings,
  onUpdateSettings
}) => {
  const [newSpanish, setNewSpanish] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [category, setCategory] = useState<WordCategory>("noun");
  const [search, setSearch] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (typeof SpeechRecognition !== 'function') {
        throw new Error("SpeechRecognition is not a constructor");
      }
      recognitionRef.current = new (SpeechRecognition as any)();
    } catch (e) {
      console.error("Failed to instantiate SpeechRecognition:", e);
      alert("Speech recognition could not be started. Your browser might have restrictions.");
      return;
    }
    recognitionRef.current.lang = "es-ES";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewSpanish(transcript);
      
      // Auto-translate
      setIsListening(false);
      const translation = await translateWord(transcript);
      setNewEnglish(translation);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const filteredWords = words.filter(
    (w) =>
      w.spanish.toLowerCase().includes(search.toLowerCase()) ||
      w.english.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpanish && newEnglish) {
      onAdd(newSpanish, newEnglish, category);
      setNewSpanish("");
      setNewEnglish("");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="text-orange-500 w-5 h-5" />
          <h2 className="text-xl font-bold text-slate-800">Word Dictionary</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Spanish word..."
                value={newSpanish}
                onChange={(e) => setNewSpanish(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all pr-12"
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  isListening 
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title={isListening ? "Stop listening" : "Speak Spanish word"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <input
              type="text"
              placeholder="English translation..."
              value={newEnglish}
              onChange={(e) => setNewEnglish(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WordCategory)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="phrase">Phrase</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex-1 flex justify-end gap-2">
              <div className="relative group">
                <button
                  type="button"
                  onClick={onSuggest}
                  disabled={isSuggesting}
                  className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2 font-bold"
                >
                  {isSuggesting ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  AI Suggest
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className={`absolute -top-2 -right-2 p-1.5 rounded-full border-2 transition-all shadow-sm ${showAiSettings ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-purple-500 hover:border-purple-200'}`}
                  title="AI Suggestion Settings"
                >
                  <BookOpen className="w-3 h-3" />
                </button>

                <AnimatePresence>
                  {showAiSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-4 z-50 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">AI Settings</h4>
                        <button onClick={() => setShowAiSettings(false)} className="text-slate-400 hover:text-slate-600">
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                          <span className="text-xs font-black text-purple-500">{(suggestionSettings?.difficultyAdjustment ?? 50)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={suggestionSettings?.difficultyAdjustment ?? 50}
                          onChange={(e) => onUpdateSettings({ difficultyAdjustment: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                          <span>Easy</span>
                          <span>Hard</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Category Filter</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["all", "noun", "verb", "adjective", "phrase"].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => onUpdateSettings({ preferredCategory: cat as any })}
                              className={`px-2 py-1.5 rounded-lg text-[9px] font-bold capitalize transition-all border ${
                                (suggestionSettings?.preferredCategory ?? "all") === cat
                                  ? "bg-purple-500 border-purple-500 text-white shadow-md shadow-purple-100"
                                  : "bg-white border-slate-100 text-slate-500 hover:border-purple-200"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-slate-400 leading-relaxed italic border-t border-slate-50 pt-4">
                        AI considers your level, mastery, and these settings. Words won't repeat for 3 months.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 font-bold"
              >
                <Plus className="w-4 h-4" />
                Add Word
              </button>
            </div>
          </div>
        </form>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filteredWords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">
            No words found. Add some to start learning!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-3">Spanish</th>
                <th className="px-6 py-3">English</th>
                <th className="px-6 py-3">Mastery</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word) => (
                <tr key={word.id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{word.spanish}</td>
                  <td className="px-6 py-4 text-slate-600">{word.english}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-400 rounded-full" 
                          style={{ width: `${word.masteryScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{word.masteryScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(word.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
