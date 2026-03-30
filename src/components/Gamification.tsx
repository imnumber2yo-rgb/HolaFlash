import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Zap, Star, RefreshCw, Lock } from "lucide-react";
import { UserStats, Mascot } from "../types";
import { MASCOTS, COLLECTABLES } from "../constants/mascots";
import { cn } from "../lib/utils";

interface GamificationProps {
  stats: UserStats;
  onMascotChange: (mascotId: string) => void;
  onUpdateGoal: (goal: number) => void;
  lastUnlockedId: string | null;
  onClearUnlocked: () => void;
  onViewCollectables: () => void;
  masteredCount: number;
}

export const Gamification: React.FC<GamificationProps> = ({ 
  stats, 
  onMascotChange, 
  onUpdateGoal,
  lastUnlockedId,
  onClearUnlocked,
  onViewCollectables,
  masteredCount
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(stats.dailyXPGoal.toString());
  const currentMascot = MASCOTS.find((m) => m.id === stats.selectedMascotId) || MASCOTS[0];
  const xpToNextLevel = stats.level * 100;
  const levelProgress = (stats.xp / xpToNextLevel) * 100;
  
  const dailyProgress = Math.min((stats.dailyXPProgress / stats.dailyXPGoal) * 100, 100);
  const isGoalCompleted = stats.dailyXPProgress >= stats.dailyXPGoal;

  const unlockedItem = lastUnlockedId ? COLLECTABLES.find(c => c.id === lastUnlockedId) : null;

  const recentlyUnlocked = COLLECTABLES
    .filter(c => stats.unlockedCollectables.includes(c.id))
    .slice(-3)
    .reverse();

  const nextMilestone = COLLECTABLES.find(c => !stats.unlockedCollectables.includes(c.id));

  const handleNextMascot = () => {
    const currentIndex = MASCOTS.findIndex((m) => m.id === currentMascot.id);
    const nextIndex = (currentIndex + 1) % MASCOTS.length;
    onMascotChange(MASCOTS[nextIndex].id);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal = parseInt(newGoal);
    if (!isNaN(goal) && goal > 0) {
      onUpdateGoal(goal);
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Character Card */}
      <div className={cn(
        "bg-gradient-to-br rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-500",
        currentMascot.color
      )}>
        <div className="relative z-10 flex items-center gap-4">
          <motion.div 
            key={currentMascot.id}
            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30"
          >
            <motion.span 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-4xl"
            >
              {currentMascot.emoji}
            </motion.span>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{currentMascot.name}</h3>
              <button 
                onClick={handleNextMascot}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Switch Mascot"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/80 text-xs italic mb-1">{currentMascot.personality}</p>
            <p className="text-white font-medium text-sm">"{currentMascot.catchphrase}"</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span>Level {stats.level}</span>
            <span>{stats.xp} / {xpToNextLevel} XP</span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Daily Goal Section */}
        <div className="mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Trophy className={cn("w-4 h-4", isGoalCompleted ? "text-yellow-300" : "text-white/60")} />
              <span className="text-xs font-bold uppercase tracking-wider">Daily Goal</span>
            </div>
            {isEditingGoal ? (
              <form onSubmit={handleGoalSubmit} className="flex gap-2">
                <input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-16 bg-white/20 border-none rounded px-2 py-0.5 text-xs text-white focus:ring-1 focus:ring-white outline-none"
                  autoFocus
                />
                <button type="submit" className="text-[10px] font-bold">SET</button>
              </form>
            ) : (
              <button 
                onClick={() => setIsEditingGoal(true)}
                className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition-colors"
              >
                {stats.dailyXPGoal} XP
              </button>
            )}
          </div>
          
          <div className="flex justify-between text-[10px] mb-1 font-medium">
            <span>{stats.dailyXPProgress} / {stats.dailyXPGoal} XP</span>
            {isGoalCompleted && <span className="text-yellow-300 font-bold">COMPLETED! ✨</span>}
          </div>
          
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div 
              className={cn("h-full transition-colors duration-500", isGoalCompleted ? "bg-yellow-300" : "bg-white/60")}
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Trophy size={120} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Streak</p>
            <p className="text-lg font-bold text-slate-800">{stats.streak} Days</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-yellow-50 text-yellow-500 rounded-lg">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total XP</p>
            <p className="text-lg font-bold text-slate-800">{stats.xp}</p>
          </div>
        </div>
      </div>

      {/* Unlock Animation Overlay */}
      <AnimatePresence>
        {unlockedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
            onClick={onClearUnlocked}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: -50, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 text-center shadow-2xl max-w-sm w-full border-4 border-yellow-400 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Background Rays */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -z-10 opacity-10"
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#eab308_0deg,transparent_20deg,#eab308_40deg,transparent_60deg)]" />
              </motion.div>

              <div className="mb-6 relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl mb-4"
                >
                  {unlockedItem.emoji}
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -top-4 -right-4 bg-yellow-400 text-white p-2 rounded-full shadow-lg"
                >
                  <Star className="w-6 h-6 fill-current" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">New Collectable!</h2>
              <p className="text-lg font-bold text-yellow-600 mb-4">{unlockedItem.name}</p>
              <p className="text-slate-500 text-sm mb-8">{unlockedItem.description}</p>

              <button 
                onClick={onClearUnlocked}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collectables Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500 w-5 h-5" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Collectables</h3>
          </div>
          <button 
            onClick={onViewCollectables}
            className="text-[10px] font-black text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-widest"
          >
            View All
          </button>
        </div>

        {/* Recently Unlocked */}
        {recentlyUnlocked.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recently Unlocked</p>
            <div className="flex gap-3">
              {recentlyUnlocked.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 shadow-sm cursor-help relative group"
                >
                  {item.emoji}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                    {item.name}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Milestone</p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl grayscale opacity-30 relative">
                {nextMilestone.emoji}
                <Lock className="absolute w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-700">{nextMilestone.name}</p>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                  <span>{masteredCount} / {nextMilestone.requirementValue} Words</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((masteredCount / nextMilestone.requirementValue) * 100, 100)}%` }}
                    className="h-full bg-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
