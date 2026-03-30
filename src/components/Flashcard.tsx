import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, CheckCircle, XCircle } from "lucide-react";
import { getSpanishAudio } from "../services/gemini";

interface FlashcardProps {
  spanish: string;
  english: string;
  onComplete?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ spanish, english, onComplete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    const base64Audio = await getSpanishAudio(spanish);
    if (base64Audio) {
      try {
        // Decode base64 to binary
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert 16-bit PCM to Float32
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }

        // Play using AudioContext
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioCtx.createBuffer(1, floatData.length, 24000);
        buffer.getChannelData(0).set(floatData);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
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

  return (
    <div 
      className="relative w-full max-w-md h-64 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-2xl shadow-xl border-2 border-orange-100 flex flex-col items-center justify-center p-8">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Spanish</span>
          <h2 className="text-4xl font-bold text-slate-800 text-center">{spanish}</h2>
          <button
            onClick={handleSpeak}
            disabled={isPlaying}
            className="mt-6 p-3 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <Volume2 className={isPlaying ? "animate-pulse" : ""} />
          </button>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden bg-orange-500 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8"
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-orange-100 mb-4">English</span>
          <h2 className="text-4xl font-bold text-white text-center mb-6">{english}</h2>
          {onComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="px-6 py-2 bg-white text-orange-600 rounded-full font-bold hover:bg-orange-50 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Got it!
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
