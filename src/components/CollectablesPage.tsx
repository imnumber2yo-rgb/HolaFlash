import React from "react";
import { motion } from "motion/react";
import { Star, Trophy, Lock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { COLLECTABLES } from "../constants/mascots";
import { UserStats } from "../types";
import { cn } from "../lib/utils";

interface CollectablesPageProps {
  stats: UserStats;
  masteredCount: number;
}

export const CollectablesPage: React.FC<CollectablesPageProps> = ({ stats, masteredCount }) => {
  const allCollectables = [...COLLECTABLES, ...stats.aiGeneratedCollectables];
  const unlocked = allCollectables.filter(c => stats.unlockedCollectables.includes(c.id));
  const locked = allCollectables.filter(c => !stats.unlockedCollectables.includes(c.id));
  const nextMilestone = locked[0];

  const getRequirementText = (item: any) => {
    switch (item.requirementType) {
      case 'total_mastery':
        return `${item.requirementValue} Words`;
      case 'category_mastery':
        return `${item.requirementValue} ${item.category}s`;
      case 'streak':
        return `${item.requirementValue} Day Streak`;
      case 'ai_milestone':
        return `${item.requirementValue} XP`;
      case 'event':
        return `Event: ${item.eventDate || 'Special'}`;
      default:
        return 'Special Achievement';
    }
  };

  const getProgressValue = (item: any) => {
    switch (item.requirementType) {
      case 'total_mastery':
        return masteredCount;
      case 'category_mastery':
        return stats.categoryMastery[item.category as any] || 0;
      case 'streak':
        return stats.streak;
      case 'ai_milestone':
        return stats.xp;
      case 'event':
        return 0; // Events are usually binary (unlocked or not)
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-4 bg-yellow-100 text-yellow-600 rounded-3xl mb-4"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight">Hall of Fame</h1>
        <p className="text-slate-500 max-w-md mx-auto font-medium">
          You've mastered <span className="text-orange-500 font-bold">{masteredCount}</span> words. 
          Collect them all to become a Spanish legend!
        </p>
      </header>

      {/* Next Milestone Card */}
      {nextMilestone && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30 text-6xl shadow-inner relative">
              <span className="grayscale opacity-50">{nextMilestone.emoji}</span>
              <Lock className="absolute w-8 h-8 text-white/80" />
              {nextMilestone.isAIGenerated && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg" title="AI Generated">
                  <Sparkles size={16} />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-200 mb-2 block">Next Milestone</span>
              <h2 className="text-3xl font-black mb-2">{nextMilestone.name}</h2>
              <p className="text-orange-100 font-medium mb-6">{nextMilestone.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Progress</span>
                  <span>{getProgressValue(nextMilestone)} / {nextMilestone.requirementValue} {nextMilestone.requirementType === 'ai_milestone' ? 'XP' : 'Units'}</span>
                </div>
                <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (getProgressValue(nextMilestone) / nextMilestone.requirementValue) * 100)}%` }}
                    className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative Background */}
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <Star size={240} />
          </div>
        </motion.div>
      )}

      {/* Grid Sections */}
      <div className="space-y-16">
        {/* Unlocked Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Unlocked ({unlocked.length})</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {unlocked.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -10, scale: 1.05 }}
                className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm text-center group transition-all hover:border-orange-200 hover:shadow-xl relative"
              >
                {item.isAIGenerated && (
                  <div className="absolute top-4 right-4 text-blue-400" title="AI Generated">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className="text-6xl mb-4 drop-shadow-md group-hover:scale-110 transition-transform">{item.emoji}</div>
                <h4 className="font-black text-slate-800 mb-1">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Locked Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 text-slate-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Locked ({locked.length})</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {locked.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200 text-center opacity-60 grayscale relative"
              >
                {item.isAIGenerated && (
                  <div className="absolute top-4 right-4 text-slate-300">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className="text-6xl mb-4 opacity-20">{item.emoji}</div>
                <h4 className="font-bold text-slate-400 mb-1">{item.name}</h4>
                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <ArrowRight className="w-3 h-3" />
                  {getRequirementText(item)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
