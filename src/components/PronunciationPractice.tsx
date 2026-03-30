import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Word } from "../types";
import { getSpanishAudio, evaluatePronunciation } from "../services/gemini";
import { cn } from "../lib/utils";

interface PronunciationPracticeProps {
  words: Word[];
  onComplete: (score: number) => void;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({ words, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; text: string; isCorrect: boolean } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const recognitionRef = useRef<any>(null);
  const currentWord = words[currentIndex % words.length];

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
    
    recognitionRef.current.onresult = async (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      handleEvaluate(result);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleEvaluate = async (text: string) => {
    setIsEvaluating(true);
    try {
      const result = await evaluatePronunciation(currentWord.spanish, text);
      setFeedback({
        score: result.score,
        text: result.feedback,
        isCorrect: result.isCorrect
      });
      if (result.isCorrect) {
        onComplete(result.score);
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSpeak = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    const base64Audio = await getSpanishAudio(currentWord.spanish);
    if (base64Audio) {
      try {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioCtx.createBuffer(1, floatData.length, 24000);
        buffer.getChannelData(0).set(floatData);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsPlaying(false);
          audioCtx.close();
        };
        source.start();
      } catch (err) {
        console.error("Audio play failed:", err);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const nextWord = () => {
    setCurrentIndex(prev => prev + 1);
    setTranscript("");
    setFeedback(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Pronunciation Lab</h2>
        <p className="text-slate-500">Speak clearly into your microphone to practice.</p>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <Sparkles className="text-orange-200 w-12 h-12" />
        </div>

        <div className="flex flex-col items-center gap-8 py-8">
          <div className="text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-4 py-1.5 rounded-full">
              Target Word
            </span>
            <h3 className="text-6xl font-black text-slate-800 tracking-tight">{currentWord.spanish}</h3>
            <p className="text-xl text-slate-400 font-medium">{currentWord.english}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlaybackRate(prev => prev === 1.0 ? 0.6 : 1.0)}
              className={cn(
                "px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border-2",
                playbackRate === 0.6 
                  ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
              )}
            >
              Slow
            </button>

            <button
              onClick={handleSpeak}
              disabled={isPlaying}
              className="p-4 rounded-2xl bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-all disabled:opacity-50"
            >
              <Volume2 className={cn("w-8 h-8", isPlaying && "animate-pulse")} />
            </button>

            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg",
                isListening 
                  ? "bg-red-500 text-white animate-pulse scale-110" 
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
            >
              {isListening ? <MicOff size={40} /> : <Mic size={40} />}
            </button>

            <button
              onClick={nextWord}
              className="p-4 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
            >
              <RefreshCw className="w-8 h-8" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">You said:</p>
                <p className="text-2xl font-bold text-slate-700 italic">"{transcript}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "w-full p-6 rounded-3xl flex flex-col items-center gap-4 text-center",
                  feedback.isCorrect ? "bg-green-50 border border-green-100" : "bg-orange-50 border border-orange-100"
                )}
              >
                <div className="flex items-center gap-3">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                  ) : (
                    <XCircle className="text-orange-500 w-8 h-8" />
                  )}
                  <span className="text-3xl font-black text-slate-800">{feedback.score}%</span>
                </div>
                <p className="font-bold text-slate-700">{feedback.text}</p>
                
                {feedback.isCorrect && (
                  <button
                    onClick={nextWord}
                    className="mt-2 px-8 py-3 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all shadow-md"
                  >
                    Next Word
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isEvaluating && (
            <div className="flex items-center gap-3 text-orange-500 font-bold animate-pulse">
              <Sparkles className="w-5 h-5" />
              AI is evaluating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
