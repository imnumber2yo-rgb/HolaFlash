import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Loader2, CheckCircle2, XCircle, Info, Lightbulb, BrainCircuit } from "lucide-react";
import { evaluateAnswer } from "../services/gemini";
import { Word, Mascot } from "../types";
import { MASCOTS } from "../constants/mascots";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";

interface SmartTestProps {
  word: Word;
  selectedMascotId: string;
  difficulty: number; // 0 to 100
  onResult: (score: number) => void;
  onNext: () => void;
}

export const SmartTest: React.FC<SmartTestProps> = ({ word, selectedMascotId, difficulty, onResult, onNext }) => {
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showReaction, setShowReaction] = useState(false);
  const [result, setResult] = useState<{ 
    isCorrect: boolean; 
    feedback: string; 
    score: number;
    synonyms?: string[];
    commonErrors?: string[];
  } | null>(null);

  const currentMascot = MASCOTS.find((m) => m.id === selectedMascotId) || MASCOTS[0];

  if (!word) return null;

  const getPerformance = (score: number) => {
    if (score >= 90) return "excellent";
    if (score >= 70) return "good";
    return "poor";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isEvaluating) return;

    setIsEvaluating(true);
    const evalResult = await evaluateAnswer(word.spanish, word.english, answer, difficulty);
    setIsEvaluating(false);
    setResult(evalResult);
    onResult(evalResult.score);
    setShowReaction(true);

    if (evalResult.isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#fb923c", "#fdba74"]
      });
    }

    // Hide reaction after 3 seconds
    setTimeout(() => setShowReaction(false), 3000);
  };

  const handleNext = () => {
    setAnswer("");
    setResult(null);
    setShowReaction(false);
    onNext();
  };

  const performance = result ? getPerformance(result.score) : null;
  const isClose = result && result.score >= 50 && result.score < 70;

  // Adaptive sentence mode: probability increases with difficulty
  // Low difficulty (0) -> 20% chance
  // High difficulty (100) -> 60% chance
  const isSentenceMode = useMemo(() => {
    const threshold = 0.8 - (difficulty / 100) * 0.4;
    return word.exampleSentence && Math.random() > threshold;
  }, [word.id, difficulty]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-orange-100 max-w-lg w-full relative overflow-hidden">
      {/* Full-screen Mascot Reaction Overlay */}
      <AnimatePresence>
        {showReaction && result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              className="relative"
            >
              {/* Background Glow */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 blur-3xl rounded-full -z-10",
                  performance === "excellent" ? "bg-yellow-400" : 
                  performance === "good" ? "bg-green-400" : 
                  isClose ? "bg-orange-400" : "bg-red-400"
                )}
              />
              
              <div className="text-center">
                <motion.span 
                  animate={
                    performance === "excellent" ? {
                      y: [0, -50, 0],
                      scale: [1, 1.5, 1],
                      rotate: [0, 10, -10, 0]
                    } : performance === "good" ? {
                      x: [0, 30, -30, 0],
                      rotate: [0, 5, -5, 0]
                    } : {
                      y: [0, 20, 0],
                      opacity: [1, 0.7, 1],
                      scale: [1, 0.9, 1],
                      rotate: [0, -5, 5, 0]
                    }
                  }
                  transition={{ duration: 0.8, repeat: performance === "poor" ? 0 : Infinity }}
                  className="text-[12rem] block drop-shadow-2xl"
                >
                  {currentMascot.emoji}
                </motion.span>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white px-8 py-4 rounded-full shadow-2xl border-4 border-slate-100 mt-4"
                >
                  <p className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                    {performance === "excellent" ? "¡Increíble!" : 
                     performance === "good" ? "¡Muy Bien!" : 
                     isClose ? "¡Casi!" : "¡Sigue intentando!"}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Reaction (Small background version) */}
      <AnimatePresence>
        {result && !showReaction && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner z-0 opacity-20"
          >
            <span className="text-6xl grayscale">{currentMascot.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-8 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
            {isSentenceMode ? "Complete the Sentence" : "Translate to English"}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <BrainCircuit className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500">Diff: {difficulty}</span>
          </div>
        </div>
        {isSentenceMode ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-800 leading-relaxed italic">
              "{word.exampleSentence}"
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {word.sentenceTranslation}
            </p>
          </div>
        ) : (
          <h2 className="text-5xl font-black text-slate-800">{word.spanish}</h2>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4 relative z-10"
          >
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={isSentenceMode ? "Type the missing Spanish word..." : "Type your answer..."}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-orange-400 text-xl transition-all"
                disabled={isEvaluating}
              />
              <button
                type="submit"
                disabled={!answer.trim() || isEvaluating}
                className="absolute right-2 top-2 bottom-2 px-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isEvaluating ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs justify-center">
              <Sparkles className="w-3 h-3" />
              <span>AI Smart Evaluation enabled</span>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 relative z-10"
          >
            <div className={cn(
              "p-6 rounded-2xl transition-all duration-500",
              result.isCorrect ? "bg-green-50 text-green-700" : 
              isClose ? "bg-orange-50 text-orange-700 border-2 border-orange-200 animate-pulse" : 
              "bg-red-50 text-red-700"
            )}>
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={result.isCorrect ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : isClose ? {
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0]
                  } : {
                    x: [0, -10, 10, -10, 10, 0]
                  }}
                >
                  {result.isCorrect ? <CheckCircle2 className="w-12 h-12" /> : 
                   isClose ? <Info className="w-12 h-12 text-orange-500" /> : 
                   <XCircle className="w-12 h-12" />}
                </motion.div>
              </div>
              <p className="text-lg font-bold mb-1">
                {isClose ? "So close! Almost there." : result.feedback}
              </p>
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm"
              >
                Correct answer: <span className="font-black underline decoration-2 underline-offset-4">{isSentenceMode ? word.spanish : word.english}</span>
              </motion.div>
            </div>

            {/* Enhanced Feedback: Synonyms & Common Errors */}
            <div className="grid grid-cols-1 gap-3 text-left">
              {result.synonyms && result.synonyms.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <Lightbulb className="w-3 h-3" />
                    <span>Also try these</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.synonyms.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-white rounded-lg text-sm text-blue-600 border border-blue-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.commonErrors && result.commonErrors.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <Info className="w-3 h-3" />
                    <span>Common Pitfalls</span>
                  </div>
                  <ul className="text-sm text-amber-600 list-disc list-inside space-y-1">
                    {result.commonErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg"
            >
              Next Word
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
