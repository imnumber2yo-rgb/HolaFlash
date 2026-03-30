import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Settings2
} from "lucide-react";
import { Word, UserStats } from "./types";
import { Flashcard } from "./components/Flashcard";
import { Dictionary } from "./components/Dictionary";
import { SmartTest } from "./components/SmartTest";
import { Gamification } from "./components/Gamification";
import { CollectablesPage } from "./components/CollectablesPage";
import { Settings } from "./components/Settings";
import { cn } from "./lib/utils";
import { suggestNewWord, generateExampleSentence, generateNewCollectable } from "./services/gemini";
import { COLLECTABLES } from "./constants/mascots";

const INITIAL_WORDS: Word[] = [
  { id: "1", spanish: "Hola", english: "Hello", category: "phrase", addedDate: Date.now(), nextReviewDate: Date.now(), interval: 0, easeFactor: 2.5, masteryScore: 0, testCount: 0 },
  { id: "2", spanish: "Gracias", english: "Thank you", category: "phrase", addedDate: Date.now(), nextReviewDate: Date.now(), interval: 0, easeFactor: 2.5, masteryScore: 0, testCount: 0 },
  { id: "3", spanish: "Por favor", english: "Please", category: "phrase", addedDate: Date.now(), nextReviewDate: Date.now(), interval: 0, easeFactor: 2.5, masteryScore: 0, testCount: 0 },
  { id: "4", spanish: "Adiós", english: "Goodbye", category: "phrase", addedDate: Date.now(), nextReviewDate: Date.now(), interval: 0, easeFactor: 2.5, masteryScore: 0, testCount: 0 },
  { id: "5", spanish: "Amigo", english: "Friend", category: "noun", addedDate: Date.now(), nextReviewDate: Date.now(), interval: 0, easeFactor: 2.5, masteryScore: 0, testCount: 0 },
];

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  selectedMascotId: "paco",
  dailyXPGoal: 50,
  dailyXPProgress: 0,
  lastGoalResetDate: Date.now(),
  unlockedCollectables: [],
  categoryMastery: {
    noun: 0,
    verb: 0,
    adjective: 0,
    phrase: 0,
    other: 0
  },
  aiGeneratedCollectables: [],
  srsSettings: {
    initialEaseFactor: 2.5,
    intervalMultiplier: 1.0,
    startingInterval: 1
  }
};

export default function App() {
  const [words, setWords] = useState<Word[]>(() => {
    const saved = localStorage.getItem("holaflash_words");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration for old data without SRS fields
      return parsed.map((w: any) => ({
        ...w,
        nextReviewDate: w.nextReviewDate || Date.now(),
        interval: w.interval || 0,
        easeFactor: w.easeFactor || 2.5,
      }));
    }
    return INITIAL_WORDS;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem("holaflash_stats");
    const initial = saved ? JSON.parse(saved) : INITIAL_STATS;
    // Migration for new fields
    return {
      ...INITIAL_STATS,
      ...initial,
      dailyXPGoal: initial.dailyXPGoal || 50,
      dailyXPProgress: initial.dailyXPProgress || 0,
      lastGoalResetDate: initial.lastGoalResetDate || Date.now(),
      unlockedCollectables: initial.unlockedCollectables || [],
      categoryMastery: initial.categoryMastery || INITIAL_STATS.categoryMastery,
      aiGeneratedCollectables: initial.aiGeneratedCollectables || [],
      srsSettings: initial.srsSettings || INITIAL_STATS.srsSettings,
    };
  });

  const [archivedWords, setArchivedWords] = useState<string[]>(() => {
    const saved = localStorage.getItem("holaflash_archived");
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<"learn" | "test" | "dictionary" | "collectables" | "practice" | "settings">("learn");
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionLength, setSessionLength] = useState<5 | 10 | 15>(5);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [sessionCompletedIds, setSessionCompletedIds] = useState<string[]>([]);
  const [lastUnlockedId, setLastUnlockedId] = useState<string | null>(null);

  // Collectables Unlocking Logic
  useEffect(() => {
    const masteredCount = words.filter(w => w.masteryScore >= 95).length + archivedWords.length;
    
    // Update category mastery counts
    const categoryCounts: Record<string, number> = { noun: 0, verb: 0, adjective: 0, phrase: 0, other: 0 };
    words.forEach(w => {
      if (w.masteryScore >= 95) categoryCounts[w.category]++;
    });

    const allCollectables = [...COLLECTABLES, ...stats.aiGeneratedCollectables];
    const newlyUnlocked = allCollectables
      .filter(c => {
        if (stats.unlockedCollectables.includes(c.id)) return false;
        
        if (c.requirementType === "total_mastery") {
          return masteredCount >= c.requirementValue;
        } else if (c.requirementType === "category_mastery") {
          return (categoryCounts[c.category!] || 0) >= c.requirementValue;
        } else if (c.requirementType === "streak") {
          return stats.streak >= c.requirementValue;
        } else if (c.requirementType === "ai_milestone") {
          return stats.xp >= c.requirementValue;
        } else if (c.requirementType === "event") {
          const today = new Date().toISOString().slice(5, 10);
          return c.eventDate === today;
        }
        return false;
      })
      .map(c => c.id);

    if (newlyUnlocked.length > 0) {
      setStats(prev => ({
        ...prev,
        unlockedCollectables: [...new Set([...prev.unlockedCollectables, ...newlyUnlocked])],
        categoryMastery: categoryCounts as any
      }));
      setLastUnlockedId(newlyUnlocked[newlyUnlocked.length - 1]);
    }
  }, [words, archivedWords, stats.unlockedCollectables, stats.streak, stats.xp, stats.aiGeneratedCollectables]);

  // AI Collectable Generation Logic
  useEffect(() => {
    const checkForNewAICollectable = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastCheck = localStorage.getItem("holaflash_last_ai_check");
      
      if (lastCheck !== today || (stats.xp > 0 && stats.xp % 1000 === 0)) {
        try {
          const newCollectable = await generateNewCollectable(stats, today);
          
          if (!stats.aiGeneratedCollectables.find(c => c.id === newCollectable.id)) {
            setStats(prev => ({
              ...prev,
              aiGeneratedCollectables: [...prev.aiGeneratedCollectables, newCollectable]
            }));
            localStorage.setItem("holaflash_last_ai_check", today);
          }
        } catch (error) {
          console.error("Failed to generate AI collectable:", error);
        }
      }
    };

    if (stats.xp > 0) {
      checkForNewAICollectable();
    }
  }, [stats.xp]);

  // Daily Reset Logic
  useEffect(() => {
    const now = new Date();
    const lastReset = new Date(stats.lastGoalResetDate || 0);
    
    if (now.toDateString() !== lastReset.toDateString()) {
      setStats(prev => ({
        ...prev,
        dailyXPProgress: 0,
        lastGoalResetDate: Date.now(),
      }));
    }
  }, [stats.lastGoalResetDate]);

  // Reset session when view changes or session length changes
  useEffect(() => {
    setSessionCompletedIds([]);
    setCurrentIndex(0);
  }, [view, sessionLength]);

  // Persistence
  useEffect(() => {
    localStorage.setItem("holaflash_words", JSON.stringify(words));
  }, [words]);

  useEffect(() => {
    localStorage.setItem("holaflash_stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem("holaflash_archived", JSON.stringify(archivedWords));
  }, [archivedWords]);

  // Mastery Logic: Remove words mastered after 30 days
  useEffect(() => {
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    const activeWords = words.filter(word => {
      const isOldEnough = (now - word.addedDate) >= thirtyDaysInMs;
      const isMastered = word.masteryScore >= 95;
      return !(isOldEnough && isMastered);
    });

    if (activeWords.length !== words.length) {
      const masteredWords = words.filter(word => {
        const isOldEnough = (now - word.addedDate) >= thirtyDaysInMs;
        const isMastered = word.masteryScore >= 95;
        return isOldEnough && isMastered;
      });
      
      setWords(activeWords);
      setArchivedWords(prev => [...new Set([...prev, ...masteredWords.map(w => w.spanish)])]);
      
      const masteredCount = words.length - activeWords.length;
      addXP(masteredCount * 50);
    }
  }, []);

  // Sentence Generation for existing words
  useEffect(() => {
    const wordsWithoutSentences = words.filter(w => !w.exampleSentence);
    if (wordsWithoutSentences.length > 0) {
      const generateNext = async () => {
        const word = wordsWithoutSentences[0];
        try {
          const { exampleSentence, sentenceTranslation } = await generateExampleSentence(word.spanish, word.english);
          setWords(prev => prev.map(w => w.id === word.id ? { ...w, exampleSentence, sentenceTranslation } : w));
        } catch (e) {
          console.error("Failed to generate sentence for", word.spanish);
        }
      };
      generateNext();
    }
  }, [words]);

  const addXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      return { 
        ...prev, 
        xp: newXP, 
        level: newLevel,
        dailyXPProgress: prev.dailyXPProgress + amount
      };
    });
  };

  const handleUpdateGoal = (goal: number) => {
    setStats(prev => ({ ...prev, dailyXPGoal: goal }));
  };

  const handleAddWord = async (spanish: string, english: string, category: any = "other") => {
    const newWord: Word = {
      id: Math.random().toString(36).substr(2, 9),
      spanish,
      english,
      category,
      addedDate: Date.now(),
      nextReviewDate: Date.now(),
      interval: 0,
      easeFactor: 2.5,
      masteryScore: 0,
      testCount: 0,
    };
    setWords(prev => [...prev, newWord]);
    addXP(10);

    // Generate sentence asynchronously
    try {
      const { exampleSentence, sentenceTranslation } = await generateExampleSentence(spanish, english);
      setWords(prev => prev.map(w => w.id === newWord.id ? { ...w, exampleSentence, sentenceTranslation } : w));
    } catch (e) {
      console.error("Failed to generate sentence for", spanish);
    }
  };

  const handleAISuggest = async () => {
    setIsSuggesting(true);
    try {
      const existing = words.map(w => w.spanish);
      const suggestion = await suggestNewWord(existing, archivedWords, stats.level);
      if (suggestion) {
        const newWord: Word = {
          id: Math.random().toString(36).substr(2, 9),
          spanish: suggestion.spanish,
          english: suggestion.english,
          category: suggestion.category,
          exampleSentence: suggestion.exampleSentence,
          sentenceTranslation: suggestion.sentenceTranslation,
          addedDate: Date.now(),
          nextReviewDate: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          masteryScore: 0,
          testCount: 0,
        };
        setWords(prev => [...prev, newWord]);
        addXP(10);
      }
    } catch (error) {
      console.error("AI Suggestion failed:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDeleteWord = (id: string) => {
    const wordToDelete = words.find(w => w.id === id);
    if (wordToDelete) {
      setArchivedWords(prev => [...new Set([...prev, wordToDelete.spanish])]);
    }
    setWords(words.filter(w => w.id !== id));
  };

  const handleTestResult = (wordId: string, score: number) => {
    setWords(prev => prev.map(w => {
      if (w.id === wordId) {
        // SRS Logic (Simplified SM-2)
        let newInterval = w.interval;
        let newEaseFactor = w.easeFactor;
        
        if (score >= 80) { // Correct
          if (w.testCount === 0) newInterval = stats.srsSettings.startingInterval;
          else if (w.testCount === 1) newInterval = 6;
          else newInterval = Math.round(w.interval * w.easeFactor * stats.srsSettings.intervalMultiplier);
          
          // Adjust ease factor based on performance (q = score/20)
          const q = score / 20;
          newEaseFactor = Math.max(1.3, w.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

          // Mark as completed for this session
          setSessionCompletedIds(prev => [...new Set([...prev, wordId])]);
        } else { // Incorrect
          newInterval = stats.srsSettings.startingInterval;
          newEaseFactor = Math.max(1.3, w.easeFactor - 0.2);
        }

        const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;
        const newMastery = Math.min(100, Math.max(0, (w.masteryScore * 0.7) + (score * 0.3)));

        return { 
          ...w, 
          masteryScore: Math.round(newMastery), 
          testCount: w.testCount + 1,
          lastTestedDate: Date.now(),
          nextReviewDate: nextReview,
          interval: newInterval,
          easeFactor: newEaseFactor
        };
      }
      return w;
    }));
    addXP(Math.round(score / 2));
  };

  // Filter words for session: prioritize due words, then filter out completed ones
  const sessionWords = useMemo(() => {
    const now = Date.now();
    const sorted = [...words].sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    const pool = sorted.filter(w => !sessionCompletedIds.includes(w.id));
    return pool.slice(0, sessionLength);
  }, [words, sessionLength, sessionCompletedIds]);

  const handleMascotChange = (mascotId: string) => {
    setStats(prev => ({ ...prev, selectedMascotId: mascotId }));
  };

  const currentWord = useMemo(() => {
    if (sessionWords.length === 0) return null;
    return sessionWords[currentIndex % sessionWords.length];
  }, [sessionWords, currentIndex]);

  const overallMastery = useMemo(() => {
    if (words.length === 0) return 0;
    return words.reduce((acc, w) => acc + w.masteryScore, 0) / words.length;
  }, [words]);

  // Difficulty is a mix of level and overall mastery
  const currentDifficulty = useMemo(() => {
    const levelFactor = Math.min(50, stats.level * 5);
    const masteryFactor = overallMastery / 2;
    return Math.min(100, Math.round(levelFactor + masteryFactor));
  }, [stats.level, overallMastery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">HolaFlash</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: "learn", icon: GraduationCap, label: "Learn" },
              { id: "test", icon: BrainCircuit, label: "Smart Test" },
              { id: "dictionary", icon: BookOpen, label: "Dictionary" },
              { id: "collectables", icon: Trophy, label: "Hall of Fame" },
              { id: "settings", icon: Settings2, label: "Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as any);
                  setCurrentIndex(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  view === item.id 
                    ? "bg-white text-orange-500 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <Settings2 className="w-4 h-4 text-slate-400" />
              <select 
                value={sessionLength}
                onChange={(e) => setSessionLength(Number(e.target.value) as any)}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value={5}>5 Items</option>
                <option value={10}>10 Items</option>
                <option value={15}>15 Items</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-black">Lvl {stats.level}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Gamification */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <Gamification 
              stats={stats} 
              onMascotChange={handleMascotChange} 
              onUpdateGoal={handleUpdateGoal}
              lastUnlockedId={lastUnlockedId}
              onClearUnlocked={() => setLastUnlockedId(null)}
              onViewCollectables={() => setView("collectables")}
              masteredCount={words.filter(w => w.masteryScore >= 95).length + archivedWords.length}
            />
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-9 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              {view === "collectables" && (
                <motion.div
                  key="collectables"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CollectablesPage 
                    stats={stats} 
                    masteredCount={words.filter(w => w.masteryScore >= 95).length + archivedWords.length} 
                  />
                </motion.div>
              )}
              {view === "learn" && (
                <motion.div
                  key="learn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Daily Practice</h2>
                    <p className="text-slate-500">Optimized with Spaced Repetition (SRS).</p>
                  </div>

                  {sessionWords.length > 0 && currentWord ? (
                    <>
                      <Flashcard 
                        key={currentWord.id}
                        spanish={currentWord.spanish} 
                        english={currentWord.english} 
                        onComplete={() => setSessionCompletedIds(prev => [...new Set([...prev, currentWord.id])])}
                      />
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setCurrentIndex(prev => (prev - 1 + sessionWords.length) % sessionWords.length)}
                          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div className="text-sm font-bold text-slate-400 bg-white px-6 py-2 rounded-full border border-slate-100">
                          {currentIndex + 1} / {sessionWords.length}
                        </div>
                        <button 
                          onClick={() => setCurrentIndex(prev => (prev + 1) % sessionWords.length)}
                          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 italic">No words to learn. Add some in the dictionary!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {view === "test" && (
                <motion.div
                  key="test"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Smart Test</h2>
                    <p className="text-slate-500">Prioritizing words due for review.</p>
                  </div>

                  {sessionWords.length > 0 && currentWord ? (
                    <SmartTest 
                      word={currentWord}
                      selectedMascotId={stats.selectedMascotId}
                      difficulty={currentDifficulty}
                      onResult={(score) => handleTestResult(currentWord.id, score)}
                      onNext={() => setCurrentIndex(prev => (prev + 1) % sessionWords.length)}
                    />
                  ) : (
                    <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 italic">Add words to start testing!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {view === "dictionary" && (
                <motion.div
                  key="dictionary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Dictionary 
                    words={words} 
                    onAdd={handleAddWord} 
                    onDelete={handleDeleteWord} 
                    onSuggest={handleAISuggest}
                    isSuggesting={isSuggesting}
                  />
                </motion.div>
              )}
              {view === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Settings 
                    settings={stats.srsSettings} 
                    onUpdate={(newSettings) => setStats(prev => ({ ...prev, srsSettings: newSettings }))} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-around items-center z-50">
        {[
          { id: "learn", icon: GraduationCap },
          { id: "test", icon: BrainCircuit },
          { id: "dictionary", icon: BookOpen },
          { id: "settings", icon: Settings2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={cn(
              "p-2 rounded-xl transition-all",
              view === item.id ? "text-orange-500 bg-orange-50" : "text-slate-400"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
}
